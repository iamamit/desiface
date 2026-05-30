import type { User } from "./user";

export type ServiceCategory =
  | "visa" | "legal" | "finance" | "tax" | "career"
  | "teaching" | "language" | "housing" | "tech" | "other";

export type ServiceMode = "remote" | "in_person" | "both";

export interface Service {
  id: string;
  category: ServiceCategory;
  title: string;
  description: string;
  is_paid: boolean;
  price_info: string | null;
  mode: ServiceMode;
  location: string | null;
  is_active: boolean;
  created_at: string;
  provider: User;
}

export type ProgramCategory =
  | "workshop" | "meetup" | "study_group" | "networking"
  | "cultural" | "language" | "webinar" | "other";

export interface Program {
  id: string;
  category: ProgramCategory;
  title: string;
  description: string;
  event_date: string;
  is_online: boolean;
  location: string | null;
  capacity: number | null;
  is_free: boolean;
  price_info: string | null;
  created_at: string;
  organizer: User;
  rsvp_count: number;
  rsvped_by_me: boolean;
}
