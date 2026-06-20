import { Router } from "express";
import authRoutes from "./auth.routes";
import sharedListsRoutes from "./sharedLists.routes";
import listsRoutes from "./lists.routes";
import { requireAuth } from "../middlewares/auth.middleware";

const router = Router();

router.use("/", authRoutes);

router.use(requireAuth);
router.use("/", sharedListsRoutes);
router.use("/", listsRoutes);

export default router;
