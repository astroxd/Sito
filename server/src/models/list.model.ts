import { supabase } from "../config/supabaseClient";

export interface PrivateAnime {
  userId: number;
  animeId: number;
  status: AnimeStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface ListedAnime extends PrivateAnime {
  animeMalId: number;
  animeTitle: string;
  animeCover: string;
  animeEpisodes: number;
  lastEpisodeWatched: number;
  // length?: number;
}

export interface ListedAnimes {
  items: ListedAnime[];
  totalCount: number;
}

export enum AnimeStatus {
  Watching = "WATCHING",
  Completed = "COMPLETED",
  Dropped = "DROPPED",
}

export const List = {
  findAllByStatus: async (
    userId: number,
    status: AnimeStatus,
    perPage: number,
    offset = 0,
  ): Promise<ListedAnimes> => {
    const { data, error } = await supabase
      .from("private_anime")
      .select(
        `
        user_id,
        status,
        anime: anime_id!inner (
          anime_id,
          anime_mal_id,
          anime_title,
          anime_cover,
          anime_episodes
        ),
        watched: watched_episodes!inner (
          last_episode_watched
        )
      `,
      )
      .eq("user_id", userId)
      .eq("status", status)
      .eq("watched.user_id", userId)
      .range(offset, offset + perPage - 1);

    if (error) {
      console.error(
        `Error in findAllByStatus [${error.code}]: ${error.message}`,
      );
      throw error;
    }

    const { count, error: countError } = await supabase
      .from("private_anime")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", status);

    if (countError) {
      console.error(
        `Error in findAllByStatus (Count) [${countError.code}]: ${countError.message}`,
      );
      throw countError;
    }

    if (!data) {
      return { items: [], totalCount: 0 };
    }

    const items: ListedAnime[] = data.map((row: any) => {
      const anime = row.anime;
      const watched =
        row.watched && row.watched.length > 0
          ? row.watched[0]
          : { last_episode_watched: 0 };

      return {
        userId: row.user_id,
        status: row.status as AnimeStatus,
        animeId: anime.anime_id,
        animeMalId: anime.anime_mal_id,
        animeTitle: anime.anime_title,
        animeCover: anime.anime_cover,
        animeEpisodes: anime.anime_episodes,
        lastEpisodeWatched: watched.last_episode_watched,
      };
    });

    return {
      items,
      totalCount: count || 0,
    };
  },

  findPrivateAnimeByAnimeId: async (
    userId: number,
    animeId: number,
  ): Promise<PrivateAnime | null> => {
    const { data, error } = await supabase
      .from("private_anime")
      .select(
        `
        userId: user_id,
        animeId: anime_id,
        status,
        createdAt: created_at,
        updatedAt: updated_at
      `,
      )
      .eq("user_id", userId)
      .eq("anime_id", animeId)
      .maybeSingle();

    if (error) {
      console.error(
        `Error in findPrivateAnimeByAnimeId [${error.code}]: ${error.message}`,
      );
      throw error;
    }

    return data || null;
  },

  findByAnimeTitle: async (
    userId: number,
    status: AnimeStatus,
    perPage: number,
    offset = 0,
    animeTitle: string,
  ): Promise<ListedAnimes> => {
    const { data, error } = await supabase
      .from("anime")
      .select(
        `
    animeId: anime_id,
    animeMalId: mal_id,
    animeTitle: title,
    animeCover: cover_url,
    animeEpisodes: episodes,
    
    private_anime!inner (
      userId: user_id,
      status
    ),
    
    watched: watched_episodes!inner (
      lastEpisodeWatched: last_episode,
      user_id
    )
  `,
      )
      // Filtri sulla tabella di join "private_anime"
      .eq("private_anime.user_id", userId)
      .eq("private_anime.status", status)
      // Filtro sulla tabella di join "watched_episodes" per isolare lo storico dell'utente
      .eq("watched_episodes.user_id", userId)
      // Filtro sul titolo (nella tabella principale "anime")
      .ilike("title", `${animeTitle}%`)
      // Paginazione
      .range(offset, offset + perPage - 1);

    if (error) {
      console.error(
        `Error in findByAnimeTitle [${error.code}]: ${error.message}`,
      );
      throw error;
    }

    const { count, error: countError } = await supabase
      .from("private_anime")
      .select("*, anime: anime_id!inner()", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", status)
      .ilike("anime.title", `${animeTitle}%`);

    if (countError) {
      console.error(
        `Error in findByAnimeTitle (Count) [${countError.code}]: ${countError.message}`,
      );
      throw countError;
    }

    if (!data) {
      return { items: [], totalCount: 0 };
    }

    const items: ListedAnime[] = data.map((row: any) => {
      const watched =
        row.watched && row.watched.length > 0
          ? row.watched[0]
          : { lastEpisodeWatched: 0 };

      return {
        userId: row.private_anime.userId,
        status: row.private_anime.status as AnimeStatus,
        animeId: row.animeId,
        animeMalId: row.animeMalId,
        animeTitle: row.animeTitle,
        animeCover: row.animeCover,
        animeEpisodes: row.animeEpisodes,
        lastEpisodeWatched: watched.lastEpisodeWatched,
      };
    });

    return {
      items,
      totalCount: count || 0,
    };
  },

  insertPrivateAnime: async (
    userId: number,
    animeId: number,
    status: AnimeStatus,
  ): Promise<PrivateAnime> => {
    const { data, error } = await supabase
      .from("private_anime")
      .insert([
        {
          user_id: userId,
          anime_id: animeId,
          status: status,
        },
      ])
      .select(
        `
        userId: user_id,
        animeId: anime_id,
        status,
        createdAt: created_at,
        updatedAt: updated_at
      `,
      )
      .single();

    if (error) {
      console.error(
        `Error in insertPrivateAnime [${error.code}]: ${error.message}`,
      );
      throw error;
    }

    return data;
  },

  updateAnimeStatus: async (
    userId: number,
    animeId: number,
    status: AnimeStatus,
  ): Promise<PrivateAnime> => {
    const { data, error } = await supabase
      .from("private_anime")
      .update({
        status: status,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("anime_id", animeId)
      .select(
        `
        userId: user_id,
        animeId: anime_id,
        status,
        createdAt: created_at,
        updatedAt: updated_at
      `,
      )
      .single();

    if (error) {
      console.error(
        `Error in updateAnimeStatus [${error.code}]: ${error.message}`,
      );
      throw error;
    }

    return data;
  },

  deleteByAnimeId: async (userId: number, animeId: number): Promise<number> => {
    const { error, count } = await supabase
      .from("private_anime")
      .delete({ count: "exact" })
      .eq("user_id", userId)
      .eq("anime_id", animeId);

    if (error) {
      console.error(
        `Error in deleteByAnimeId [${error.code}]: ${error.message}`,
      );
      throw error;
    }

    return count ?? 0;
  },

  findAnimesProgressByUserId: async (
    userId: number,
    status: AnimeStatus,
  ): Promise<ListedAnime[]> => {
    const { data, error } = await supabase
      .from("anime")
      .select(
        `
        animeId: anime_id,
        animeMalId: mal_id,
        animeTitle: title,
        animeCover: cover_url,
        animeEpisodes: episodes,
        
        private_anime!inner (
          status,
          userId: user_id,
          updated_at
        ),
        
        watched: watched_episodes!inner (
          lastEpisodeWatched: last_episode,
          user_id
        )
      `,
      )
      .eq("private_anime.user_id", userId)
      .eq("private_anime.status", status)
      .eq("watched.user_id", userId)
      .order("updated_at", {
        referencedTable: "private_anime",
        ascending: false,
      });

    if (error) {
      console.error(
        `Error in findAnimesProgressByUserId [${error.code}]: ${error.message}`,
      );
      throw error;
    }

    if (!data) return [];

    return data.map((row: any) => {
      const watched =
        row.watched && row.watched.length > 0
          ? row.watched[0]
          : { lastEpisodeWatched: 0 };

      return {
        userId: row.private_anime.userId,
        status: row.private_anime.status as AnimeStatus,
        animeId: row.animeId,
        animeMalId: row.animeMalId,
        animeTitle: row.animeTitle,
        animeCover: row.animeCover,
        animeEpisodes: row.animeEpisodes,
        lastEpisodeWatched: watched.lastEpisodeWatched,
      };
    });
  },
};
