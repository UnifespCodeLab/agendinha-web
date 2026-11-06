<template>
  <div
    v-for="user in users"
    :key="user.id_usuario"
    class="d-flex justify-space-between align-center w-100"
  >
    <v-card
      variant="flat"
      color="#E6F6FE"
      rounded="xl"
      class="card mb-2"
      :subtitle="user.email"
    >
      <template #title>
        <span class="font-weight-bold text-wrap">
          {{ user.nome }}
        </span>
      </template>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { type User } from "~~/shared/types/user";

defineProps({
  users: {
    type: Array as PropType<User[]>,
    required: true,
  }
});
</script>