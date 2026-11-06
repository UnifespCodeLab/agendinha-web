import type Appointment from "~~/shared/types/appointment";

export function useGoogleCalendar() {
    const config = useRuntimeConfig();
    const token = useCookie("token");

    async function createTaskIntoCalendar(appointment: Appointment) {
        return await $fetch(`${config.public.apiBase}/agendamentos/google`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token.value}`,
            },
            body: {
                appointment,
            },
        });
    }

    return {
        createTaskIntoCalendar,
    };
}
