import { Router } from "express";
import {
  getAnimeCharacters,
  getAnimeDetails,
  getAnimeEpisodes,
  getAnimeRecommendations,
} from "#controllers/details.controller";

const router = Router();

router.get("/:id", getAnimeDetails);
router.get("/:id/recommendations", getAnimeRecommendations);
router.get("/:id/characters/:page", getAnimeCharacters);
router.get("/:MALanimeId/episodes/:page", getAnimeEpisodes);

export default router;
