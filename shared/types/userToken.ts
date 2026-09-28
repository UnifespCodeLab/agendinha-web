import type User from "./user";
import type NotificationType from "./notification";

export default interface UserToken {
  usuario: User;
  notificacoes: NotificationType[];
  token: string;
}
