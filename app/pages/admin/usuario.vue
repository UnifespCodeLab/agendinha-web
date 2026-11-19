<template>
  <v-container class="h-100 position-fixed">
    <v-app-bar>
      <template #prepend>
        <v-app-bar-title class="font-weight-bold ml-2"
          >Gerenciar usuários</v-app-bar-title
        >
      </template>
    </v-app-bar>
    <v-main>
      <v-tabs v-model="tab">
        <v-tab class="w-1/3" color="black" value="list">
          <p class="font-weight-bold">Lista</p>
        </v-tab>
        <v-tab class="w-1/3" color="black" value="create-user">
          <p class="font-weight-bold">Novo Usuário</p>
        </v-tab>
        <v-tab class="w-1/3" color="black" value="create-guardian">
          <p class="font-weight-bold">Novo Responsável</p>
        </v-tab>
      </v-tabs>
      <v-tabs-window v-model="tab" class="px-3 h-full mt-6">
        <v-tabs-window-item value="list">
          <div v-if="loader.isLoading" class="d-flex justify-center py-6">
            Carregando...
          </div>
          <p
            v-else-if="!users.length"
            class="text-center text-medium-emphasis py-6"
          >
            Nenhum usuário encontrado.
          </p>
          <UserCardGenerator 
            v-else 
            :users="users" 
            @request-details="openSelectedUser"
          />
        </v-tabs-window-item>
        <v-tabs-window-item value="create-user" class="px-3 h-full mt-6">
          <v-switch
            v-model="haveGuardian"
            label="Associar a algum responsável"
            class="ma-0 pa-0"
            inset
            density="compact"
            hide-details
          />
          <v-autocomplete
            v-if="haveGuardian"
            v-model="selectedGuardian"
            v-model:search="guardianSearch"
            :items="foundGuardians"
            :loading="searchingGuardians"
            item-title="nome"
            return-object
            prepend-inner-icon="mdi-account-search"
            label="Responsável"
            placeholder="Buscar por nome..."
            class="mt-4"
            clearable
            :hide-no-data="!guardianSearch || guardianSearch.length < 2"
          >
            <template #no-data>
              <v-list-item>
                <v-list-item-title
                  v-if="searchingGuardians"
                  class="d-flex align-center"
                >
                  <v-progress-circular
                    indeterminate
                    size="20"
                    width="2"
                    color="primary"
                    class="mr-2"
                  />
                  Buscando responsáveis...
                </v-list-item-title>
                <v-list-item-title v-else>
                  Nenhum responsável encontrado.
                </v-list-item-title>
              </v-list-item>
            </template>
            <template #item="{ props, item }">
              <v-list-item v-bind="props" :subtitle="item.raw.email" />
            </template>
          </v-autocomplete>
          <v-mask-input
            v-if="!haveGuardian"
            v-model="user.telefone"
            prepend-inner-icon="mdi-phone-outline"
            class="mt-4"
            label="Telefone"
            mask="(##) #####-####"
          />
          <v-text-field
            v-if="!haveGuardian"
            v-model="user.email"
            prepend-inner-icon="mdi-email-outline"
            label="E-mail"
          />
          <v-text-field
            v-model="user.nome"
            prepend-inner-icon="mdi-account-outline"
            label="Nome"
          />
          <v-text-field
            v-model="user.senha"
            prepend-inner-icon="mdi-form-textbox-password"
            label="Senha"
            :type="show ? 'text' : 'password'"
            :append-inner-icon="show ? 'mdi-eye' : 'mdi-eye-off'"
            @click:append-inner="show = !show"
          />
          <v-btn
            class="w-100"
            :loading="loader.isLoading"
            @click="registerUser()"
            >Criar conta</v-btn
          >
        </v-tabs-window-item>
        <v-tabs-window-item value="create-guardian" class="px-3 h-full">
          <v-mask-input
            v-model="guardian.telefone"
            prepend-inner-icon="mdi-phone-outline"
            class="mt-4"
            label="Telefone"
            mask="(##) #####-####"
          />
          <v-text-field
            v-model="guardian.email"
            prepend-inner-icon="mdi-email-outline"
            label="E-mail"
          />
          <v-text-field
            v-model="guardian.nome"
            prepend-inner-icon="mdi-account-outline"
            label="Nome"
          />
          <v-btn
            class="w-100"
            :loading="savingGuardian"
            @click="registerGuardian()"
          >
            Criar responsável
          </v-btn>
        </v-tabs-window-item>
      </v-tabs-window>
    </v-main>
    <div v-if="showDetails">
      <UserEditCard 
        v-bind="selectedUser"
        @close="showDetails = false"
        @saved="loadUsers"
        @deleted="loadUsers"
      />
    </div>
  </v-container>
</template>

<script lang="ts">
import { useLoaderStore } from "~/stores/loader";
import type UserRegister from "~~/shared/types/userRegister";
import type { User } from "~~/shared/types/user";
import { useAuthStore } from "~/stores/auth";
import type GuardianRegister from "~~/shared/types/guardianRegister";
import type ShowUser from "~~/shared/types/showUser";

const EMAIL_REGEX = /^[A-Za-z][A-Za-z0-9._%+-]*@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
const PHONE_BR_REGEX =
  /^(?:\+?55\s?)?(?:\(?[1-9][0-9]\)?\s?)?(?:9\d{4}|[2-5]\d{3})-?\d{4}$/;

export default defineComponent({
  setup() {
    definePageMeta({
      showHeader: true,
      requiresRole: "ROLE_ADMIN",
    });
  },
  data() {
    return {
      user: {
        email: "",
        nome: "",
        senha: "",
        telefone: "",
      } as UserRegister,
      guardian: {
        email: "",
        nome: "",
        telefone: "",
      } as GuardianRegister,
      haveGuardian: false,
      selectedGuardian: null as any,
      guardianSearch: "",
      foundGuardians: [] as any[],
      searchingGuardians: false,
      guardianSearchTimeout: null as ReturnType<typeof setTimeout> | null,
      savingGuardian: false,
      users: [] as User[],
      show: false,
      loader: useLoaderStore(),
      auth: useAuthStore(),
      tab: "list" as string | null,
      showDetails: ref(false),
      selectedUser: ref({ show: false } as ShowUser),
    };
  },
  watch: {
    guardianSearch(val: string | null) {
      if (this.guardianSearchTimeout) clearTimeout(this.guardianSearchTimeout);

      if (this.selectedGuardian && val === this.selectedGuardian.nome) return;

      if (!val || val.length < 2) {
        this.foundGuardians = [];
        this.searchingGuardians = false;
        return;
      }

      this.searchingGuardians = true;

      this.guardianSearchTimeout = setTimeout(async () => {
        const { $api } = useNuxtApp();
        const token = useCookie("token");
        try {
          const res: any = await $api("/responsaveis/pesquisar", {
            method: "GET",
            query: { nome: val },
            headers: { Authorization: `Bearer ${token.value}` },
          });
          this.foundGuardians = res.data || [];
        } catch {
          this.foundGuardians = [];
        }
        this.searchingGuardians = false;
      }, 500);
    },
    haveGuardian(val: boolean) {
      if (val) {
        this.user.email = "";
        this.user.telefone = "";
      } else this.clearGuardianSelection();
    },
  },
  async mounted() {
    await this.loadUsers();
  },
  beforeUnmount() {
    if (this.guardianSearchTimeout) clearTimeout(this.guardianSearchTimeout);
  },
  methods: {
    openSelectedUser(user: User) {
      this.selectedUser = {
        id_usuario: user.id_usuario,
        telefone: user.telefone ? user.telefone : user.responsavel?.telefone,
        nome: user.nome,
        email: user.email,
        cadastro_confirmado: user.cadastro_confirmado,
        nome_responsavel: user.responsavel?.nome,
        show: true,
      } as ShowUser;
      this.showDetails = true;
    },

    clearGuardianSelection() {
      this.selectedGuardian = null;
      this.guardianSearch = "";
      this.foundGuardians = [];
    },

    async loadUsers() {
      const { $toast, $api } = useNuxtApp();
      const token = useCookie("token");
      this.loader.startLoading();
      try {
        const response = await $api("/admin/usuarios", {
          headers: {
            Authorization: `Bearer ${token.value}`,
          },
          query: { page_size: 100 },
        });
        this.users = response.data.results.filter(
          (user: User) => user.role === "ROLE_USER"
        );
      } catch (e: any) {
        console.error(e);
        $toast.error("Não foi possível carregar os usuários.");
      } finally {
        this.loader.endLoading();
      }
    },

    async registerUser() {
      const { $toast, $api } = useNuxtApp();

      if (!this.haveGuardian) {
        if (!EMAIL_REGEX.test(this.user.email)) {
          $toast.error("E-mail inválido.");
          return;
        }

        if (!PHONE_BR_REGEX.test(this.user.telefone)) {
          $toast.error("Telefone inválido.");
          return;
        }
      }

      if (this.user.senha.length <= 0) {
        $toast.error("Senha inválida.");
        return;
      }

      if (this.haveGuardian && !this.selectedGuardian) {
        $toast.error("Selecione um responsável.");
        return;
      }

      this.loader.startLoading();
      try {
        const token = useCookie("token");

        const body: Record<string, any> = { ...this.user };

        if (this.haveGuardian && this.selectedGuardian) {
          body.email = this.selectedGuardian.email;
          body.telefone = this.selectedGuardian.telefone;
          body.id_responsavel =
            this.selectedGuardian.id_responsavel ??
            this.selectedGuardian.id_usuario ??
            this.selectedGuardian.id;
        } else body.telefone = this.user.telefone.replace(/[^0-9]/g, "");

        const response: any = await $api("/admin/usuarios/registrar", {
          method: "POST",
          body,
          headers: {
            Authorization: `Bearer ${token.value}`,
          },
        });

        if (response.status == 200) {
          $toast.success("E-mail de cadastro enviado.");
          this.user.email = "";
          this.user.nome = "";
          this.user.senha = "";
          this.user.telefone = "";
          this.haveGuardian = false;
          await this.loadUsers();
        } else if (response.status == 401) $toast.error(response.data.message);
      } catch (e: any) {
        console.error(e);
        $toast.error("Erro ao fazer o cadastro.");
      } finally {
        this.loader.endLoading();
      }
    },

    async registerGuardian() {
      const { $toast, $api } = useNuxtApp();

      if (!this.guardian.nome || this.guardian.nome.trim().length < 2) {
        $toast.error("Nome inválido.");
        return;
      }

      if (!EMAIL_REGEX.test(this.guardian.email)) {
        $toast.error("E-mail inválido.");
        return;
      }

      if (!PHONE_BR_REGEX.test(this.guardian.telefone)) {
        $toast.error("Telefone inválido.");
        return;
      }

      this.savingGuardian = true;
      this.loader.startLoading();
      try {
        const token = useCookie("token");

        const response: any = await $api("/responsaveis/create", {
          method: "POST",
          body: {
            ...this.guardian,
            telefone: this.guardian.telefone.replace(/[^0-9]/g, ""),
          },
          headers: {
            Authorization: `Bearer ${token.value}`,
          },
        });

        if (response.status == 200 || response.status == 201) {
          $toast.success("Responsável criado com sucesso.");
          this.guardian.email = "";
          this.guardian.nome = "";
          this.guardian.telefone = "";
        } else if (response.status == 401) $toast.error(response.data.message);
      } catch (e: any) {
        console.error(e);
        $toast.error("Erro ao criar responsável.");
      } finally {
        this.savingGuardian = false;
        this.loader.endLoading();
      }
    },
  },
});
</script>
