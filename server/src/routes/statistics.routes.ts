import { Router } from "express";
import { getUserStats } from "../controllers/statistics.controller";
import { getUserBadges } from "../controllers/badge.controller";

const router = Router();

router.get("/my-stats", getUserStats);
router.get("/my-badges", getUserBadges);

export default router;
