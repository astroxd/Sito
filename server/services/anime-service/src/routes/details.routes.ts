import { Router } from "express";
import { getAnimeDetails } from "../controllers/details.controller";

const router = Router();

router.get("/details/:id", getAnimeDetails);

export default router;
