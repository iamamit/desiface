export interface User {
  id: string;
  email: string;
  username: string;
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  is_verified: boolean;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}
