import type { User } from "./user";

export interface Message {
  id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  sender: User;
  receiver: User;
}

export interface Conversation {
  user: User;
  last_message: string;
  last_message_at: string;
  unread_count: number;
}
