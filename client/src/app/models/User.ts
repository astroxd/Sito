export interface User {
  id: number;
  email: string;
  username: string;
  password?: string;
  avatarUrl: string;
  defaultAvatarUrl: string;
  bannerUrl?: string;
  createdAt?: string;
  refreshToken?: string;
  avatarUpdatedAt?: string;
}

export interface AvatarUploadData {
  uploadUrl: string;
  token: string;
}

export interface RegisterResponse {
  data: { user: User; avatarUploadData: AvatarUploadData; accessToken: string };
  message: string;
}

export interface LoginResponse {
  data: { user: User; accessToken: string };
  message: string;
}

export interface TotalWatchTime {
  rawMinutes: number;
  days: number;
  hours: number;
  minutes: number;
  formattedString: string;
}

export interface GenreStat {
  genre: string;
  count: number;
}
export interface UserStatistics {
  totalWatchTime: TotalWatchTime;
  dailyHistory: { currentWeek: number[]; previousWeek: number[] };
  genres: GenreStat[];
}
