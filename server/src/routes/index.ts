import { Router } from "express";
import authRoutes from "./auth.routes";
import sharedListsRoutes from "./sharedLists.routes";
import listsRoutes from "./lists.routes";
import friendshipRoutes from "./friendship.routes";
import { requireAuth } from "../middlewares/auth.middleware";
import statisticsRoutes from "./statistics.routes";

import { getAnimeDetails, syncAnime } from "../controllers/lists.controller";

const router = Router();

router.use("/", authRoutes);

router.use(requireAuth);

router.use("/", sharedListsRoutes);

router.use("/", listsRoutes);

router.use("/", friendshipRoutes);

router.use("/", statisticsRoutes);

//TODO move in anime-service
router.post("/anime/sync", syncAnime);
router.get("/anime/details/:id", getAnimeDetails);

export default router;
