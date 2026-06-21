import { Router } from "express";
import {
  createSharedList,
  getSharedLists,
  getSharedList,
  getSharedUserProgress,
  getSharedAnimesProgress,
  updateSharedUserProgress,
  addSharedAnime,
  getAllSharedListsWithAnimeId,
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

//* Aggiungi anime a lista condivisa
router.post("/shared-list/:listId/entrie", addSharedAnime);

//* Ritorna tutte le liste condivise dell'utente
//* se l'anime è presente il campo "animeId" !== null
//* se l'anime non è presente il campo "animeId" === null
router.get("/shared-list/entrie/:animeId", getAllSharedListsWithAnimeId);

export default router;
