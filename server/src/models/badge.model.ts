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
  // 🎭 BADGE DI GENRE (Avanzamento a 4 Rank)
  createBadge({
    id: "shonen_master",
    title: "Re dello Shonen",
    description: "Completa anime pieni di azione e adrenalina",
    category: "GENRE",
    isSecret: false,
    thresholds: { BRONZE: 5, SILVER: 15, GOLD: 30, PLATINUM: 50 },
    getCurrentValue: (stats) => stats.genres.get("Action") ?? 0,
  }),
  createBadge({
    id: "romance_lover",
    title: "Incurabile Romantico",
    description: "Completa storie d'amore che fanno battere il cuore",
    category: "GENRE",
    isSecret: false,
    thresholds: { BRONZE: 3, SILVER: 10, GOLD: 20, PLATINUM: 40 },
    getCurrentValue: (stats) => stats.genres.get("Romance") ?? 0,
  }),
  createBadge({
    id: "mind_games",
    title: "Cervello di Platino",
    description: "Completa anime psicologici o thriller cervellotici",
    category: "GENRE",
    isSecret: false,
    thresholds: { BRONZE: 3, SILVER: 8, GOLD: 15, PLATINUM: 30 },
    getCurrentValue: (stats) =>
      (stats.genres.get("Psychological") ?? 0) +
      (stats.genres.get("Thriller") ?? 0),
  }),

  // 🕒 BADGE DI TEMPO (Maratone)
  createBadge({
    id: "marathon_runner",
    title: "Maratona Notturna",
    description: "Accumula ore totali di tempo speso a guardare anime",
    category: "TIME",
    isSecret: false,
    thresholds: {
      BRONZE: 1440, // 24 ore (1 giorno intero di visione)
      SILVER: 4320, // 72 ore (3 giorni)
      GOLD: 8640, // 144 ore (6 giorni)
      PLATINUM: 14400, // 240 ore (10 giorni completi)
    },
    getCurrentValue: (stats) => stats.totalMinutes,
  }),

  // 🕵️‍♂️ BADGE SEGRETI (Trofei unici con Rango 'SECRET')
  createBadge({
    id: "culture_man",
    title: "Uomo di Cultura",
    description:
      "Hai completato il tuo primo anime Ecchi o Hentai... visioni impegnative.",
    category: "SPECIAL",
    isSecret: true,
    thresholds: { SECRET: 1 },
    getCurrentValue: (stats) =>
      (stats.genres.get("Ecchi") ?? 0) + (stats.genres.get("Hentai") ?? 0),
  }),
  createBadge({
    id: "nostalgia_trip",
    title: "Operazione Nostalgia",
    description:
      "Completa almeno 5 anime di genere Adventure o Sci-Fi (i vecchi classici esplorativi)",
    category: "SPECIAL",
    isSecret: true,
    thresholds: { SECRET: 5 },
    getCurrentValue: (stats) =>
      (stats.genres.get("Adventure") ?? 0) + (stats.genres.get("Sci-Fi") ?? 0),
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
