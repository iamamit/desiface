export interface WorkExperience {
  title: string;
  company: string;
  start_date: string;
  end_date: string | null;
  current: boolean;
  description: string | null;
}

export interface Education {
  school: string;
  degree: string | null;
  field: string | null;
  start_date: string;
  end_date: string | null;
}

export interface User {
  id: string;
  email: string;
  username: string;
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  headline: string | null;
  location: string | null;
  work_experience: WorkExperience[] | null;
  education: Education[] | null;
  skills: string[] | null;
  is_verified: boolean;
  is_admin: boolean;
  profile_visibility: "public" | "friends_only";
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}
