export default interface ShowUser {
  id_usuario: number;
  telefone?: string;
  nome: string;
  email: string;
  cadastro_confirmado: boolean;
  nome_responsavel?: string;
  show: boolean;
}