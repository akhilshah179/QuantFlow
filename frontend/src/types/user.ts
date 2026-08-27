export interface User {
  id: string;
  email: string;
  name: string;
  profileImage?: string | null;
  authProvider?: 'email' | 'google';
  googleId?: string | null;
  virtualCash: number;
  createdAt?: string;
  lastLoginAt?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}
