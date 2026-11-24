<template>
  <v-bottom-sheet v-model="status" height="75%" content-class="generic-card">
    <v-card class="rounded-t-xl rounded-b-0 overflow-y-auto">
      <template #append>
        <div class="d-flex ga-2 align-center mt-2 mr-2">
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
      <div class="d-flex align-center ga-3 px-4 pt-4">
        <div class="min-w-0">
          <v-card-title class="font-weight-bold text-wrap pa-0">
            {{ props.nome }}
          </v-card-title>
          <v-card-subtitle class="pa-0 text-wrap">
            {{ props.email }}
          </v-card-subtitle>
        </div>
      </div>
      <v-card-text class="pb-0">
        <v-chip
          size="small"
          variant="tonal"
          :color="props.cadastro_confirmado ? 'success' : 'warning'"
          :prepend-icon="props.cadastro_confirmado ? 'mdi-check-circle-outline' : 'mdi-clock-outline'"
        >
          {{ props.cadastro_confirmado ? "Cadastro confirmado" : "Aguardando confirmação" }}
        </v-chip>
      </v-card-text>
      <v-card-text class="pt-4">
        <v-text-field
          v-model="form.nome"
          prepend-inner-icon="mdi-account-outline"
          label="Nome"
          :rules="[(v: string) => !!v?.trim() || 'O nome é obrigatório']"
        />
        <v-mask-input
          v-model="form.telefone"
          prepend-inner-icon="mdi-phone-outline"
          label="Telefone"
          mask="(##) #####-####"
        />
        <v-autocomplete
          v-model="selectedGuardian"
          v-model:search="guardianSearch"
          :items="foundGuardians"
          :loading="searchingGuardians"
          item-title="nome"
          return-object
          prepend-inner-icon="mdi-account-search"
          label="Responsável"
          placeholder="Buscar por nome..."
          clearable
          :hide-no-data="!guardianSearch || guardianSearch.length < 2"
          @update:model-value="onGuardianChange"
        >
          <template #no-data>
            <v-list-item>
              <v-list-item-title v-if="searchingGuardians" class="d-flex align-center">
                <v-progress-circular indeterminate size="20" width="2" color="primary" class="mr-2" />
                Buscando responsáveis...
              </v-list-item-title>
              <v-list-item-title v-else>
                Nenhum responsável encontrado.
              </v-list-item-title>
            </v-list-item>
          </template>
          <template #item="{ props: itemProps, item }">
            <v-list-item v-bind="itemProps" :subtitle="item.raw.email" />
          </template>
        </v-autocomplete>
      </v-card-text>
      <v-divider :thickness="3" />
      <v-card-actions>
        <v-btn
          variant="flat"
          color="#FFAFAF"
          class="w-33"
          :disabled="saving"
          @click="showDeleteDialog = true"
        >
          Deletar
        </v-btn>
        <v-btn
          variant="flat"
          class="w-66 font-weight-bold"
          :loading="saving"
          @click="save"
        >
          Salvar
        </v-btn>
      </v-card-actions>
    </v-card>
    <v-dialog v-model="showDeleteDialog" max-width="400">
      <v-card class="rounded-xl pa-2">
        <v-card-title class="text-h6 font-weight-bold d-flex align-center text-error">
          <v-icon color="error" class="mr-2">mdi-alert-circle</v-icon>
          Apagar usuário
        </v-card-title>
        <v-card-text class="pt-2 text-body-1">
          Tem certeza que deseja apagar <strong>{{ props.nome }}</strong>? Esta ação <strong>não</strong> pode ser desfeita.
        </v-card-text>
        <v-card-actions class="d-flex ga-2 mt-2 px-4 pb-4">
          <v-btn
            variant="tonal"
            class="flex-grow-1 rounded-lg font-weight-bold"
            height="44"
            @click="showDeleteDialog = false"
          >
            Cancelar
          </v-btn>
          <v-btn
            color="error"
            variant="flat"
            class="flex-grow-1 rounded-lg font-weight-bold"
            height="44"
            :loading="deleting"
            @click="confirmDelete"
          >
            Apagar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-bottom-sheet>
</template>

<script lang="ts" setup>
import type ShowUser from "~/types/showUser";

const PHONE_BR_REGEX =
  /^(?:\+?55\s?)?(?:\(?[1-9][0-9]\)?\s?)?(?:9\d{4}|[2-5]\d{3})-?\d{4}$/;

const props = defineProps<ShowUser>();
const emit = defineEmits<{
  (e: "close"): void;
  (e: "saved"): void;
  (e: "deleted", id: number): void;
}>();

const { $api, $toast } = useNuxtApp();
const toast = $toast as any;
const tokenCookie = useCookie<string | null>("token");

const form = reactive({
  nome: props.nome,
  telefone: props.telefone ?? "",
});
const saving = ref(false);
const status = ref(true);
watch(status, (v) => {
  if (!v) emit("close");
});

const initialGuardian = () =>
  props.nome_responsavel ? { nome: props.nome_responsavel } : null;

const selectedGuardian = ref<any>(initialGuardian());
const guardianSearch = ref(props.nome_responsavel ?? "");
const foundGuardians = ref<any[]>(selectedGuardian.value ? [selectedGuardian.value] : []);
const searchingGuardians = ref(false);
const guardianTouched = ref(false);
let guardianTimeout: ReturnType<typeof setTimeout> | null = null;

const guardianId = (g: any) =>
  g ? (g.id_responsavel ?? g.id_usuario ?? g.id ?? null) : null;

function onGuardianChange(g: any | null) {
  guardianTouched.value = true;
  if (g?.telefone) form.telefone = g.telefone;
}

watch(guardianSearch, (val) => {
  if (guardianTimeout) clearTimeout(guardianTimeout);

  if (selectedGuardian.value && val === selectedGuardian.value.nome) return;

  if (!val || val.length < 2) {
    foundGuardians.value = selectedGuardian.value ? [selectedGuardian.value] : [];
    searchingGuardians.value = false;
    return;
  }

  searchingGuardians.value = true;
  guardianTimeout = setTimeout(async () => {
    try {
      const res: any = await $api("/responsaveis/pesquisar", {
        method: "GET",
        query: { nome: val },
        headers: { Authorization: `Bearer ${tokenCookie.value}` },
      });
      foundGuardians.value = res.data || [];
    } catch {
      foundGuardians.value = [];
    }
    searchingGuardians.value = false;
  }, 500);
});

watch(
  () => props.id_usuario,
  () => {
    form.nome = props.nome;
    form.telefone = props.telefone ?? "";
    selectedGuardian.value = initialGuardian();
    guardianSearch.value = props.nome_responsavel ?? "";
    foundGuardians.value = selectedGuardian.value ? [selectedGuardian.value] : [];
    guardianTouched.value = false;
  }
);

onBeforeUnmount(() => {
  if (guardianTimeout) clearTimeout(guardianTimeout);
});

async function save() {
  const nome = form.nome.trim();
  if (nome.length < 2) {
    toast.error("Nome inválido.");
    return;
  }

  const digits = form.telefone.replace(/\D/g, "");
  if (digits && !PHONE_BR_REGEX.test(form.telefone)) {
    toast.error("Telefone inválido.");
    return;
  }

  const payload: Record<string, any> = { nome, telefone: digits };
  if (guardianTouched.value) {
    payload.id_responsavel = guardianId(selectedGuardian.value); // null = remove o vínculo
  }

  saving.value = true;
  try {
    const res: any = await $api(`/admin/usuarios/${props.id_usuario}/update`, {
      method: "PUT",
      body: payload,
      headers: { Authorization: `Bearer ${tokenCookie.value}` },
    });
    if (res.status === 200) {
      toast.success("Usuário atualizado!");
      emit("saved");
    } else toast.error("Erro ao atualizar usuário.");
  } catch {
    toast.error("Erro ao atualizar usuário.");
  } finally {
    saving.value = false;
  }
}

const showDeleteDialog = ref(false);
const deleting = ref(false);

async function confirmDelete() {
  deleting.value = true;
  try {
    const res: any = await $api(`/admin/usuarios/${props.id_usuario}/delete`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${tokenCookie.value}` },
    });
    if (res.status === 200 || res.status === 204) {
      toast.success("Usuário apagado com sucesso.");
      emit("deleted", props.id_usuario);
      emit('close');
      showDeleteDialog.value = false;
    } else toast.error("Erro ao apagar usuário.");
  } catch {
    toast.error("Erro ao apagar usuário.");
  } finally {
    deleting.value = false;
  }
}
</script>
