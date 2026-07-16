import { dbPool, supabase } from "../config/supabaseClient";
import { User } from "./user.model";

export type FriendshipRequestStatus = "PENDING" | "ACCEPTED";

export interface Friendship {
  userId1: number;
  userId2: number;
  status: FriendshipRequestStatus;
  senderUserId: number;
}

export interface FriendUser {
  friendUserId: number;
  friendUsername: string;
  friendAvatarUrl: string;
  count?: number;
}

export interface FriendshipInfo extends FriendUser {
  senderUserId: number;
  status: FriendshipRequestStatus;
}

export interface FriendsResponse {
  accepted: FriendUser[];
  pending: (FriendUser & { isIncoming: boolean })[];
}

export const Friendship = {
  findAllFriendship: async (userId: number): Promise<FriendshipInfo[]> => {
    const client = await dbPool.connect();

    try {
      const query = `
        SELECT 
          f.sender_user_id as "senderUserId", 
          f.status, 
          u.user_id as "friendUserId", 
          u.username as "friendUsername", 
          u.avatar_url as "friendAvatarUrl"
        FROM friendship f
        JOIN "user" u ON (u.user_id = f.user_id_1 OR u.user_id = f.user_id_2) AND u.user_id != $1
        WHERE f.user_id_1 = $1 OR f.user_id_2 = $1
      `;

      const result = await client.query(query, [userId]);

      return result.rows.map((row: any) => {
        const avatarUrl = User.formatUserAvatar(
          row.friendUsername,
          row.friendAvatarUrl,
        );

        return {
          senderUserId: Number(row.senderUserId),
          status: row.status as FriendshipRequestStatus,
          friendUserId: Number(row.friendUserId),
          friendUsername: row.friendUsername,
          friendAvatarUrl: avatarUrl,
        };
      });
    } catch (error) {
      console.error(`Error in findAllFriendship:`, error);
      throw error;
    } finally {
      client.release();
    }
  },

  findFriendshipByName: async (
    userId: number,
    status: FriendshipRequestStatus,
    name: string,
    perPage: number,
    offset = 0,
  ): Promise<{ items: FriendUser[]; totalCount: number }> => {
    const client = await dbPool.connect();

    try {
      const dataQuery = `
        SELECT 
          u.user_id as "friendUserId", 
          u.username as "friendUsername", 
          u.avatar_url as "friendAvatarUrl"
        FROM friendship f
        JOIN "user" u ON (u.user_id = f.user_id_1 OR u.user_id = f.user_id_2) AND u.user_id != $1
        WHERE (f.user_id_1 = $1 OR f.user_id_2 = $1) 
          AND f.status = $2
          AND u.username ILIKE $3
        LIMIT $4 OFFSET $5
      `;

      const countQuery = `
        SELECT COUNT(*) as "count"
        FROM friendship f
        JOIN "user" u ON (u.user_id = f.user_id_1 OR u.user_id = f.user_id_2) AND u.user_id != $1
        WHERE (f.user_id_1 = $1 OR f.user_id_2 = $1) 
          AND f.status = $2
          AND u.username ILIKE $3
      `;

      const queryPattern = `${name}%`;

      const [dataResult, countResult] = await Promise.all([
        client.query(dataQuery, [
          userId,
          status,
          queryPattern,
          perPage,
          offset,
        ]),
        client.query(countQuery, [userId, status, queryPattern]),
      ]);

      const items: FriendUser[] = dataResult.rows.map((row: any) => {
        const avatarUrl = User.formatUserAvatar(
          row.friendUsername,
          row.friendAvatarUrl,
        );

        return {
          friendUserId: Number(row.friendUserId),
          friendUsername: row.friendUsername,
          friendAvatarUrl: avatarUrl,
        };
      });

      const totalCount = Number(countResult.rows[0]?.count || 0);

      return {
        items,
        totalCount,
      };
    } catch (error) {
      console.error(`Error in findFriendshipByName:`, error);
      throw error;
    } finally {
      client.release();
    }
  },

  findFriendshipByUsers: async (
    userId1: number,
    userId2: number,
  ): Promise<Friendship | null> => {
    const { data, error } = await supabase
      .from("friendship")
      .select(
        `
        userId1: user_id_1,
        userId2: user_id_2,
        status,
        senderUserId: sender_user_id
      `,
      )
      .eq("user_id_1", userId1)
      .eq("user_id_2", userId2)
      .maybeSingle();

    if (error) {
      console.error(
        `Error in findFriendshipByUsers [${error.code}]: ${error.message}`,
      );
      throw error;
    }

    return data;
  },

  addFriend: async (
    userId1: number,
    userId2: number,
    status: FriendshipRequestStatus,
    senderUserId: number,
  ): Promise<void> => {
    const { error } = await supabase.from("friendship").insert([
      {
        user_id_1: userId1,
        user_id_2: userId2,
        status: status,
        sender_user_id: senderUserId,
      },
    ]);

    if (error) {
      console.error(`Error in addFriend [${error.code}]: ${error.message}`);
      throw error;
    }
  },

  updateFriend: async (
    userId1: number,
    userId2: number,
    status: FriendshipRequestStatus,
  ): Promise<void> => {
    const { error } = await supabase
      .from("friendship")
      .update({ status: status })
      .eq("user_id_1", userId1)
      .eq("user_id_2", userId2)
      .eq("status", "PENDING");

    if (error) {
      console.error(`Error in updateFriend [${error.code}]: ${error.message}`);
      throw error;
    }
  },

  deleteFriend: async (
    userId1: number,
    userId2: number,
    status: FriendshipRequestStatus,
  ): Promise<void> => {
    const { error } = await supabase
      .from("friendship")
      .delete()
      .eq("user_id_1", userId1)
      .eq("user_id_2", userId2)
      .eq("status", status);

    if (error) {
      console.error(`Error in deleteFriend [${error.code}]: ${error.message}`);
      throw error;
    }
  },
};
