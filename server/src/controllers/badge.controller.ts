import { Request, Response } from "express";
import db from "../config/database";
import { BadgeRank, BADGES_LIST } from "../models/badge.model";

const checkAndUnlockBadges = (userId: number) => {
  // 1. Recuperiamo dal DB i badge+rank che l'utente ha già in cassaforte
  const unlockedRows = db
    .prepare(
      `
    SELECT badge_id, rank FROM 'User Badge' WHERE user_id = ?
  `,
    )
    .all(userId) as { badge_id: string; rank: BadgeRank }[];

  // Generiamo un set di stringhe veloci da confrontare (es: "shonen_master-BRONZE")
  const alreadyUnlocked = new Set<string>(
    unlockedRows.map((r) => `${r.badge_id}-${r.rank}`),
  );

  // 2. Recuperiamo il tempo totale di visione (WatchTime)
  const totalStatsRow = db
    .prepare(
      `
    SELECT total_time FROM 'Statistics' WHERE user_id = ?
  `,
    )
    .get(userId) as { total_time: number } | undefined;
  const totalMinutes = totalStatsRow ? totalStatsRow.total_time : 0;

  // 3. Recuperiamo il counter di tutti i generi visti dall'utente
  const genreRows = db
    .prepare(
      `
    SELECT genre, watched_animes FROM 'Genre' WHERE user_id = ?
  `,
    )
    .all(userId) as { genre: string; watched_animes: number }[];
  const genresMap = new Map<string, number>(
    genreRows.map((r) => [r.genre, r.watched_animes]),
  );

  // Uniamo i dati in un unico payload da dare in pasto alle formule
  const statsPayload = { genres: genresMap, totalMinutes };

  // Prepariamo lo statement di inserimento
  const insertStmt = db.prepare(`
    INSERT OR IGNORE INTO 'User Badge' (user_id, badge_id, rank) 
    VALUES (?, ?, ?)
  `);

  // 4. Analizziamo ogni badge inserito nel file di configurazione
  for (const badge of BADGES_LIST) {
    const userValue = badge.getCurrentValue(statsPayload);

    // Controlliamo ogni soglia legata ai singoli Rank del badge
    for (const [rank, threshold] of Object.entries(badge.thresholds)) {
      if (!threshold) continue;

      const rankKey = `${badge.id}-${rank}`;

      // Se l'utente possiede già questo rank specifico, passiamo oltre
      if (alreadyUnlocked.has(rankKey)) continue;

      // Se il progresso dell'utente soddisfa o supera la soglia, scatta lo SBLOCCO!
      if (userValue >= threshold) {
        insertStmt.run(userId, badge.id, rank);
      }
    }
  }
};
const getUserBadgesCatalog = (userId: number) => {
  // 1. Recuperiamo tutti i badge sbloccati dall'utente dal DB
  const rows = db
    .prepare(
      `
    SELECT badge_id, rank, unlocked_at 
    FROM 'User Badge' 
    WHERE user_id = ?
  `,
    )
    .all(userId) as {
    badge_id: string;
    rank: BadgeRank;
    unlocked_at: string;
  }[];

  // Raggruppiamo i rank sbloccati per ogni badge, es: { 'shonen_master': ['BRONZE', 'SILVER'] }
  const userUnlockedMap = new Map<
    string,
    { ranks: BadgeRank[]; lastUnlockDate: string }
  >();

  rows.forEach((r) => {
    if (!userUnlockedMap.has(r.badge_id)) {
      userUnlockedMap.set(r.badge_id, {
        ranks: [],
        lastUnlockDate: r.unlocked_at,
      });
    }
    userUnlockedMap.get(r.badge_id)!.ranks.push(r.rank);
  });

  // 2. Recuperiamo le stats attuali per calcolare i progressi numerici (es. 7 di 15)
  const totalStatsRow = db
    .prepare(`SELECT total_time FROM 'Statistics' WHERE user_id = ?`)
    .get(userId) as { total_time: number } | undefined;
  const totalMinutes = totalStatsRow ? totalStatsRow.total_time : 0;

  const genreRows = db
    .prepare(`SELECT genre, watched_animes FROM 'Genre' WHERE user_id = ?`)
    .all(userId) as { genre: string; watched_animes: number }[];
  const genresMap = new Map<string, number>(
    genreRows.map((r) => [r.genre, r.watched_animes]),
  );
  const statsPayload = { genres: genresMap, totalMinutes };

  // 3. Uniamo il catalogo statico con i progressi reali dell'utente
  return BADGES_LIST.map((badge) => {
    const userProgress = userUnlockedMap.get(badge.id);
    const hasRanks = userProgress && userProgress.ranks.length > 0;

    // Ordine di importanza dei rank per capire qual è il massimo raggiunto
    const rankOrder: BadgeRank[] = [
      "SECRET",
      "PLATINUM",
      "GOLD",
      "SILVER",
      "BRONZE",
    ];
    const highestRank = hasRanks
      ? (rankOrder.find((r) => userProgress.ranks.includes(r)) ?? null)
      : null;

    // Troviamo qual è il prossimo rank da sbloccare e la sua soglia
    const availableRanks = Object.keys(badge.thresholds) as BadgeRank[];
    const nextRank = highestRank
      ? availableRanks.find((r) => !userProgress?.ranks.includes(r)) // Il primo rank disponibile che l'utente non ha
      : availableRanks[0]; // Se non ha sbloccato nulla, il primo in assoluto (es. BRONZE)

    const nextRankThreshold = nextRank ? badge.thresholds[nextRank] : null;
    const currentValue = badge.getCurrentValue(statsPayload);

    // Calcoliamo la percentuale di completamento verso il prossimo livello
    let progressPercentage = 100;
    if (nextRankThreshold) {
      progressPercentage = parseFloat(
        ((currentValue / nextRankThreshold) * 100).toFixed(1),
      );
      if (progressPercentage > 100) progressPercentage = 100;
    }

    // 🕵️ CASO BADGE SEGRETO E ANCORA BLOCCATO
    if (badge.isSecret && !hasRanks) {
      return {
        id: badge.id,
        title: "Obiettivo Segreto",
        description: "?????? ??????? ??????",
        category: badge.category,
        isSecret: true,
        unlocked: false,
        highestRankUnlocked: null,
        nextRank: null,
        nextRankThreshold: null,
        currentValue: 0,
        progressPercentage: 0,
        unlockedAt: null,
      };
    }

    // BADGE NORMALE (O SEGRETO GIÀ SBLOCCATO)
    return {
      id: badge.id,
      title: badge.title,
      description: badge.description,
      category: badge.category,
      isSecret: badge.isSecret,
      unlocked: hasRanks,
      highestRankUnlocked: highestRank,
      nextRank: nextRank ?? null,
      nextRankThreshold: nextRankThreshold ?? null,
      currentValue: currentValue,
      progressPercentage: progressPercentage,
      unlockedAt: userProgress ? userProgress.lastUnlockDate : null,
    };
  });
};

export const getUserBadges = (req: Request, res: Response) => {
  const userId = res.locals.userId;

  try {
    const catalog = getUserBadgesCatalog(userId);

    // Recuperiamo il protocollo e l'host del server (es: http://localhost:3000)
    const serverUrl = `${req.protocol}://${req.get("host")}`;

    // Aggiungiamo il percorso statico dell'immagine a ogni badge
    const catalogWithImages = catalog.map((badge) => {
      // Se il badge è segreto E bloccato, diamogli l'immagine del lucchetto/punto di domanda
      const imageName =
        badge.isSecret && !badge.unlocked
          ? "secret-locked.png"
          : `${badge.id}.png`;

      return {
        ...badge,
        imageUrl: `${serverUrl}/badges/${imageName}`, // Genera: http://localhost:3000/badges/shonen_master.png
      };
    });

    return res.status(200).json({ data: catalogWithImages });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "INTERNAL SERVER ERROR" });
  }
};
