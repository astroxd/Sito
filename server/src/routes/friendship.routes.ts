import { Router } from "express";

import {
  acceptFriendRequest,
  addFriendRequest,
  deleteFriendRequest,
  getFriendsAndRequests,
  searchFriends,
  searchUsers,
} from "../controllers/friendship.controller";

const router = Router();

router.get("/friends", getFriendsAndRequests);
router.get("/friends/my/search", searchFriends);
router.get("/friends/search", searchUsers);
router.post("/friends/request", addFriendRequest);
router.post("/friends/accept", acceptFriendRequest);
router.delete("/friends/decline/:senderUserId", deleteFriendRequest);

export default router;
