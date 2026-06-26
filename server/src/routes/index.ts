import { Router } from "express";
import authRoutes from "./auth.routes";
import sharedListsRoutes from "./sharedLists.routes";
import listsRoutes from "./lists.routes";
import friendshipRoutes from "./friendship.routes";
import { requireAuth } from "../middlewares/auth.middleware";
import {
  getLastWatchedEpisode,
  syncAnime,
  updateLastWatchedEpisode,
} from "../controllers/lists.controller";
import { getUserStats } from "../controllers/statistics.controller";

const router = Router();

router.use("/", authRoutes);

router.use(requireAuth);
router.use("/", sharedListsRoutes);
router.use("/", listsRoutes);
router.use("/", friendshipRoutes);

router.post("/anime/sync", syncAnime);
router.post("/anime/episodes/watch", updateLastWatchedEpisode);
router.get("/anime/episodes/:animeId", getLastWatchedEpisode);

router.get("/my-stats", getUserStats);

export default router;
