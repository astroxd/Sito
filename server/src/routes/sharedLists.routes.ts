import { Router } from "express";
import {
  createSharedList,
  getSharedLists,
  getSharedList,
  getSharedUserProgress,
  getSharedAnimesProgress,
  updateSharedUserProgress,
} from "../controllers/sharedLists.controller";

const router = Router();

router.get("/shared-lists", getSharedLists);
router.post("/shared-list", createSharedList);

//* Informazioni lista specifica, chiamata quando carica shared-list.page
router.get("/shared-list/:listId", getSharedList);

//* Ottiene i progressi per ogni anime del singolo utente della lista
router.get("/shared-list/:listId/animes", getSharedUserProgress);

//* Ottiene i progressi per ogni anime per ogni utente della lista
router.get("/shared-list/:listId/animes/all", getSharedAnimesProgress);

//* Aggiorna i progressi di un anime visto dentro una shared-list
router.post(
  "/shared-list/:listId/progress/entrie/:animeId",
  updateSharedUserProgress,
);

export default router;
