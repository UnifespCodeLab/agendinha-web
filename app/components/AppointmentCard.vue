<template>
    <v-bottom-sheet
        v-model="status"
        height="75%"
    >
        <v-card class="rounded-xl">
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
                        size="35" class="cursor-pointer ml-1" @click="$emit('close');">
                        <v-icon 
                            color="#0C3784"
                            class="pa-2"
                            size="30"
                        >mdi-close</v-icon>
                    </v-avatar>
                </div>
            </template>
            <v-divider :thickness="3"/>
            <v-card-title class="font-weight-bold text-wrap">
                {{ props.nome_paciente || 'Paciente' }}
            </v-card-title>
            <v-card-subtitle class="text-h6 pb-2">
                {{ props.titulo }}
            </v-card-subtitle>
            <v-card-text style="white-space: pre-wrap;">
                {{ props.descricao }}
            </v-card-text>
            <section>
                <v-card-text class="pt-0 pb-1">
                    <strong>Data/Horário:</strong> {{ props.data }}
                </v-card-text>
                <v-card-text class="py-1">
                    <strong>Médico:</strong> {{ props.medico }}
                </v-card-text>
                <v-card-text class="pt-1">
                    <strong>Local:</strong> {{ props.local }}
                </v-card-text>
            </section>
            <v-divider :thickness="3"/>
            <v-card-actions v-if="props.modo_google" class="pa-4 pt-0 mb-2">
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
import type ShowAppointment from "~~/shared/types/showAppointment";
import type Appointment from "~~/shared/types/appointment";

import { useAuthStore } from "~/stores/auth";
import { useLoaderStore } from "~/stores/loader";
import type GoogleTokens from "~~/shared/types/googleTokens";

const { $toast } = useNuxtApp();
const props = defineProps<ShowAppointment>();
const auth = useAuthStore();
const loader = useLoaderStore();
const emit = defineEmits(['close', 'edit', 'delete']);

const status = ref(false);
status.value = props.show;

const googleCalendar = useGoogleCalendar();

async function moveToGoogleCalendar() {
    loader.startLoading();
    emit("close");
    const response: any = await googleCalendar.createTaskIntoCalendar({
        id_agendamento: props.id_agendamento,
        id_usuario: props.id_paciente,
        titulo: props.titulo,
        descricao: props.descricao,
        data: props.data,
        medico: props.medico,
        local: props.local,
        lembrete_enviado: props.lembrete_enviado
    } as Appointment);

    if(response.status == 200) {
        $toast.success("Agendamento criado.");
        const newTokens: any = response.data.tokens;
        if('access_token' in newTokens) {
            auth.googleTokens = {
                access_token: newTokens.access_token as string,
                id_token: newTokens.id_token as string,
                refresh_token: newTokens.refresh_token as string
            } as GoogleTokens;
        }
        loader.endLoading();
        return;
    }

    $toast.error("Erro ao criar agendamento.");
    loader.endLoading();
}
</script>
