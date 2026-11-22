import type { Guardian } from "./guardian";

export interface User {
  id_usuario: number;
  telefone?: string;
  nome: string;
  email: string;
  cadastro_confirmado: boolean;
  google_conectado: boolean;
  role: string;
  foto_perfil?: string;
  ativar_notificacoes_consultas: boolean;
  ativar_notificacoes_agendinha: boolean;
  responsavel?: Guardian;
}
