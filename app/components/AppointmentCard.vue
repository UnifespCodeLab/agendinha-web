<template>
  <v-bottom-sheet v-model="status" height="75%" content-class="generic-card">
    <v-card class="rounded-t-xl rounded-b-0">
      <template #append>
        <div class="d-flex ga-2 align-center mt-2 mr-2">
          <template v-if="props.modo_admin">
            <v-btn
              color="error"
              variant="tonal"
              icon="mdi-delete"
              size="small"
              @click="$emit('delete', props.id_agendamento)"
            />
            <v-btn
              color="primary"
              variant="tonal"
              icon="mdi-pencil"
              size="small"
              @click="$emit('edit', props.id_agendamento)"
            />
          </template>
          <v-avatar
            color="#BCD4FF"
            size="35"
            class="cursor-pointer ml-1"
            @click="$emit('close')"
          >
            <v-icon color="#0C3784" class="pa-2" size="30">mdi-close</v-icon>
          </v-avatar>
        </div>
      </template>
      <v-divider :thickness="3" />
      <v-card-title class="font-weight-bold text-wrap">
        {{
          props.modo_admin ? props.nome_paciente || "Paciente" : props.titulo
        }}
      </v-card-title>
      <v-card-subtitle v-if="props.modo_admin" class="text-h6 pb-2">
        {{ props.titulo }}
      </v-card-subtitle>
      <v-card-text style="white-space: pre-wrap">
        {{ props.descricao }}
      </v-card-text>
      <section>
        <v-card-text class="pt-0 pb-1">
          <strong>Data/Horário:</strong> {{ props.data }}
        </v-card-text>
        <v-card-text class="py-1">
          <strong>Responsável:</strong> {{ props.medico }}
        </v-card-text>
        <v-card-text class="pt-1">
          <strong>Local:</strong> {{ props.local }}
        </v-card-text>
      </section>
      <v-divider :thickness="3" />
      <v-card-actions class="pa-4 mt-4 pt-0 mb-2">
        <v-btn
          color="primary"
          variant="flat"
          class="w-100 font-weight-bold text-body-1 rounded-lg"
          height="48"
          prepend-icon="mdi-google"
          @click="moveToGoogleCalendar"
        >
          Adicionar ao Google Agenda
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-bottom-sheet>
</template>
<script lang="ts" setup>
import type ShowAppointment from "~/types/showAppointment";
import { useAuthStore } from "~/stores/auth";
import { useLoaderStore } from "~/stores/loader";
import convertToISODate from "~/utils/convertToISODate";

const { $api, $toast } = useNuxtApp();
const props = defineProps<ShowAppointment>();
const loader = useLoaderStore();
const emit = defineEmits(["close", "edit", "delete"]);

const status = ref(false);
status.value = props.show;
const auth = useAuthStore();
const token = useCookie("token");

async function moveToGoogleCalendar() {
  const start = convertToISODate(props.data);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  loader.startLoading();

  const event = {
    summary: props.titulo,
    location: props.local,
    description: `${props.descricao}, Responsável: ${props.medico}`,
    start: { dateTime: start.toISOString(), timeZone: "America/Sao_Paulo" },
    end: { dateTime: end.toISOString(), timeZone: "America/Sao_Paulo" },
    colorId: "6",
  };

  const useStoredAuth = !!(props.modo_google && auth.user.google_conectado);
  let code: string | undefined;
  if (!useStoredAuth) {
    try {
      code = await auth.requestGoogleCalendarCode();
    } catch {
      $toast.error("Autorização do Google cancelada.");
      loader.endLoading();
      emit("close");
      return;
    }
  }

  emit("close");
  try {
    const res: any = await $api("/agendamentos/google", {
      method: "POST",
      body: code ? { ...event, code } : event,
      headers: { Authorization: `Bearer ${token.value}` },
    });
    if (res?.status >= 400) throw { status: res.status, data: res.data };

    $toast.success("Agendamento criado.");
  } catch (e: any) {
    const statusCode = e?.status ?? e?.statusCode;
    if (statusCode === 401) {
      if (useStoredAuth) {
        auth.user.google_conectado = false; // o próximo clique já abre o popup
        $toast.error("Autorização do Google expirada. Toque em exportar de novo para autorizar.");
      } else $toast.error(e?.data?.message ?? "Sem permissão no Google Agenda.");
    } else $toast.error("Erro ao exportar agendamento.");
  } finally {
    loader.endLoading();
  }
}
</script>
