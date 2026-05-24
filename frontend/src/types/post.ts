import type { User } from "./user";

export interface Post {
  id: string;
  content: string;
  created_at: string;
  author: User;
  like_count: number;
  comment_count: number;
  liked_by_me: boolean;
}

export interface Comment {
  id: string;
  content: string;
  created_at: string;
  author: User;
}
