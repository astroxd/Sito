export interface User {
  id: number;
  email: string;
  username: string;
  password?: string;
  avatarUrl: string;
  bannerUrl?: string;
  createdAt?: string;
  refreshToken?: string;
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
