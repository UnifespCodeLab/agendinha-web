export default async function deleteAppointment(id_agendamento: number) {
  const { $api } = useNuxtApp();
  const token = useCookie('token_recepcao');
  const response = await $api(`/agendamentos/${id_agendamento}/delete`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token.value}` },
  });
  return response;
}

