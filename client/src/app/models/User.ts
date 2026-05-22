export interface User {
  id: number;
  email: string;
  username: string;
  password?: string;
  avatar: string;
  banner?: string;
  created_on?: string;
  refresh_token?: string;
}
