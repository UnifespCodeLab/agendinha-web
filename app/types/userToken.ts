import { type User } from "~/types/user";
import type Notification from "~/types/notification";

export default interface UserToken {
  usuario: User;
  notificacoes: Notification[];
  token: string;
}
