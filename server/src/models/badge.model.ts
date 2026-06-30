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
  //* BADGE DI GENRE

  //*  ACTION & ADVENTURE
  createBadge({
    id: "shonen_master",
    title: "Re dello Shonen",
    description: "Completa anime pieni di azione e adrenalina",
    category: "GENRE",
    isSecret: false,
    thresholds: { BRONZE: 5, SILVER: 15, GOLD: 30, PLATINUM: 50 },
    getCurrentValue: (stats) =>
      (stats.genres.get("Action") ?? 0) + (stats.genres.get("Adventure") ?? 0),
  }),

  //* SCI-FI & MECHA
  createBadge({
    id: "cyber_pilot",
    title: "Pilota Leggendario",
    description: "Esplora il futuro tra mecha, cyberpunk e viaggi nello spazio",
    category: "GENRE",
    isSecret: false,
    thresholds: { BRONZE: 3, SILVER: 10, GOLD: 20, PLATINUM: 40 },
    getCurrentValue: (stats) =>
      (stats.genres.get("Sci-Fi") ?? 0) + (stats.genres.get("Mecha") ?? 0),
  }),

  //* COMEDY & SLICE OF LIFE
  createBadge({
    id: "chill_master",
    title: "Spensierato",
    description: "Goditi la vita quotidiana e fatti quattro risate",
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
    title: "Invocatore di Mondi",
    description:
      "Viaggia in mondi fantasy, magici e ricchi di elementi soprannaturali",
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
    title: "Esperto di Batticuore",
    description: "Vivi storie d'amore intense, pianti e intrecci drammatici",
    category: "GENRE",
    isSecret: false,
    thresholds: { BRONZE: 4, SILVER: 12, GOLD: 25, PLATINUM: 45 },
    getCurrentValue: (stats) =>
      (stats.genres.get("Romance") ?? 0) + (stats.genres.get("Drama") ?? 0),
  }),

  //* HORROR & THRILLER & PSYCHOLOGICAL & MYSTERY
  createBadge({
    id: "mind_games",
    title: "Detective del Brivido",
    description: "Risolvi misteri intricati e sopravvivi a horror psicologici",
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
    title: "Campione Nazionale",
    description: "Sudore, lacrime e spirito di squadra sul campo da gioco",
    category: "GENRE",
    isSecret: false,
    thresholds: { BRONZE: 2, SILVER: 6, GOLD: 12, PLATINUM: 25 },
    getCurrentValue: (stats) => stats.genres.get("Sports") ?? 0,
  }),

  //* MUSIC
  createBadge({
    id: "music_idol",
    title: "Idolo del Palco",
    description: "Lasciati trasportare dal ritmo e dalle performance musicali",
    category: "GENRE",
    isSecret: false,
    thresholds: { BRONZE: 2, SILVER: 5, GOLD: 10, PLATINUM: 20 },
    getCurrentValue: (stats) => stats.genres.get("Music") ?? 0,
  }),

  //* BADGE DI TEMPO
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

  //* BADGE SEGRETI
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
