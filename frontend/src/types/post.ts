import type { User } from "./user";

export interface SharedPost {
  id: string;
  content: string;
  image_url?: string | null;
  author: User;
  created_at: string;
}

export type PostTag =
  | "visa" | "legal" | "finance" | "tax" | "career"
  | "teaching" | "language" | "housing" | "tech"
  | "networking" | "cultural" | "general";

export interface Post {
  id: string;
  content: string;
  image_url?: string | null;
  visibility: "public" | "friends";
  tag?: PostTag | null;
  shared_post?: SharedPost | null;
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
