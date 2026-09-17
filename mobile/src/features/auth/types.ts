import type { StoredUser } from "@/lib/api/authStorage";

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: StoredUser;
}

export type { StoredUser };
