import { Request, Response } from "express";
import db from "../config/database";
import { AnimeGenre, VALID_GENRES_SET } from "../models/statistics.model";

export const getUserStats = (req: Request, res: Response) => {
  const userId = res.locals.userId;

  try {
    const totalStatsRow = db
      .prepare(
        `
      SELECT total_time 
      FROM 'Statistics' 
      WHERE user_id = ?
    `,
      )
      .get(userId) as { total_time: number } | undefined;

    const totalMinutes = totalStatsRow ? totalStatsRow.total_time : 0;

    // 2. 📊 Recuperiamo la cronologia degli ultimi 7 giorni con dati reali da 'Daily WatchTime'
    // Ordiniamo per data decrescente e prendiamo gli ultimi 7 record inseriti
    const dailyRows = db
      .prepare(
        `
      SELECT date, watchtime 
      FROM 'Daily WatchTime'
      WHERE user_id = ? 
      ORDER BY date DESC 
      LIMIT 7
    `,
      )
      .all(userId) as { date: string; watchtime: number }[];

    // 2. 📅 CALCOLO DEGLI INTERVALLI TEMPORALI (Lunedì scorso -> Domenica corrente)
    const today = new Date();

    // Trova il giorno della settimana corrente (0 = Domenica, 1 = Lunedì, ..., 6 = Sabato)
    const currentDayIdx = today.getDay();
    // Spostiamo l'indice in modo che 0 sia Lunedì, ..., 6 sia Domenica
    const daysSinceMonday = currentDayIdx === 0 ? 6 : currentDayIdx - 1;

    // Lunedì di QUESTA settimana
    const thisMonday = new Date(today);
    thisMonday.setDate(today.getDate() - daysSinceMonday);

    // Lunedì della SETTIMANA SCORSA
    const lastMonday = new Date(thisMonday);
    lastMonday.setDate(thisMonday.getDate() - 7);

    // Domenica di QUESTA settimana
    const thisSunday = new Date(thisMonday);
    thisSunday.setDate(thisMonday.getDate() + 6);

    // Convertiamo in stringhe formato 'YYYY-MM-DD' per SQLite
    const startRangeStr = lastMonday.toISOString().split("T")[0];
    const endRangeStr = thisSunday.toISOString().split("T")[0];

    // 3. 🔍 Query SQL: Prende tutti i dati tra il lunedì scorso e la domenica attuale
    const watchtimeRows = db
      .prepare(
        `
      SELECT date, watchtime 
      FROM 'Daily WatchTime'
      WHERE user_id = ? AND date BETWEEN ? AND ?
      ORDER BY date ASC
    `,
      )
      .all(userId, startRangeStr, endRangeStr) as {
      date: string;
      watchtime: number;
    }[];

    // Creiamo una mappa (Key-Value) per cercare velocemente i minuti partendo dalla data
    const watchTimeMap = new Map<string, number>(
      watchtimeRows.map((row) => [row.date, row.watchtime]),
    );

    // 4. 🧮 COSTRUIAMO I 7 GIORNI PER ENTRAMBE LE SETTIMANE
    // Inizializziamo i vettori a 0 in modo che i giorni senza visioni abbiano comunque lo "0" nel grafico
    const currentWeekData: number[] = [];
    const previousWeekData: number[] = [];
    const labels = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];

    for (let i = 0; i < 7; i++) {
      // Data corrispondente nella settimana scorsa
      const dLast = new Date(lastMonday);
      dLast.setDate(lastMonday.getDate() + i);
      const dLastStr = dLast.toISOString().split("T")[0];
      previousWeekData.push(watchTimeMap.get(dLastStr) ?? 0); // Se non c'è record, metti 0

      // Data corrispondente nella settimana corrente
      const dThis = new Date(thisMonday);
      dThis.setDate(thisMonday.getDate() + i);
      const dThisStr = dThis.toISOString().split("T")[0];
      currentWeekData.push(watchTimeMap.get(dThisStr) ?? 0); // Se non c'è record, metti 0
    }

    const days = Math.floor(totalMinutes / (24 * 60));
    const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
    const minutes = totalMinutes % 60;

    const rows = db
      .prepare(
        `
      SELECT genre, watched_animes as watchedAnimes
      FROM 'Genre' 
      WHERE user_id = ? AND watched_animes > 0
      ORDER BY watched_animes DESC
    `,
      )
      .all(userId) as { genre: string; watchedAnimes: number }[];

    const formattedGenres = rows.map((row) => ({
      genre: row.genre,
      count: row.watchedAnimes,
    }));

    return res.status(200).json({
      totalWatchTime: {
        rawMinutes: totalMinutes,
        days: days,
        hours: hours,
        minutes: minutes,
        formattedString: `${days}d ${hours}h ${minutes}m`, // Comodo da stampare direttamente
      },
      dailyHistory: {
        currentWeek: currentWeekData,
        previousWeek: previousWeekData,
      },
      genres: formattedGenres,
    });
  } catch (error) {
    console.error(error);
  }

  return res.status(500).json({ message: "INTERNAL SERVER ERROR" });
};

export const trackWatchTime = (
  userId: number,
  episodeDiff: number,
  episodeDuration: number,
) => {
  if (episodeDiff === 0 || !episodeDuration) return;

  const addedMinutes = episodeDiff * episodeDuration;

  db.transaction(() => {
    // 1. Aggiorna o Inserisce il tempo totale in 'Statistics'
    db.prepare(
      `
            INSERT INTO 'Statistics' (user_id, total_time) 
            VALUES (?, MAX(0,?))
            ON CONFLICT(user_id) DO UPDATE SET total_time = MAX(0, total_time + ?)
            `,
    ).run(userId, addedMinutes, addedMinutes);

    // 2. Aggiorna o Inserisce il tempo giornaliero in 'Daily WatchTime'
    db.prepare(
      `
        INSERT INTO 'Daily WatchTime' (user_id, date, watchtime) 
        VALUES (?, DATE('now'), MAX(0, ?))
        ON CONFLICT(user_id, date) DO UPDATE SET watchtime = MAX(0, watchtime + ?)
    `,
    ).run(userId, addedMinutes, addedMinutes);
  })();
};

export const updateGenreStats = (
  userId: number,
  genres: string[],
  action: "INCREMENT" | "DECREMENT",
) => {
  if (!genres || genres.length === 0) return;

  const valueChange = action === "INCREMENT" ? 1 : -1;

  const stmt = db.prepare(`
      INSERT INTO 'Genre' (user_id, genre, watched_animes) 
      VALUES (?, ?, MAX(0, ?))
      ON CONFLICT(user_id, genre) DO UPDATE SET watched_animes = MAX(0, watched_animes + ?)
    `);

  for (const genre of genres) {
    if (!genre) continue;

    const cleanGenre = genre.trim();

    if (VALID_GENRES_SET.has(cleanGenre)) {
      stmt.run(userId, cleanGenre as AnimeGenre, valueChange, valueChange);
    }
  }
};
