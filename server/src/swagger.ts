import swaggerAutogen from "swagger-autogen";

const doc = {
  info: {
    title: "My API",
    description: "Anime & Lists Management API Documentation",
  },
  host: "localhost:3001",

  securityDefinitions: {
    bearerAuth: {
      type: "apiKey",
      in: "header",
      name: "Authorization",
      description: "Enter your token in the format: Bearer <your_jwt>",
    },
  },
  // All Models (Both Request Bodies and Responses)
  definitions: {
    // --- Request Bodies ---
    RegisterBody: {
      email: "user@example.com",
      username: "john_doe",
      password: "securePassword123",
    },
    LoginBody: {
      email: "user@example.com",
      password: "securePassword123",
    },

    // --- Responses ---
    UserObject: {
      id: 1,
      email: "user@example.com",
      username: "john_doe",
      avatar: "http://localhost:3001/static/avatar/default.png",
    },
    AuthResponse: {
      user: { $ref: "#/definitions/UserObject" },
      accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      message: "User registered successfully",
    },
    AvatarUpdateResponse: {
      data: {
        id: 1,
        avatar: "http://localhost:3001/static/avatar/new_avatar.png",
      },
      message: "Avatar updated successfully",
    },
    ErrorResponse: {
      message: "Error description text",
    },
    // --- Shared Lists Requests ---
    CreateSharedListBody: {
      name: "My Anime Squad List",
    },
    AddSharedAnimeBody: {
      animeDetails: {
        id: 21,
        animeTitle: "One Piece",
        animeEpisodes: 1080,
        animeGenres: "Action, Adventure, Fantasy",
        animeAvgEpisodeDuration: 24,
      },
    },
    InviteMemberBody: {
      memberId: 5,
    },
    UpdateRoleBody: {
      newRole: "EDITOR", // "EDITOR" | "MEMBER"
    },
    UpdateMessageBody: {
      message: "Check out the new episodes added today!",
    },

    // ==========================================
    // RISPOSTE (RESPONSES) - SHARED LISTS
    // ==========================================
    SharedListObject: {
      id: 10,
      name: "My Anime Squad List",
      message: "Welcome to our shared tracking list!",
    },
    SharedMemberObject: {
      id: 1,
      username: "john_doe",
      avatar: "avatar_file.png",
      role: "OWNER", // "OWNER" | "EDITOR" | "MEMBER"
      totalEpisodes: 120,
      length: 5,
    },
    AnimeProgressObject: {
      username: "john_doe",
      avatar: "avatar_file.png",
      currentEpisode: 12,
      animeId: 21,
      updatedAt: "2026-07-01T15:30:00.000Z",
    },
    CatalogAnimeObject: {
      sharedListId: 10,
      animeId: 21,
      addedOn: "2026-03-31T10:00:00.000Z",
      lastActivityAt: "2026-07-01T01:20:00.000Z",
      id: 21,
      animeTitle: "One Piece",
      animeEpisodes: 1080,
      animeGenres: ["Action", "Adventure", "Fantasy"],
      animeAvgEpisodeDuration: 24,
    },
    InvitedUserObject: {
      userId: 5,
      username: "jane_doe",
      avatar: "avatar_jane.png",
    },

    // --- Complex Response Schemas ---
    SharedListsResponse: {
      data: [
        {
          sharedList: { $ref: "#/definitions/SharedListObject" },
          members: [{ $ref: "#/definitions/SharedMemberObject" }],
          sharedListMembersNumber: 1,
        },
      ],
    },
    SingleSharedListResponse: {
      data: {
        sharedList: { $ref: "#/definitions/SharedListObject" },
        members: [{ $ref: "#/definitions/SharedMemberObject" }],
        sharedListMembersNumber: 1,
      },
    },
    UserProgressResponse: {
      data: [{ $ref: "#/definitions/AnimeProgressObject" }],
    },
    SharedAnimesProgressResponse: {
      data: [
        {
          anime: { $ref: "#/definitions/CatalogAnimeObject" },
          progress: [{ $ref: "#/definitions/AnimeProgressObject" }],
        },
      ],
    },
    PendingMembersResponse: {
      data: [{ $ref: "#/definitions/InvitedUserObject" }],
    },
    SharedListsWithAnimeResponse: {
      data: [
        {
          id: 10,
          name: "My Anime Squad List",
          message: "Welcome to our shared tracking list!",
          animeId: 21, // Will be null if the anime is not present in the shared list
        },
      ],
    },
    InvitesListResponse: {
      data: [
        {
          sharedList: {
            sharedListId: 10,
            sharedListName: "My Anime Squad List",
          },
          members: [{ $ref: "#/definitions/SharedMemberObject" }],
          sharedListMembersNumber: 1,
          senderInfo: {
            senderUserId: 1,
            senderUsername: "john_doe",
            senderAvatar: "avatar_file.png",
          },
        },
      ],
    },
    // ==========================================
    // DATA MODELS (INTERFACES & ENUMS)
    // ==========================================
    PrivateAnime: {
      userId: 1,
      animeId: 21,
      status: "WATCHING", // "WATCHING" | "COMPLETED" | "DROPPED"
      addedOn: "2026-07-01T12:00:00.000Z",
      updatedAt: "2026-07-01T12:00:00.000Z",
    },
    ListedAnime: {
      userId: 1,
      animeId: 21,
      status: "WATCHING",
      addedOn: "2026-07-01T12:00:00.000Z",
      updatedAt: "2026-07-01T12:00:00.000Z",
      animeMalId: 21,
      animeTitle: "One Piece",
      animeCover: "https://example.com/cover.jpg",
      animeEpisodes: 1080,
      lastEpisodeWatched: 15,
      length: 1, // Total items counter from SQL query window function if applicable
    },

    // ==========================================
    // PRIVATE LISTS REQUEST BODIES
    // ==========================================
    AddAnimePrivateBody: {
      status: "WATCHING",
      anime: {
        id: 21,
        idMal: 12345,
        title: "One Piece",
        coverImage: "https://example.com/cover.jpg",
        episodes: 1080,
        duration: 24,
        genres: ["Action", "Adventure", "Fantasy"],
      },
    },
    UpdateAnimeListBody: {
      animeId: 21,
      status: "COMPLETED",
    },
    BulkWatchBody: {
      animeId: 21,
      episodeTarget: 15,
    },
    SyncAnimeBody: {
      anime: {
        id: 21,
        idMal: 12345,
        title: "One Piece",
        coverImage: "https://example.com/cover.jpg",
        episodes: 1080,
        duration: 24,
        genres: ["Action", "Adventure", "Fantasy"],
      },
    },

    // ==========================================
    // PRIVATE LISTS RESPONSES
    // ==========================================
    PaginatedPrivateListResponse: {
      data: [{ $ref: "#/definitions/ListedAnime" }],
      page: 1,
      perPage: 6,
      hasNextPage: true,
    },
    SinglePrivateAnimeResponse: {
      data: { $ref: "#/definitions/PrivateAnime" },
    },
    PrivateProgressObject: {
      animeId: 21,
      animeTitle: "One Piece",
      currentEpisode: 14,
      totalEpisodes: 1080,
      status: "WATCHING",
      lastWatchedAt: "2026-07-01T12:00:00.000Z",
    },
    UserAnimesProgressResponse: {
      data: [{ $ref: "#/definitions/PrivateProgressObject" }],
    },
    UpdateProgressSuccessResponse: {
      message: "Private progress updated successfully",
      currentEpisode: 15,
    },
    LastWatchedEpisodeResponse: {
      data: {
        lastEpisodeWatched: 14,
        animeInfo: { $ref: "#/definitions/PrivateAnime" },
      },
    },
    // ==========================================
    // FRIENDS DATA MODELS (REAL INTERFACES)
    // ==========================================
    Friendship: {
      userId1: 1,
      userId2: 42,
      status: "PENDING", // "PENDING" | "ACCEPTED"
      senderUserId: 1,
    },
    FriendUser: {
      friendUserId: 42,
      friendUsername: "MonkeyDLuffy",
      friendAvatar: "https://example.com/avatar.jpg",
      count: 12, // Optional property used for query pagination counters
    },
    FriendshipInfo: {
      friendUserId: 42,
      friendUsername: "MonkeyDLuffy",
      friendAvatar: "https://example.com/avatar.jpg",
      count: 12,
      senderUserId: 1,
      status: "PENDING", // "PENDING" | "ACCEPTED"
    },
    FriendsResponse: {
      accepted: [{ $ref: "#/definitions/FriendUser" }],
      pending: [
        {
          friendUserId: 42,
          friendUsername: "RoronoaZoro",
          friendAvatar: "https://example.com/zoro.jpg",
          count: 12,
          isIncoming: true,
        },
      ],
    },
    SearchFriendsResponse: {
      data: [{ $ref: "#/definitions/FriendUser" }],
    },
    GlobalSearchUsersResponse: {
      data: [{ $ref: "#/definitions/FriendUser" }],
      page: 1,
      perPage: 12,
      hasNextPage: false,
    },
    // ==========================================
    // USER STATISTICS SCHEMAS
    // ==========================================
    UserTotalWatchTime: {
      rawMinutes: 25400,
      days: 17,
      hours: 15,
      minutes: 20,
      formattedString: "17d 15h 20m",
    },
    UserDailyHistory: {
      currentWeek: [120, 60, 0, 45, 90, 0, 0],
      previousWeek: [30, 0, 45, 120, 0, 60, 15],
    },
    UserGenreStat: {
      genre: "Action",
      count: 14,
    },
    UserStatsResponse: {
      totalWatchTime: { $ref: "#/definitions/UserTotalWatchTime" },
      dailyHistory: { $ref: "#/definitions/UserDailyHistory" },
      genres: [{ $ref: "#/definitions/UserGenreStat" }],
    },

    // ==========================================
    // USER BADGES SCHEMAS
    // ==========================================
    CatalogBadgeItem: {
      id: "shonen_master",
      title: "Re dello Shonen",
      description: "Completa anime pieni di azione e adrenalina",
      image: "shonen_master.png",
      category: "GENRE", // "GENRE" | "TIME" | "SPECIAL"
      isSecret: false,
      unlocked: true,
      highestRankUnlocked: "SILVER", // "BRONZE" | "SILVER" | "GOLD" | "PLATINUM" | "SECRET" or null
      nextRank: "GOLD", // Next available rank or null
      nextRankThreshold: 30, // Threshold value or null
      currentValue: 18,
      progressPercentage: 60.0,
      unlockedAt: "2026-06-25T14:30:00.000Z", // Timestamp or null
      imageUrl: "http://localhost:3000/static/badges/shonen_master.png",
    },
    UserBadgesResponse: {
      data: [{ $ref: "#/definitions/CatalogBadgeItem" }],
    },
  },
};

const outputFile = "./swagger-output.json";
const routes = ["./src/routes/index.ts"];

/* NOTE: If you are using the express Router, you must pass in the 'routes' only the 
root file where the route starts, such as index.js, app.js, routes.js, etc ... */

swaggerAutogen()(outputFile, routes, doc);
