import { logger } from "@anime-hub/common";
import { supabase } from "../config/supabaseClient";
import * as crypto from "crypto";

export interface User {
  id: number;
  email: string;
  username: string;
  avatarUrl?: string;
  defaultAvatarUrl?: string;
  bannerUrl?: string;
  createdAt?: string;
  refreshToken?: string;
  avatarUpdatedAt?: string;
}

export interface FoundUser {
  userId: number;
  username: string;
  avatarUrl: string;
  // count: number;
}

const avatarsBucket = process.env.SUPABASE_AVATARS_BUCKET_ID || "avatars";

export const User = {
  findById: async (userId: number): Promise<User | null> => {
    const { data, error } = await supabase
      .from("user")
      .select(
        `
      id: user_id,
      email,
      username,
      avatarUpdatedAt: avatar_updated_at,
      bannerUrl: banner_url,
      createdAt: created_at,
      refreshToken: refresh_token
      `,
      )
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      logger.error(`Error in findById [${error.code}]: ${error.message}`);
      throw error;
    }

    if (data) {
      return {
        ...data,
        avatarUrl: User.formatUserAvatar(
          data.id,
          data.username,
          data.avatarUpdatedAt,
        ),
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
        avatarUpdatedAt: avatar_updated_at,
        bannerUrl: banner_url,
        createdAt: created_at,
        refreshToken: refresh_token
      `,
      )
      .eq("email", email)
      .maybeSingle();

    if (error) {
      logger.error(`Error in findByEmail [${error.code}]: ${error.message}`);
      throw error;
    }

    if (data) {
      return {
        ...data,
        avatarUrl: User.formatUserAvatar(
          data.id,
          data.username,
          data.avatarUpdatedAt,
        ),
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
      avatarUpdatedAt: avatar_updated_at,
      bannerUrl: banner_url`,
      )
      .eq("username", username)
      .maybeSingle();

    if (error) {
      logger.error(`Error in findByUsername [${error.code}]: ${error.message}`);
      throw error;
    }

    if (data) {
      return {
        ...data,
        avatarUrl: User.formatUserAvatar(
          data.id,
          data.username,
          data.avatarUpdatedAt,
        ),
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
        avatarUpdatedAt: avatar_updated_at,
        bannerUrl: banner_url,
        createdAt: created_at,
        refreshToken: refresh_token
      `,
      )
      .eq("refresh_token", refreshToken)
      .maybeSingle();

    if (error) {
      logger.error(
        `Error in findByRefreshToken [${error.code}]: ${error.message}`,
      );
      throw error;
    }

    if (data) {
      return {
        ...data,
        avatarUrl: User.formatUserAvatar(
          data.id,
          data.username,
          data.avatarUpdatedAt,
        ),
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
        avatarUpdatedAt: avatar_updated_at
      `,
      )
      .neq("user_id", userId)
      .ilike("username", `${username}%`)
      .range(offset, offset + perPage - 1);

    if (error) {
      logger.error(
        `Error in searchByUsername [${error.code}]: ${error.message}`,
      );
      throw error;
    }

    if (!data) return [];

    return data.map((user) => {
      return {
        userId: user.userId,
        username: user.username,
        avatarUrl: User.formatUserAvatar(
          user.userId,
          user.username,
          user.avatarUpdatedAt,
        ),
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
      logger.error(
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
  ): Promise<number> => {
    const { data, error } = await supabase
      .from("user")
      .insert([
        {
          email,
          password_hash: passwordHash,
          username,
          banner_url: null,
        },
      ])
      .select("user_id")
      .single();

    if (error) {
      logger.error(`Error in createUser [${error.code}]: ${error.message}`);
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
      logger.error(
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
      logger.error(
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
      logger.error(
        `Error in revokeRefreshToken [${error.code}]: ${error.message}`,
      );
      throw error;
    }
  },

  updateAvatar: async (
    userId: number,
  ): Promise<{
    uploadUrl: string;
    token: string;
  }> => {
    const { data, error } = await supabase.storage
      .from(avatarsBucket)
      .createSignedUploadUrl(User.getUserAvatarPath(userId), { upsert: true });

    if (error || !data) {
      logger.error(`Error in updateAvatar [${error.name}]: ${error.message}`);
      throw error;
    }

    return {
      uploadUrl: data.signedUrl,
      token: data.token,
    };
  },

  updateAvatarUpdatedAt: async (userId: number) => {
    const newUpdatedAt = new Date().toISOString();

    const { error } = await supabase
      .from("user")
      .update({ avatar_updated_at: newUpdatedAt })
      .eq("user_id", userId);

    if (error) {
      logger.error(
        `Error in updateAvatarUpdatedAt [${error.code}]: ${error.message}`,
      );
      throw error;
    }

    return newUpdatedAt;
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
      logger.error(
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
      logger.error(
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
      logger.error(
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
      logger.error(
        `Error in deleteFromWatchingByAnimeId [${error.code}]: ${error.message}`,
      );
      throw error;
    }
  },

  formatUserAvatar: (
    userId: number,
    username: string,
    avatarUpdatedAt: string | null | undefined,
  ) => {
    if (!avatarUpdatedAt)
      return `https://api.dicebear.com/9.x/initials/svg?seed=${username}`;

    const {
      data: { publicUrl },
    } = supabase.storage
      .from(avatarsBucket)
      .getPublicUrl(User.getUserAvatarPath(userId));

    return `${publicUrl}?t=${avatarUpdatedAt}`;
  },

  getUserAvatarPath: (userId: number) => {
    const salt =
      process.env.AVATAR_SALT_KEY || "superrandomsecretstringforhashing";

    const folder = crypto
      .createHmac("sha256", salt)
      .update(userId.toString())
      .digest("hex");

    return `${folder}/avatar.jpg`;
  },
};
