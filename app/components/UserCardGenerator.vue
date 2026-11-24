<template>
  <v-card
    variant="flat"
    color="#E6F6FE"
    rounded="xl"
    class="card w-100 mt-4"
    v-for="user in users"
    :key="user.id_usuario"
    :subtitle="`${user.email}`"
    @click="$emit('requestDetails', user)"
  >
    <v-card-item v-if="user.telefone">
      <v-icon class="mr-2">mdi-phone-outline</v-icon>
      <span class="text-label-medium">{{
        formatPhoneNumber(user.telefone!)
      }}</span>
    </v-card-item>
    <template #title>
      <span class="font-weight-bold text-wrap">
        {{ user.nome }}
      </span>
    </template>
    <template #prepend>
      <img
        v-if="user.foto_perfil"
        class="rounded-square"
        :src="formatProfilePhotoURL(user.foto_perfil!)"
      />
      <v-icon v-else size="60">mdi-account-outline</v-icon>
    </template>
  </v-card>
</template>

<script setup lang="ts">
import type { User } from "~/types/user";
import formatPhoneNumber from "~/utils/formatPhoneNumber";

const config = useRuntimeConfig();
defineProps({
  users: {
    type: Array as PropType<User[]>,
    required: true,
  },
});

const emit = defineEmits(['requestDetails'])

function formatProfilePhotoURL(value: string): string {
  const imageLocation: string = value.substring(value.indexOf("/media"));
  return config.public.apiBase + imageLocation;
}
</script>

<style lang="css" scoped>
.rounded-square {
  width: 60px;
  aspect-ratio: 1 / 1;
  object-fit: cover;
  border-radius: 200px;
}
</style>
