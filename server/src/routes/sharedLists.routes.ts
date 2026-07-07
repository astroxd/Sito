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
  addMemberRequest,
  acceptSharedListRequest,
  declineSharedListRequest,
  getPendingMembers,
  getInvites,
  cancelSharedListRequest,
  removeMember,
  updateMemberRole,
  updateSharedListMessage,
  removeSharedAnime,
} from "../controllers/sharedLists.controller";
import { checkSharedListAccess } from "../middlewares/sharedList.middleware";

const router = Router();

//* PUBLIC ROUTES

router.get("/shared-lists", getSharedLists);
router.post("/shared-list", createSharedList);

//* Ritorna tutte le liste condivise dell'utente
//* se l'anime è presente il campo "animeId" !== null
//* se l'anime non è presente il campo "animeId" === null
router.get("/shared-list/entrie/:animeId", getAllSharedListsWithAnimeId);

//* Accetta l'invito alla lista
router.post("/shared-list/:listId/accept", acceptSharedListRequest);

//* Rifiuta l'invito alla lista
router.delete("/shared-list/:listId/decline", declineSharedListRequest);

//* Ottiene la lista degli inviti
router.get("/shared-lists/invite", getInvites);

//* ----------------------------------------------

//* PRIVATE ROUTES

router.use("/shared-list/:listId", checkSharedListAccess);

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
//* Rimuovi anime da lista condivisa
router.delete("/shared-list/:listId/entrie/:animeId", removeSharedAnime);

//* Inviti e gestione dei Membri
router.post("/shared-list/:listId/member", addMemberRequest);
router.delete("/shared-list/:listId/cancel/:userId", cancelSharedListRequest);
router.delete("/shared-list/:listId/remove/:userId", removeMember);
router.get("/shared-list/:listId/pending", getPendingMembers);
router.patch("/shared-list/:listId/member/:userId/role", updateMemberRole);
//*//////////////////////////

//* Cambia il messaggio della lista
router.patch("/shared-list/:listId/message", updateSharedListMessage);
export default router;
