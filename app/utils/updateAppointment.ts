export default async function updateAppointment(id_agendamento: number, data: any) {
  const { $api } = useNuxtApp();
  const token = useCookie('token');
  const response = await $api(`/agendamentos/${id_agendamento}/update`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token.value}` },
    body: data,
  });
  return response;
}

