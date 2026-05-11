export interface SharedList {
  id: number;
  name: string;
  message?: string;
  userId: number;
  role: number;
}

export interface SharedListInfo {
  sharedList: SharedList;
  sharedListMembersNumber: number;
  members: [
    {
      userId: number;
      username: string;
      avatar: string;
      role: number;
      totalEpisodes: number;
    },
  ];
}

export interface SharedListResApi {
  data: [
    {
      sharedList: {
        shared_list_id: number;
        shared_list_name: string;
        message?: string;
        user_id: number;
        role: number;
      };
      members: [
        {
          user_id: number;
          username: string;
          avatar: string;
          role: number;
          total_episodes: number;
          length: number;
        },
      ];
    },
  ];
}
