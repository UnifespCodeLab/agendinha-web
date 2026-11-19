<template>
  <v-container class="pa-0 h-100 position-fixed">
    <v-text-field
      v-model="search"
      prepend-inner-icon="mdi-magnify"
      rounded="pill"
      bg-color="#ECEDF4"
      base-color="white"
      class="mt-6 mx-3"
      label="Buscar compromisso"
      @input="filterAppointmentListByTitle"
    />
    <div class="d-flex flex-column ga-2">
      <v-tabs v-model="tab">
        <v-tab class="w-50" color="black" value="appointment">
          <div class="tab-content d-flex align-center">
            <Icon
              class="mr-2"
              :style="
                tab === 'appointment'
                  ? 'transform: rotate(-10deg); transition: transform 0.3s ease;'
                  : 'transform: none; transition: transform 0.3s ease;'
              "
              name="icons:bookmark-icons"
              size="25"
            />
            <p class="font-weight-bold">Agendamentos</p>
          </div>
        </v-tab>
        <v-tab class="w-50" color="black" value="calendar">
          <div class="tab-content d-flex align-center">
            <Icon
              class="mr-2"
              :style="
                tab === 'calendar'
                  ? 'transform: rotate(-10deg); transition: transform 0.3s ease;'
                  : 'transform: none; transition: transform 0.3s ease;'
              "
              name="icons:calendar"
              size="25"
            />
            <p class="font-weight-bold">Calendário</p>
          </div>
        </v-tab>
      </v-tabs>
      <v-tabs-window v-model="tab" class="px-3">
        <v-tabs-window-item value="appointment">
          <section v-if="noAppointments">
            <p class="text-center">Sem compromissos nas próximas semanas.</p>
          </section>
          <section v-else class="scroll">
            <section v-if="weekAppointments.length > 0">
              <p class="mb-2">
                {{ statusMessage.begin }}
                <span class="text-blue-dark font-weight-bold">{{
                  statusMessage.middle
                }}</span>
                {{ statusMessage.end }} para esta semana.
              </p>
              <appointment-card-generator
                :appointments="weekAppointments"
                @request-details="
                  (appointment: Appointment) => requestDetails(appointment)
                "
              />
            </section>
            <section v-if="futureAppointments.length > 0">
              <p class="mt-4 mb-4">Compromissos futuros</p>
              <appointment-card-generator
                :appointments="futureAppointments"
                @request-details="
                  (appointment: Appointment) => requestDetails(appointment)
                "
              />
            </section>
          </section>
        </v-tabs-window-item>
        <v-tabs-window-item value="calendar">
          <section class="calendar">
            <ClientOnly>
              <component
                :is="'NewCalendar'"
                locale="pt-BR"
                expanded
                borderless
                transparent
                :attributes="attributes"
                @dayclick="onDayClick"
              />
            </ClientOnly>
          </section>
          <section v-if="dayAppointments.length > 0" class="scroll">
            <p class="mt-4 mb-4">Compromissos marcados nesse dia</p>
            <appointment-card-generator
              :appointments="dayAppointments"
              @request-details="
                (appointment: Appointment) => requestDetails(appointment)
              "
            />
          </section>
          <section v-else class="text-center mt-8">
            Nenhum compromisso nesse dia
          </section>
        </v-tabs-window-item>
      </v-tabs-window>
    </div>
    <div v-if="showAppointmentDetails">
      <appointment-card
        :id_agendamento="selectedAppointment.id_agendamento"
        :titulo="selectedAppointment.titulo"
        :descricao="selectedAppointment.descricao"
        :medico="selectedAppointment.medico"
        :data="selectedAppointment.data"
        :local="selectedAppointment.local"
        :nome_paciente="selectedAppointment.nome_paciente"
        :lembrete_enviado="selectedAppointment.lembrete_enviado"
        :show="showAppointmentDetails"
        :modo_google="auth.user.google_conectado"
        @close="showAppointmentDetails = !showAppointmentDetails"
      />
    </div>
  </v-container>
</template>

<script lang="ts">
import type Appointment from "~~/shared/types/appointment";
import convertToISODate from "~/utils/convertToISODate";
import moment from "moment";
import { useLoaderStore } from "~/stores/loader";
import type CalendarAttributes from "~~/shared/types/calendarAttributes";
import type CalendarDay from "~~/shared/types/calendarDay";
import { useAuthStore } from "~/stores/auth";

export default defineComponent({
  name: "Home",
  setup() {
    definePageMeta({
      showHeader: true,
      requiresRole: "ROLE_USER",
    });
  },
  data() {
    return {
      loader: useLoaderStore(),
      weekAppointments: ref([] as Appointment[]),
      futureAppointments: ref([] as Appointment[]),
      dayAppointments: [] as Appointment[],
      allAppointments: ref([] as Appointment[]),
      searchedAppointments: ref([] as Appointment[]),
      statusMessage: reactive({
        begin: "Existem",
        middle: "0 compromissos",
        end: "agendados",
      }),
      tab: ref(null),
      noAppointments: ref(false),
      attributes: ref<CalendarAttributes[]>([
        {
          key: "today",
          highlight: {
            color: "blue",
            fillMode: "light",
          },
          dates: new Date(),
        },
      ]),
      search: ref(""),
      selectedDate: new Date(),
      showAppointmentDetails: ref(false),
      selectedAppointment: ref({} as Appointment),
      auth: useAuthStore(),
      pollTimer: null as ReturnType<typeof setInterval> | null,
      fetching: false,
      initialized: false,
    };
  },
  watch: {
    "auth.notifications"(novas: any[], antigas: any[]) {
      if ((novas?.length ?? 0) > (antigas?.length ?? 0)) this.loadAppointments(true);
    },
  },
  async mounted() {
    await this.loadAppointments();
    this.pollTimer = setInterval(() => {
      if (!document.hidden) this.loadAppointments(true);
    }, 10_000);
    document.addEventListener("visibilitychange", this.onVisibilityChange);
  },
  beforeUnmount() {
    if (this.pollTimer) clearInterval(this.pollTimer);
    document.removeEventListener("visibilitychange", this.onVisibilityChange);
  },
  methods: {
    onVisibilityChange() {
      if (!document.hidden) this.loadAppointments(true);
    },

    async loadAppointments(silent = false) {
      if (this.fetching) return; // evita buscas sobrepostas
      this.fetching = true;
      const { $api, $toast } = useNuxtApp();
      const token = useCookie("token");
      if (!silent) this.loader.startLoading();

      try {
        const response: any = await $api("/agendamentos/usuario", {
          method: "GET",
          headers: { Authorization: `Bearer ${token.value}` },
        });
        const loaded: Appointment[] = response.data ?? [];

        // O que chegou desde a última busca
        const knownIds = new Set(this.allAppointments.map((a) => a.id_agendamento));
        const arrived = this.initialized
          ? loaded.filter((a) => !knownIds.has(a.id_agendamento))
          : [];

        this.allAppointments = loaded;
        this.noAppointments = loaded.length <= 0; // volta a false quando chega o primeiro
        this.attributes = [
          {
            key: "today",
            highlight: { color: "blue", fillMode: "light" },
            dates: new Date(),
          },
          ...loaded.map((a) => ({
            key: String(a.id_agendamento),
            bar: { style: { backgroundColor: "#E32585" } },
            dates: convertToISODate(a.data),
          })),
        ];

        // Reaplica semana/futuros/dia e o texto da busca que o usuário já digitou
        this.filterAppointmentListByTitle();
        this.initialized = true;

        if (arrived.length === 1) {
          $toast.success(`Novo compromisso: ${arrived[0]!.titulo}`);
        } else if (arrived.length > 1) {
          $toast.success(`${arrived.length} novos compromissos`);
        }
      } catch (e) {
        if (silent) console.warn("Falha ao atualizar agendamentos", e);
        else {
          console.error(e);
          this.noAppointments = true;
        }
      } finally {
        this.fetching = false;
        if (!silent) this.loader.endLoading();
      }
    },
    updateAppointmentsList() {
      this.weekAppointments = this.allAppointments.filter(
        (appointment) =>
          this.isDateInThisWeek(convertToISODate(appointment.data)) == 0,
      );

      this.futureAppointments = this.allAppointments.filter(
        (appointment) =>
          this.isDateInThisWeek(convertToISODate(appointment.data)) == 1,
      );

      if (
        this.weekAppointments.length <= 0 &&
        this.futureAppointments.length <= 0
      )
        this.noAppointments = true;
    },
    updateAppointmentsByDay() {
      let compare = (appointment: Appointment) =>
        this.compareDate(convertToISODate(appointment.data), this.selectedDate);

      if (this.search.length > 0)
        compare = (appointment: Appointment) =>
          this.compareDate(
            convertToISODate(appointment.data),
            this.selectedDate,
          ) && appointment.titulo.toLowerCase() == this.search.toLowerCase();

      this.dayAppointments = this.allAppointments.filter(compare);
    },
    updateText() {
      this.statusMessage.begin =
        this.weekAppointments.length == 1 ? "Existe" : "Existem";
      this.statusMessage.middle =
        this.weekAppointments.length == 1
          ? "1 compromisso"
          : `${this.weekAppointments.length} compromissos`;
      this.statusMessage.end =
        this.weekAppointments.length == 1 ? "agendado" : "agendados";
    },
    isDateInThisWeek(date: Date) {
      const now = moment();
      const currentDate = moment(date.toISOString());

      if (now.isoWeek() == currentDate.isoWeek()) return 0;
      else if (now.isoWeek() < currentDate.isoWeek()) return 1;

      return -1;
    },
    compareDate(firstDate: Date, secondDate: Date): boolean {
      return (
        firstDate.getDate() == secondDate.getDate() &&
        firstDate.getMonth() == secondDate.getMonth() &&
        firstDate.getFullYear() == secondDate.getFullYear()
      );
    },
    onDayClick(selectedDay: CalendarDay) {
      this.selectedDate = selectedDay.date;
      this.updateAppointmentsByDay();
    },
    filterAppointmentListByTitle() {
      this.updateAppointmentsList();
      this.updateText();
      this.updateAppointmentsByDay();

      if (this.search.length <= 0) {
        this.updateText();
        return;
      }

      this.weekAppointments = this.weekAppointments.filter((appointment) =>
        appointment.titulo.toLowerCase().includes(this.search.toLowerCase()),
      );

      this.futureAppointments = this.futureAppointments.filter((appointment) =>
        appointment.titulo.toLowerCase().includes(this.search.toLowerCase()),
      );

      this.dayAppointments = this.dayAppointments.filter((appointment) =>
        appointment.titulo.toLowerCase().includes(this.search.toLowerCase()),
      );

      this.updateText();
    },
    requestDetails(appointment: Appointment) {
      this.showAppointmentDetails = !this.showAppointmentDetails;
      this.selectedAppointment = appointment;
    },
  },
});
</script>

<style scoped>
.scroll {
  overflow-y: auto;
  max-height: calc(100dvh - 220px);
  padding-bottom: 80px;
}

.calendar {
  background-color: #ecedf4;
  border-radius: 30px;
}
</style>
