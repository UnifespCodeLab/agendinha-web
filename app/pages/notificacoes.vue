<template>
  <v-container class="pa-0 h-100 position-fixed">
    <v-app-bar>
      <template #prepend>
        <v-app-bar-title class="font-weight-bold ml-2">
          Notificações
        </v-app-bar-title>
      </template>
    </v-app-bar>
    <v-main class="d-flex flex-column ga-4 mx-3 mt-3">
      <section
        v-if="readNotifications.length > 0 || notReadNotifications.length > 0"
        class="scroll"
      >
        <section v-if="notReadNotifications.length > 0">
          <p class="mb-4">Não Lidas</p>
          <NotificationGenerator
            :notifications="notReadNotifications"
            color="blue-light"
            @request-details="
              (notification: Notification) => requestDetails(notification)
            "
          />
        </section>
        <section v-if="readNotifications.length > 0">
          <p class="mt-4 mb-4">Lidas</p>
          <NotificationGenerator
            :notifications="readNotifications"
            color="#F8F8F8"
            @request-details="
              (notification: Notification) => requestDetails(notification)
            "
          />
        </section>
      </section>
      <section v-else>
        <p class="text-center">Sem notificações encontradas</p>
      </section>
    </v-main>
    <div v-if="showNotificationDetails">
      <notification-card
        :id="selectedNotification.id_notificacao"
        :title="selectedNotification.titulo"
        :description="selectedNotification.descricao"
        :show="showNotificationDetails"
        :read="selectedNotification.lida"
        @close="showNotificationDetails = !showNotificationDetails"
        @read="read"
        @delete="deleteNotificationFromList"
      />
    </div>
  </v-container>
</template>

<script lang="ts">
import type Notification from "~/types/notification";
import { useLoaderStore } from "~/stores/loader";
import { useAuthStore } from "~/stores/auth";

export default defineComponent({
  name: "Notifications",
  setup() {
    definePageMeta({ requiresRole: "ROLE_USER", showHeader: true });
  },
  data() {
    return {
      readNotifications: ref([] as Notification[]),
      notReadNotifications: ref([] as Notification[]),
      loader: useLoaderStore(),
      auth: storeToRefs(useAuthStore()),
      showNotificationDetails: ref(false),
      selectedNotification: ref({} as Notification),
      pollTimer: null as ReturnType<typeof setInterval> | null,
      fetching: false,
      initialized: false,
    };
  },
  watch: {
    "auth.notifications"(novas: any[], antigas: any[]) {
      if ((novas?.length ?? 0) > (antigas?.length ?? 0)) this.updateNotifications(true);
    },
  },
  async mounted() {
    await this.updateNotifications();
    this.pollTimer = setInterval(() => {
      if (!document.hidden) this.updateNotifications(true);
    }, 30_000);
    document.addEventListener("visibilitychange", this.onVisibilityChange);
  },
  beforeUnmount() {
    if (this.pollTimer) clearInterval(this.pollTimer);
    document.removeEventListener("visibilitychange", this.onVisibilityChange);
  },
  methods: {
    onVisibilityChange() {
      if (!document.hidden) this.updateNotifications(true);
    },
    async updateNotifications(silent = false) {
      if (this.fetching) return; // evita buscas sobrepostas
      this.fetching = true;
      const { $api, $toast } = useNuxtApp();
      const token = useCookie("token");
      if (!silent) this.loader.startLoading();

      try {
        const response: any = await $api(
          `/notificacoes/usuario/${this.auth.user.id_usuario}`,
          {
            method: "GET",
            headers: { Authorization: `Bearer ${token.value}` },
          },
        );
        const loaded: Notification[] = response.data ?? [];

        // Notificações não lidas que chegaram desde a última busca
        const knownIds = new Set(
          [...this.readNotifications, ...this.notReadNotifications].map(
            (n) => n.id_notificacao,
          ),
        );
        const arrived = this.initialized
          ? loaded.filter((n) => !n.lida && !knownIds.has(n.id_notificacao))
          : [];

        // Sempre substitui, inclusive com lista vazia (o código antigo mantinha a lista velha)
        this.readNotifications = loaded.filter((n) => n.lida);
        this.notReadNotifications = loaded.filter((n) => !n.lida);
        this.auth.notReadNotifications = this.notReadNotifications.length;
        this.initialized = true;

        if (arrived.length === 1) {
          $toast.success(`Nova notificação: ${arrived[0]!.titulo}`);
        } else if (arrived.length > 1) {
          $toast.success(`${arrived.length} novas notificações`);
        }
      } catch (e) {
        console.warn("Falha ao atualizar notificações", e);
      } finally {
        this.fetching = false;
        if (!silent) this.loader.endLoading();
      }
    },
    read() {
      if (this.selectedNotification.lida) return;

      const notifications = this.notReadNotifications.filter(
        (notification) =>
          notification.id_notificacao !==
          this.selectedNotification.id_notificacao,
      );

      this.notReadNotifications = notifications;

      this.selectedNotification.lida = true;
      if (
        !this.readNotifications.some(
          (n) => n.id_notificacao === this.selectedNotification.id_notificacao,
        )
      ) {
        this.readNotifications.push(this.selectedNotification);
      }

      this.auth.notReadNotifications = this.notReadNotifications.length;
    },
    requestDetails(notification: Notification) {
      this.selectedNotification = notification;
      this.showNotificationDetails = !this.showNotificationDetails;
    },
    deleteNotificationFromList() {
      if (this.selectedNotification.lida) {
        const notifications = this.readNotifications.filter(
          (notification) =>
            notification.id_notificacao !==
            this.selectedNotification.id_notificacao,
        );
        this.readNotifications = notifications;
        return;
      }

      const notifications = this.notReadNotifications.filter(
        (notification) =>
          notification.id_notificacao !==
          this.selectedNotification.id_notificacao,
      );
      this.notReadNotifications = notifications;

      this.auth.notReadNotifications = this.notReadNotifications.length;
    },
  },
});
</script>

<style scoped>
hr {
  height: 3px;
  background-color: #e8e9ed;
  border: none;
}

.scroll {
  overflow-y: auto;
  max-height: calc(100dvh - 140px);
  padding-bottom: 80px;
}
</style>
