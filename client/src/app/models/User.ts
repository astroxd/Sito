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
