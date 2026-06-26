export type BadgeRank = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'SECRET';

export interface UserBadge {
  id: string;
  title: string;
  description: string;
  category: 'GENRE' | 'TIME' | 'SPECIAL';
  image: string;
  imageUrl: string;
  isSecret: boolean;
  unlocked: boolean;
  highestRankUnlocked: BadgeRank | null;
  nextRank: BadgeRank | null;
  nextRankThreshold: number | null;
  currentValue: number;
  progressPercentage: number;
  unlockedAt: string | null;
}

export interface UserBadgeResApi {
  data: UserBadge[];
}
