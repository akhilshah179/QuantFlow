export interface User {
  id: string;
  email: string;
  name: string;
  virtualCash: number;
}

export interface AuthResponse {
  token: string;
  user: User;
}
