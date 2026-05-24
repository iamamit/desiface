import type { User } from "./user";

export interface Connection {
  id: string;
  status: "pending" | "accepted" | "declined";
  created_at: string;
  requester: User;
  addressee: User;
}

export interface ConnectionStatus {
  connected: boolean;
  pending_sent: boolean;
  pending_received: boolean;
  connection_id: string | null;
}
