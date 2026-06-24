import { Router } from "express";
import authRoutes from "./auth.routes";
import sharedListsRoutes from "./sharedLists.routes";
import listsRoutes from "./lists.routes";
import friendshipRoutes from "./friendship.routes";
import { requireAuth } from "../middlewares/auth.middleware";

const router = Router();

router.use("/", authRoutes);

router.use(requireAuth);
router.use("/", sharedListsRoutes);
router.use("/", listsRoutes);
router.use("/", friendshipRoutes);

export default router;
