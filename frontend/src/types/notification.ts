import type { User } from "./user";

export interface Notification {
  id: string;
  type: "like" | "comment" | "connection_request" | "connection_accepted";
  entity_id: string | null;
  is_read: boolean;
  created_at: string;
  actor: User;
}
