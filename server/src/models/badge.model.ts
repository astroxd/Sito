import db from "../config/database";

export type BadgeRank = "BRONZE" | "SILVER" | "GOLD" | "PLATINUM" | "SECRET";

//* Priority rank order
export const rankOrder: BadgeRank[] = [
  "SECRET",
  "PLATINUM",
  "GOLD",
  "SILVER",
  "BRONZE",
];

export interface BadgeBase {
  userId: number;
  badgeId: string;
  rank: BadgeRank;
  unlockedAt: string;
  rankKey: string;
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  category: "GENRE" | "TIME" | "SPECIAL";
  isSecret: boolean;
  thresholds: {
    [key in BadgeRank]?: number;
  };

  //* returns user progress towards that badge
  getCurrentValue: (stats: {
    genres: Map<string, number>;
    totalMinutes: number;
  }) => number;

  //* Unique id based on id & rank
  getRankKey: (rank: BadgeRank) => string;
}

const createBadge = (badgeInfo: Omit<Badge, "getRankKey">) => {
  return {
    ...badgeInfo,
    getRankKey: (rank: BadgeRank) => `${badgeInfo.id}-${rank}`,
  };
};

export const BADGES_LIST: Badge[] = [
  //* GENRE BADGE

  //* ACTION & ADVENTURE
  createBadge({
    id: "shonen_master",
    title: "Shonen King",
    description: "Complete anime packed with action, fights, and adrenaline",
    category: "GENRE",
    isSecret: false,
    thresholds: { BRONZE: 5, SILVER: 15, GOLD: 30, PLATINUM: 50 },
    getCurrentValue: (stats) =>
      (stats.genres.get("Action") ?? 0) + (stats.genres.get("Adventure") ?? 0),
  }),

  //* SCI-FI & MECHA
  createBadge({
    id: "cyber_pilot",
    title: "Legendary Pilot",
    description:
      "Explore the future through mecha, cyberpunk, and space travel",
    category: "GENRE",
    isSecret: false,
    thresholds: { BRONZE: 3, SILVER: 10, GOLD: 20, PLATINUM: 40 },
    getCurrentValue: (stats) =>
      (stats.genres.get("Sci-Fi") ?? 0) + (stats.genres.get("Mecha") ?? 0),
  }),

  //* COMEDY & SLICE OF LIFE
  createBadge({
    id: "chill_master",
    title: "Carefree",
    description: "Enjoy daily life and get ready for some good laughs",
    category: "GENRE",
    isSecret: false,
    thresholds: { BRONZE: 5, SILVER: 15, GOLD: 30, PLATINUM: 50 },
    getCurrentValue: (stats) =>
      (stats.genres.get("Comedy") ?? 0) +
      (stats.genres.get("Slice of Life") ?? 0),
  }),

  //* FANTASY & MAHOU SHOUJO & SUPERNATURAL
  createBadge({
    id: "magic_isekai",
    title: "World Summoner",
    description:
      "Journey into fantasy, magical worlds, and supernatural realms",
    category: "GENRE",
    isSecret: false,
    thresholds: { BRONZE: 5, SILVER: 15, GOLD: 30, PLATINUM: 50 },
    getCurrentValue: (stats) =>
      (stats.genres.get("Fantasy") ?? 0) +
      (stats.genres.get("Mahou Shoujo") ?? 0) +
      (stats.genres.get("Supernatural") ?? 0),
  }),

  //* DRAMA & ROMANCE
  createBadge({
    id: "heart_breaker",
    title: "Heartstring Connoisseur",
    description: "Experience intense love stories, tears, and dramatic twists",
    category: "GENRE",
    isSecret: false,
    thresholds: { BRONZE: 4, SILVER: 12, GOLD: 25, PLATINUM: 45 },
    getCurrentValue: (stats) =>
      (stats.genres.get("Romance") ?? 0) + (stats.genres.get("Drama") ?? 0),
  }),

  //* HORROR & THRILLER & PSYCHOLOGICAL & MYSTERY
  createBadge({
    id: "mind_games",
    title: "Thriller Detective",
    description: "Solve intricate mysteries and survive psychological horror",
    category: "GENRE",
    isSecret: false,
    thresholds: { BRONZE: 3, SILVER: 10, GOLD: 20, PLATINUM: 40 },
    getCurrentValue: (stats) =>
      (stats.genres.get("Horror") ?? 0) +
      (stats.genres.get("Thriller") ?? 0) +
      (stats.genres.get("Psychological") ?? 0) +
      (stats.genres.get("Mystery") ?? 0),
  }),

  //* SPORTS
  createBadge({
    id: "sports_champion",
    title: "National Champion",
    description: "Sweat, tears, and team spirit on the playing field",
    category: "GENRE",
    isSecret: false,
    thresholds: { BRONZE: 2, SILVER: 6, GOLD: 12, PLATINUM: 25 },
    getCurrentValue: (stats) => stats.genres.get("Sports") ?? 0,
  }),

  //* MUSIC
  createBadge({
    id: "music_idol",
    title: "Stage Idol",
    description: "Get carried away by the rhythm and musical performances",
    category: "GENRE",
    isSecret: false,
    thresholds: { BRONZE: 2, SILVER: 5, GOLD: 10, PLATINUM: 20 },
    getCurrentValue: (stats) => stats.genres.get("Music") ?? 0,
  }),

  //* TIME BADGE
  createBadge({
    id: "marathon_runner",
    title: "Midnight Marathon",
    description: "Accumulate total time spent watching anime",
    category: "TIME",
    isSecret: false,
    thresholds: {
      BRONZE: 6000, // ~100 hours (250 episodes)
      SILVER: 18000, // ~300 hours (750 episodes)
      GOLD: 45000, // ~750 hours (1800 episodes)
      PLATINUM: 90000, // ~1500 hours (3600 episodes)
    },
    getCurrentValue: (stats) => stats.totalMinutes,
  }),

  //* SECRET BADGES
  createBadge({
    id: "culture_man",
    title: "Man of Culture",
    description:
      "You've completed your first Ecchi or Hentai anime... sophisticated tastes.",
    category: "SPECIAL",
    isSecret: true,
    thresholds: { SECRET: 1 },
    getCurrentValue: (stats) =>
      (stats.genres.get("Ecchi") ?? 0) + (stats.genres.get("Hentai") ?? 0),
  }),
];

export const Badge = {
  getUserBadges: (userId: number) => {
    const badges = db
      .prepare(
        `
        SELECT user_id as userId, badge_id as badgeId, rank, unlocked_at as unlockedAt
        FROM 'User Badge'
        WHERE user_id = ?
        ORDER BY unlocked_at ASC
      `,
      )
      .all(userId) as Omit<BadgeBase, "rankKey">[];

    return badges.map(
      (badge) =>
        ({
          ...badge,
          rankKey: `${badge.badgeId}-${badge.rank}`,
        }) as BadgeBase,
    );
  },

  insertUserBadge: (userId: number, badgeId: string, rank: BadgeRank) => {
    db.prepare(
      `
        INSERT INTO 'User Badge' (user_id, badge_id, rank)
        VALUES (?, ?, ?)
      `,
    ).run(userId, badgeId, rank);
  },
};
