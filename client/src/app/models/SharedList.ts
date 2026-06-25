export interface SharedList {
  id: number;
  name: string;
  message?: string;
  userId: number;
  role: number;

  members: SharedListMember[];
}

export interface SharedListMember {
  id: number;
  username: string;
  avatar: string;
  role: number;
  totalEpisodes: number;
  length: number;
}

export interface SharedListInfo {
  sharedList: SharedList;
  sharedListMembersNumber: number;
  members: SharedListMember[];
}

export interface SharedListResApi {
  data: {
    sharedList: SharedList;
    members: SharedListMember[];
  }[];
}

export interface SharedListUserProgress {
  sharedListId: number;
  userId: number;
  currentEpisode: number;
  updatedAt: string;

  animeId: number;
  animeMalId: number;
  animeTitle: string;
  animeCover: string;
  animeEpisodes: number;
  animeAvgEpisodeDuration?: number;
}

export interface SharedListUserProgressResApi {
  data: SharedListUserProgress[];
}

export interface SharedListAnimeProgress {
  anime: {
    sharedListId: number;
    animeId: number;
    addedOn?: string;
    lastActivityAt?: string;

    animeMalId: number;
    animeTitle: string;
    animeCover: string;
    animeEpisodes: number;
    animeAvgEpisodeDuration?: number;
  };
  progress: {
    username: string;
    avatar: string;
    currentEpisode: number;
    animeId: number;
    updatedAt: string;
  }[];
}

export interface SharedListAnimeProgressResApi {
  data: SharedListAnimeProgress[];
}

export interface SharedListInvitation {
  sharedList: {
    sharedListId: number;
    sharedListName: string;
    senderUserId: number;
    senderUsername: string;
    senderAvatar: string;
  };

  members: SharedListMember[];
}

export interface SharedListInvitationResApi {
  data: SharedListInvitation[];
}
