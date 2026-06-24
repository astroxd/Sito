export interface FriendUser {
  friendUserId: number;
  friendUsername: string;
  friendAvatar: string;
}

export type FriendshipRequestStatus = 'PENDING' | 'ACCEPTED';
export type PendingFriendUser = FriendUser & { isIncoming: boolean };

export interface FriendsResponse {
  data: {
    accepted: FriendUser[];
    pending: PendingFriendUser[];
  };
}

export interface FoundUser {
  userId: number;
  username: string;
  avatar: string;
}

export interface FoundUsersApiRes {
  data: FoundUser[];
  page: number;
  perPage: number;
  hasNextPage: boolean;
}
