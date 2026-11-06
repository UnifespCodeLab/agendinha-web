import { type User } from "~~/shared/types/user";
import type Notification from "~~/shared/types/notification";

export default interface UserToken {
  usuario: User;
  notificacoes: Notification[];
  token: string;
}
