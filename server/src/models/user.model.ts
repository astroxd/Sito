import { supabase } from "../config/supabaseClient";

export interface User {
  id: number;
  email: string;
  username: string;
  avatarUrl?: string;
  bannerUrl?: string;
  createdAt?: string;
  refreshToken?: string;
}

export interface FoundUser {
  userId: number;
  username: string;
  avatarUrl: string;
  // count: number;
}

const serverUrl = process.env.SERVER_URL || "http://localhost:3001";

export const User = {
  findById: async (userId: number): Promise<User | null> => {
    const { data, error } = await supabase
      .from("user")
      .select(
        `
      id: user_id,
      email,
      username,
      avatarUrl: avatar_url,
      bannerUrl: banner_url,
      createdAt: created_at,
      refreshToken: refresh_token
      `,
      )
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error(`Error in findById [${error.code}]: ${error.message}`);
      throw error;
    }

    if (data) {
      return {
        ...data,
        avatarUrl: User.formatUserAvatar(data.username, data.avatarUrl),
      };
    }

    return null;
  },

  findByEmail: async (email: string): Promise<User | null> => {
    const { data, error } = await supabase
      .from("user")
      .select(
        `
        id: user_id,
        email,
        username,
        avatarUrl: avatar,
        bannerUrl: banner,
        createdAt: created_at,
        refreshToken: refresh_token
      `,
      )
      .eq("email", email)
      .maybeSingle();

    if (error) {
      console.error(`Error in findByEmail [${error.code}]: ${error.message}`);
      throw error;
    }

    if (data) {
      return {
        ...data,
        avatarUrl: User.formatUserAvatar(data.username, data.avatarUrl),
      };
    }

    return null;
  },

  findByUsername: async (username: string): Promise<User | null> => {
    const { data, error } = await supabase
      .from("user")
      .select(
        `
      id: user_id,
      email,
      username,
      avatarUrl: avatar_url,
      bannerUrl: banner_url`,
      )
      .eq("username", username)
      .maybeSingle();

    if (error) {
      console.error(
        `Error in findByUsername [${error.code}]: ${error.message}`,
      );
      throw error;
    }

    if (data) {
      return {
        ...data,
        avatarUrl: User.formatUserAvatar(data.username, data.avatarUrl),
      };
    }

    return null;
  },

  findByRefreshToken: async (refreshToken: string): Promise<User | null> => {
    const { data, error } = await supabase
      .from("user")
      .select(
        `
        id: user_id,
        email,
        username,
        avatarUrl: avatar,
        bannerUrl: banner,
        createdAt: created_at,
        refreshToken: refresh_token
      `,
      )
      .eq("refresh_token", refreshToken)
      .maybeSingle();

    if (error) {
      console.error(
        `Error in findByRefreshToken [${error.code}]: ${error.message}`,
      );
      throw error;
    }

    if (data) {
      return {
        ...data,
        avatarUrl: User.formatUserAvatar(data.username, data.avatarUrl),
      };
    }

    return null;
  },

  searchByUsername: async (
    userId: number,
    username: string,
    perPage: number,
    offset: number = 0,
  ): Promise<FoundUser[]> => {
    const { data, error } = await supabase
      .from("user")
      .select(
        `
        userId: user_id,
        username,
        avatar
      `,
      )
      .neq("user_id", userId)
      .ilike("username", `${username}%`)
      .range(offset, offset + perPage - 1);

    if (error) {
      console.error(
        `Error in searchByUsername [${error.code}]: ${error.message}`,
      );
      throw error;
    }

    if (!data) return [];

    return data.map((user) => {
      return {
        userId: user.userId,
        username: user.username,
        avatarUrl: User.formatUserAvatar(user.username, user.avatar),
      };
    });
  },

  countSearchMatches: async (
    userId: number,
    username: string,
  ): Promise<number> => {
    const { error, count } = await supabase
      .from("user")
      .select("*", { count: "exact", head: true })
      .neq("user_id", userId)
      .ilike("username", `${username}%`);

    if (error) {
      console.error(
        `Error in countSearchMatches [${error.code}]: ${error.message}`,
      );
      throw error;
    }

    return count || 0;
  },

  createUser: async (
    email: string,
    passwordHash: string,
    username: string,
    avatar?: string,
  ): Promise<number> => {
    const { data, error } = await supabase
      .from("user")
      .insert([
        {
          email,
          password_hash: passwordHash,
          username,
          avatar_url: avatar ?? null,
          banner_url: null,
        },
      ])
      .select("user_id")
      .single();

    if (error) {
      console.error(`Error in createUser [${error.code}]: ${error.message}`);
      throw error;
    }

    return data.user_id;
  },

  updateRefreshToken: async (
    userId: number,
    refreshToken: string,
  ): Promise<void> => {
    const { error } = await supabase
      .from("user")
      .update({ refresh_token: refreshToken })
      .eq("user_id", userId);

    if (error) {
      console.error(
        `Error in updateRefreshToken [${error.code}]: ${error.message}`,
      );
      throw error;
    }
  },

  getPasswordFromEmail: async (email: string): Promise<string | null> => {
    const { data, error } = await supabase
      .from("user")
      .select("passwordHash: password_hash")
      .eq("email", email)
      .maybeSingle();

    if (error) {
      console.error(
        `Error in getPasswordFromEmail [${error.code}]: ${error.message}`,
      );
      throw error;
    }

    return data?.passwordHash ?? null;
  },

  revokeRefreshToken: async (userId: number): Promise<void> => {
    const { error } = await supabase
      .from("user")
      .update({ refresh_token: null })
      .eq("user_id", userId);

    if (error) {
      console.error(
        `Error in revokeRefreshToken [${error.code}]: ${error.message}`,
      );
      throw error;
    }
  },

  updateAvatar: async (
    userId: number,
    avatar: string | null,
  ): Promise<void> => {
    const { error } = await supabase
      .from("user")
      .update({ avatar_url: avatar })
      .eq("user_id", userId);

    if (error) {
      console.error(`Error in updateAvatar [${error.code}]: ${error.message}`);
      throw error;
    }
  },

  findLastEpisodeWatchedByAnimeId: async (
    userId: number,
    animeId: number,
  ): Promise<number | null> => {
    const { data, error } = await supabase
      .from("watched_episodes")
      .select("lastEpisode: last_episode")
      .eq("user_id", userId)
      .eq("anime_id", animeId)
      .maybeSingle();

    if (error) {
      console.error(
        `Error in findLastEpisodeWatchedByAnimeId [${error.code}]: ${error.message}`,
      );
      throw error;
    }

    return data?.lastEpisode ?? null;
  },

  insertAnimeIntoWatchedEpisodes: async (
    userId: number,
    animeId: number,
    watchedEpisodes: number = 1,
  ): Promise<void> => {
    const { error } = await supabase.from("watched_episodes").insert([
      {
        user_id: userId,
        anime_id: animeId,
        last_episode: watchedEpisodes,
      },
    ]);

    if (error) {
      console.error(
        `Error in insertAnimeIntoWatchedEpisodes [${error.code}]: ${error.message}`,
      );
      throw error;
    }
  },

  updateLastWatchedEpisode: async (
    userId: number,
    animeId: number,
    lastWatchedEpisode: number,
  ): Promise<void> => {
    const { error } = await supabase
      .from("watched_episodes")
      .update({ last_episode: lastWatchedEpisode })
      .eq("user_id", userId)
      .eq("anime_id", animeId);

    if (error) {
      console.error(
        `Error in updateLastWatchedEpisode [${error.code}]: ${error.message}`,
      );
      throw error;
    }
  },

  deleteFromWatchingByAnimeId: async (
    userId: number,
    animeId: number,
  ): Promise<void> => {
    const { data, error } = await supabase
      .from("watched_episodes")
      .delete()
      .eq("user_id", userId)
      .eq("anime_id", animeId);

    if (error) {
      console.error(
        `Error in deleteFromWatchingByAnimeId [${error.code}]: ${error.message}`,
      );
      throw error;
    }
  },

  formatUserAvatar: (username: string, avatar: string | null | undefined) => {
    return avatar
      ? `${serverUrl}/static/avatar/${avatar}`
      : `https://api.dicebear.com/9.x/initials/svg?seed=${username}`;
  },
};
