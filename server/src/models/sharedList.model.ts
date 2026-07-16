import { dbPool, supabase } from "../config/supabaseClient";
import { Anime } from "./anime.model";
import { User } from "./user.model";

export type SharedListRole = "OWNER" | "EDITOR" | "MEMBER";
export type SharedListInvitationStatus = "PENDING" | "ACCEPTED";

interface SharedListUser {
  sharedListId: number;
  userId: number;
  role: SharedListRole;
}

export interface InvitedUser {
  userId: number;
  username: string;
  avatarUrl: string | null;
}

export interface SharedList {
  id: number;
  name: string;
  message: string | null;

  sharedListUser?: SharedListUser;
  // sharedListMembers: SharedListMember[];
}

export interface SharedListMember {
  id: number;
  username: string;
  avatarUrl: string | null;
  role: SharedListRole;
  totalEpisodes: number;
  // length: number;
}

export interface SharedListProgress {
  sharedListId: number;
  userId: number;
  animeId: number;
  currentEpisode: number | null;
  updatedAt: string | null;
}

export interface SharedListAnime {
  sharedListId: number;
  animeId: number;
  addedAt: string;
  lastActivityAt: string;
}

export type SharedListUserProgress = SharedListProgress & Anime;

export interface AnimeProgress {
  username: string;
  avatarUrl: string;
  currentEpisode: number;
  animeId: number;
  updatedAt: string;
}

export interface SharedListInvitation {
  sharedList: {
    sharedListId: number;
    sharedListName: string;
  };
  senderInfo: {
    senderUserId: number;
    senderUsername: string;
    senderAvatarUrl: string;
  };
}

export const SharedList = {
  // Verifica se una lista condivisa esiste tramite il suo ID
  exists: async (listId: number): Promise<boolean> => {
    const { data, error } = await supabase
      .from("shared_list")
      .select("shared_list_id")
      .eq("shared_list_id", listId)
      .maybeSingle();

    if (error) {
      console.error(`Error in exists [${error.code}]: ${error.message}`);
      throw error;
    }

    return data !== null;
  },

  findAllByUserId: async (userId: number): Promise<SharedList[]> => {
    const { data, error } = await supabase
      .from("shared_list")
      .select(
        `
        id: shared_list_id,
        name,
        message,
        shared_list_user!inner (
          role
        )
      `,
      )
      .eq("shared_list_user.user_id", userId);

    if (error) {
      console.error(
        `Error in findAllByUserId [${error.code}]: ${error.message}`,
      );
      throw error;
    }

    if (!data) return [];

    return data.map((list: any) => {
      const user = list.shared_list_user[0];

      return {
        id: list.id,
        name: list.name,
        message: list.message ?? null,
        sharedListUser: {
          sharedListId: list.id,
          userId: userId,
          role: user.role,
        },
      } as SharedList;
    });
  },

  findAllMembersByListId: async (
    listId: number,
  ): Promise<SharedListMember[]> => {
    const { data, error } = await supabase.rpc("get_shared_list_members", {
      p_list_id: listId,
    });

    if (error) {
      console.error(
        `Error in findAllMembersByListId [${error.code}]: ${error.message}`,
      );
      throw error;
    }

    if (!data) return [];

    return data.map((member: any) => ({
      id: Number(member.id),
      username: member.username,
      avatarUrl: User.formatUserAvatar(member.username, member.avatar_url),
      role: member.role,
      totalEpisodes: Number(member.totalEpisodes),
    }));
  },

  countMembersByListId: async (listId: number): Promise<number> => {
    const { count, error } = await supabase
      .from("shared_list_user")
      .select("*", { count: "exact", head: true })
      .eq("shared_list_id", listId);

    if (error) {
      console.error(
        `Error in countMembersByListId [${error.code}]: ${error.message}`,
      );
      throw error;
    }

    return count ?? 0;
  },

  createWithUserId: async (
    userId: number,
    sharedListName: string,
    message: string | null = null,
    role: SharedListRole = "OWNER",
  ): Promise<void> => {
    const client = await dbPool.connect();

    try {
      await client.query("BEGIN");

      const listResult = await client.query(
        `INSERT INTO shared_list (name, message) 
         VALUES ($1, $2) 
         RETURNING shared_list_id`,
        [sharedListName, message],
      );

      const sharedListId = listResult.rows[0].shared_list_id;

      await client.query(
        `INSERT INTO shared_list_user (shared_list_id, user_id, role) 
         VALUES ($1, $2, $3)`,
        [sharedListId, userId, role],
      );

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      console.error(`Transaction failed in createWithUserId:`, error);
      throw error;
    } finally {
      client.release();
    }
  },

  findByListId: async (
    listId: number,
    userId: number,
  ): Promise<SharedList | null> => {
    const { data, error } = await supabase
      .from("shared_list")
      .select(
        `
        id: shared_list_id,
        name,
        message,
        shared_list_user!inner (
          user_id,
          role
        )
      `,
      )
      .eq("shared_list_id", listId)
      .eq("shared_list_user.user_id", userId)
      .maybeSingle();

    if (error) {
      console.error(`Error in findByListId [${error.code}]: ${error.message}`);
      throw error;
    }

    if (!data) return null;

    const userRelation = data.shared_list_user[0];

    return {
      id: data.id,
      name: data.name,
      message: data.message,
      sharedListUser: {
        sharedListId: data.id,
        userId: userRelation.user_id,
        role: userRelation.role,
      },
    };
  },

  findUserProgressByUserId: async (
    listId: number,
    userId: number,
  ): Promise<SharedListUserProgress[]> => {
    const { data, error } = await supabase
      .from("shared_list_anime")
      .select(
        `
        shared_list_id,
        anime: anime_id (
          animeId: anime_id,
          malId: mal_id,
          animeTitle: title,
          animeCover: cover_url,
          animeEpisodes: episodes,
          animeGenres: genres
        ),
        progress: shared_list_progress (
          current_episode,
          updated_at,
          user_id
        )
      `,
      )
      .eq("shared_list_id", listId)
      .eq("shared_list_progress.user_id", userId);

    if (error) {
      console.error(
        `Error in findUserProgressByUserId [${error.code}]: ${error.message}`,
      );
      throw error;
    }

    if (!data) return [];

    const formattedProgress = data.map((row: any) => {
      const anime = row.anime;
      const progress =
        row.progress && row.progress.length > 0 ? row.progress[0] : null;

      return {
        sharedListId: row.shared_list_id,
        userId: progress ? progress.user_id : userId,
        currentEpisode: progress ? progress.current_episode : null,
        updatedAt: progress ? progress.updated_at : null,
        animeId: anime.animeId,
        animeMalId: anime.animeMalId,
        animeTitle: anime.animeTitle,
        animeCover: anime.animeCover,
        animeEpisodes: anime.animeEpisodes,
        animeGenres: anime.animeGenres,
      } as SharedListUserProgress;
    });

    return formattedProgress.sort((a, b) => {
      if (!a.updatedAt) return 1;
      if (!b.updatedAt) return -1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  },

  findAllAnimeByListId: async (
    listId: number,
  ): Promise<(SharedListAnime & Anime)[]> => {
    const { data, error } = await supabase
      .from("shared_list_anime")
      .select(
        `
        shared_list_id,
        last_activity_at,
        anime: anime_id (
          animeId: anime_id,
          animeMalId: mal_id,
          animeTitle: title,
          animeCover: cover_url,
          animeEpisodes: episodes,
          animeGenres: genres
        )
      `,
      )
      .eq("shared_list_id", listId)
      .order("last_activity_at", { ascending: false });

    if (error) {
      console.error(
        `Error in findAllAnimeByListId [${error.code}]: ${error.message}`,
      );
      throw error;
    }

    if (!data) return [];

    return data.map((row: any) => {
      const anime = row.anime;

      return {
        sharedListId: row.shared_list_id,
        lastActivityAt: row.last_activity_at,
        animeId: anime.animeId,
        animeMalId: anime.animeMalId,
        animeTitle: anime.animeTitle,
        animeCover: anime.animeCover,
        animeEpisodes: anime.animeEpisodes,
        animeGenres: anime.animeGenres,
      } as SharedListAnime & Anime;
    });
  },

  findAnimeProgress: async (
    listId: number,
    animeId: number,
  ): Promise<AnimeProgress[]> => {
    const { data, error } = await supabase
      .from("shared_list_progress")
      .select(
        `
        currentEpisode: current_episode,
        animeId: anime_id,
        updatedAt: updated_at,
        user: user_id!inner (
          username,
          avatar_url
        )
      `,
      )
      .eq("shared_list_id", listId)
      .eq("anime_id", animeId)
      .order("current_episode", { ascending: false });

    if (error) {
      console.error(
        `Error in findAnimeProgress [${error.code}]: ${error.message}`,
      );
      throw error;
    }

    if (!data) return [];

    return data.map((row: any) => {
      const user = row.user;

      return {
        username: user.username,
        avatarUrl: User.formatUserAvatar(user.username, user.avatar_url),
        currentEpisode: Number(row.currentEpisode),
        animeId: Number(row.animeId),
        updatedAt: row.updatedAt,
      } as AnimeProgress;
    });
  },

  findUserAnimeProgressByAnimeId: async (
    listId: number,
    userId: number,
    animeId: number,
  ): Promise<SharedListProgress | null> => {
    const { data, error } = await supabase
      .from("shared_list_anime")
      .select(
        `
        shared_list_id,
        anime_id,
        progress: shared_list_progress (
          user_id,
          current_episode,
          updated_at
        )
      `,
      )
      .eq("shared_list_id", listId)
      .eq("anime_id", animeId)
      .eq("shared_list_progress.user_id", userId)
      .maybeSingle();

    if (error) {
      console.error(
        `Error in findUserAnimeProgressByAnimeId [${error.code}]: ${error.message}`,
      );
      throw error;
    }

    if (!data) return null;

    const progress =
      data.progress && data.progress.length > 0 ? data.progress[0] : null;

    return {
      sharedListId: data.shared_list_id,
      animeId: data.anime_id,
      userId: progress ? progress.user_id : userId,
      currentEpisode: progress ? progress.current_episode : null,
      updatedAt: progress ? progress.updated_at : null,
    };
  },

  insertUserProgress: async (
    listId: number,
    userId: number,
    animeId: number,
    currentEpisode: number,
  ): Promise<SharedListProgress> => {
    const { data, error } = await supabase
      .from("shared_list_progress")
      .insert([
        {
          shared_list_id: listId,
          user_id: userId,
          anime_id: animeId,
          current_episode: currentEpisode,
        },
      ])
      .select(
        `
        sharedListId: shared_list_id,
        animeId: anime_id,
        userId: user_id,
        currentEpisode: current_episode,
        updatedAt: updated_at
      `,
      )
      .single();

    if (error) {
      console.error(
        `Error in insertUserProgress [${error.code}]: ${error.message}`,
      );
      throw error;
    }

    return data;
  },

  updateUserProgress: async (
    listId: number,
    userId: number,
    animeId: number,
    currentEpisode: number,
  ): Promise<void> => {
    const { error } = await supabase
      .from("shared_list_progress")
      .update({
        current_episode: currentEpisode,
        updated_at: new Date().toISOString(),
      })
      .eq("shared_list_id", listId)
      .eq("user_id", userId)
      .eq("anime_id", animeId);

    if (error) {
      console.error(
        `Error in updateUserProgress [${error.code}]: ${error.message}`,
      );
      throw error;
    }
  },

  // Aggiorna il timestamp dell'ultima attività per un anime all'interno di una lista
  updateAnimeLastActivity: async (
    listId: number,
    animeId: number,
  ): Promise<void> => {
    const { error } = await supabase
      .from("shared_list_anime")
      .update({
        last_activity_at: new Date().toISOString(),
      })
      .eq("shared_list_id", listId)
      .eq("anime_id", animeId);

    if (error) {
      console.error(
        `Error in updateAnimeLastActivity [${error.code}]: ${error.message}`,
      );
      throw error;
    }
  },

  getUserRole: async (
    listId: number,
    userId: number,
  ): Promise<{ role: SharedListRole } | null> => {
    const { data, error } = await supabase
      .from("shared_list_user")
      .select("role")
      .eq("shared_list_id", listId)
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error(`Error in getUserRole [${error.code}]: ${error.message}`);
      throw error;
    }

    if (!data) return null;

    return {
      role: data.role as SharedListRole,
    };
  },

  getLeader: async (
    listId: number,
  ): Promise<{ userId: number; username: string; avatar: string } | null> => {
    const client = await dbPool.connect();

    try {
      const query = `
        SELECT p.user_id as "userId", u.username as username, u.avatar_url as avatar
        FROM shared_list_progress p
        JOIN shared_list_user su ON p.user_id = su.user_id AND p.shared_list_id = su.shared_list_id
        JOIN "user" u ON p.user_id = u.user_id
        WHERE p.shared_list_id = $1
        GROUP BY p.user_id, u.username, u.avatar_url
        ORDER BY 
          SUM(p.current_episode) DESC,  
          MIN(p.updated_at) ASC        
        LIMIT 1;
      `;

      const result = await client.query(query, [listId]);

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      const avatarUrl = User.formatUserAvatar(row.username, row.avatar);

      return {
        userId: Number(row.userId),
        username: row.username,
        avatar: avatarUrl,
      };
    } catch (error) {
      console.error(`Error in getLeader:`, error);
      throw error;
    } finally {
      client.release();
    }
  },

  addSharedAnime: async (listId: number, animeId: number): Promise<void> => {
    const { error } = await supabase.from("shared_list_anime").insert([
      {
        shared_list_id: listId,
        anime_id: animeId,
      },
    ]);

    if (error) {
      console.error(
        `Error in addSharedAnime [${error.code}]: ${error.message}`,
      );
      throw error;
    }
  },

  deleteSharedAnime: async (listId: number, animeId: number): Promise<void> => {
    const { error } = await supabase
      .from("shared_list_anime")
      .delete()
      .eq("shared_list_id", listId)
      .eq("anime_id", animeId);

    if (error) {
      console.error(
        `Error in deleteSharedAnime [${error.code}]: ${error.message}`,
      );
      throw error;
    }
  },

  findAllWithAnimeId: async (
    animeId: number,
    userId: number,
  ): Promise<
    { sharedListId: number; sharedListName: string; animeId?: number }[]
  > => {
    const { data, error } = await supabase
      .from("shared_list_user")
      .select(
        `
        shared_list: shared_list_id (
          shared_list_id,
          name,
          shared_list_anime!left (
            anime_id
          )
        )
      `,
      )
      .eq("user_id", userId)
      .eq("shared_list.shared_list_anime.anime_id", animeId);

    if (error) {
      console.error(
        `Error in findAllWithAnimeId [${error.code}]: ${error.message}`,
      );
      throw error;
    }

    if (!data) return [];

    return data.map((row: any) => {
      const list = row.shared_list;

      const animeRelation =
        list.shared_list_anime && list.shared_list_anime.length > 0
          ? list.shared_list_anime[0]
          : null;

      return {
        sharedListId: list.shared_list_id,
        sharedListName: list.name,
        animeId: animeRelation ? animeRelation.anime_id : null,
      };
    });
  },

  insertUser: async (
    listId: number,
    userId: number,
    role: SharedListRole = "MEMBER",
  ): Promise<void> => {
    const { error } = await supabase.from("shared_list_user").insert([
      {
        shared_list_id: listId,
        user_id: userId,
        role: role,
      },
    ]);

    if (error) {
      console.error(`Error in insertUser [${error.code}]: ${error.message}`);
      throw error;
    }
  },

  checkIfInvitationPending: async (
    listId: number,
    invitedUserId: number,
  ): Promise<boolean> => {
    const { data, error } = await supabase
      .from("shared_list_invitation")
      .select("shared_list_id")
      .eq("shared_list_id", listId)
      .eq("invited_user_id", invitedUserId)
      .eq("status", "PENDING")
      .maybeSingle();

    if (error) {
      console.error(
        `Error in checkIfInvitationPending [${error.code}]: ${error.message}`,
      );
      throw error;
    }

    return data !== null;
  },

  insertUserInvitation: async (
    listId: number,
    senderUserId: number,
    invitedUserId: number,
  ): Promise<void> => {
    const { error } = await supabase.from("shared_list_invitation").insert([
      {
        shared_list_id: Number(listId),
        sender_user_id: senderUserId,
        invited_user_id: invitedUserId,
      },
    ]);

    if (error) {
      console.error(
        `Error in insertUserInvitation [${error.code}]: ${error.message}`,
      );
      throw error;
    }
  },

  updateUserInvitation: async (
    listId: number,
    status: SharedListInvitationStatus,
    invitedUserId: number,
  ): Promise<void> => {
    const { error } = await supabase
      .from("shared_list_invitation")
      .update({
        status: status,
      })
      .eq("shared_list_id", Number(listId))
      .eq("invited_user_id", invitedUserId);

    if (error) {
      console.error(
        `Error in updateUserInvitation [${error.code}]: ${error.message}`,
      );
      throw error;
    }
  },

  deleteUserInvitation: async (
    listId: number,
    invitedUserId: number,
    status: SharedListInvitationStatus,
  ): Promise<void> => {
    const { error } = await supabase
      .from("shared_list_invitation")
      .delete()
      .eq("shared_list_id", Number(listId))
      .eq("invited_user_id", invitedUserId)
      .eq("status", status);

    if (error) {
      console.error(
        `Error in deleteUserInvitation [${error.code}]: ${error.message}`,
      );
      throw error;
    }
  },

  updateNewOwner: async (listId: number, userId: number): Promise<void> => {
    const { data: oldestMember, error: fetchError } = await supabase
      .from("shared_list_user")
      .select("user_id")
      .eq("shared_list_id", listId)
      .neq("user_id", userId)
      .order("joined_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (fetchError) {
      console.error(
        `Error fetching oldest member [${fetchError.code}]: ${fetchError.message}`,
      );
      throw fetchError;
    }

    if (!oldestMember) return;

    const { error: updateError } = await supabase
      .from("shared_list_user")
      .update({ role: "OWNER" })
      .eq("shared_list_id", listId)
      .eq("user_id", oldestMember.user_id);

    if (updateError) {
      console.error(
        `Error updating new owner [${updateError.code}]: ${updateError.message}`,
      );
      throw updateError;
    }
  },

  deleteList: async (listId: number): Promise<void> => {
    const { error } = await supabase
      .from("shared_list")
      .delete()
      .eq("shared_list_id", listId);

    if (error) {
      console.error(`Error in deleteList [${error.code}]: ${error.message}`);
      throw error;
    }
  },

  deleteUser: async (listId: number, userId: number): Promise<void> => {
    const { error } = await supabase
      .from("shared_list_user")
      .delete()
      .eq("shared_list_id", listId)
      .eq("user_id", userId);

    if (error) {
      console.error(`Error in deleteUser [${error.code}]: ${error.message}`);
      throw error;
    }
  },

  findAllInvitedUsers: async (
    listId: number,
    status: SharedListInvitationStatus,
  ): Promise<InvitedUser[]> => {
    const { data, error } = await supabase
      .from("shared_list_invitation")
      .select(
        `
        user: invited_user_id!inner (
          user_id,
          username,
          avatar_url
        )
      `,
      )
      .eq("shared_list_id", listId)
      .eq("status", status)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(
        `Error in findAllInvitedUsers [${error.code}]: ${error.message}`,
      );
      throw error;
    }

    if (!data) return [];

    return data.map((row: any) => {
      const user = row.user;

      return {
        userId: Number(user.user_id),
        username: user.username,
        avatarUrl: User.formatUserAvatar(user.username, user.avatar_url),
      };
    });
  },

  findAllUserInvitations: async (
    userId: number,
    status: SharedListInvitationStatus,
  ): Promise<
    {
      sharedList: { sharedListId: number; sharedListName: string };
      senderInfo: {
        senderUserId: number;
        senderUsername: string;
        senderAvatar: string;
      };
    }[]
  > => {
    const { data, error } = await supabase
      .from("shared_list_invitation")
      .select(
        `
        shared_list_id,
        shared_list: shared_list_id!inner (
          shared_list_id,
          name
        ),
        sender: sender_user_id!inner (
          user_id,
          username,
          avatar_url
        )
      `,
      )
      .eq("invited_user_id", userId)
      .eq("status", status)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(
        `Error in findAllUserInvitations [${error.code}]: ${error.message}`,
      );
      throw error;
    }

    if (!data) return [];

    return data.map((row: any) => {
      const list = row.shared_list;
      const sender = row.sender;

      const avatarUrl = User.formatUserAvatar(
        sender.username,
        sender.avatar_url,
      );

      return {
        sharedList: {
          sharedListId: list.shared_list_id,
          sharedListName: list.name,
        },
        senderInfo: {
          senderUserId: Number(sender.user_id),
          senderUsername: sender.username,
          senderAvatar: avatarUrl,
        },
      };
    });
  },

  updateUserRole: async (
    listId: number,
    userId: number,
    role: SharedListRole,
  ): Promise<void> => {
    const { error } = await supabase
      .from("shared_list_user")
      .update({ role: role })
      .eq("shared_list_id", listId)
      .eq("user_id", userId)
      .neq("role", "OWNER");

    if (error) {
      console.error(
        `Error in updateUserRole [${error.code}]: ${error.message}`,
      );
      throw error;
    }
  },

  updateMessage: async (listId: number, message: string): Promise<void> => {
    const { error } = await supabase
      .from("shared_list")
      .update({ message: message })
      .eq("shared_list_id", listId);

    if (error) {
      console.error(`Error in updateMessage [${error.code}]: ${error.message}`);
      throw error;
    }
  },
};
