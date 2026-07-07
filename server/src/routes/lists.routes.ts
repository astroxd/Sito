import { Router } from "express";
import {
  getList,
  searchInList,
  getAnimeInList,
  addAnimeToList,
  updateAnimeList,
  deleteAnimeFromList,
  getUserAnimesProgress,
  updateUserProgress,
  updateLastWatchedEpisode,
  getLastWatchedEpisode,
} from "../controllers/lists.controller";

const router = Router();

//* Ottiene gli anime di una lista privata
router.get("/lists/:status/:page", getList);

//* Cerca gli anime dentro una lista privata (query params: q=&page=)
router.get("/lists/:status", searchInList);

//* Controlla se l'anime è nella lista privata
router.get("/list/entrie/:animeId", getAnimeInList);

//* Inserisce un anime in una lista privata
router.post("/list/entrie", addAnimeToList);

//* Cambia la lita privata di un anime
router.patch("/list/entrie", updateAnimeList);

//* Rimuove un anime dalla lista privata
router.delete("/list/entrie/:animeId", (req, res) => {
  /* #swagger.tags = ['Private Lists']
     #swagger.description = 'Remove an anime entirely from the user\'s private list.'
     #swagger.security = [{ "bearerAuth": [] }]
     #swagger.parameters['animeId'] = { in: 'path', type: 'integer', required: true, description: 'ID of the anime to delete' }
     #swagger.responses[200] = { description: 'Anime deleted successfully', schema: { message: "Deleted Anime from list successfully" } }
     #swagger.responses[500] = { schema: { $ref: '#/definitions/ErrorResponse' } }
  */
  deleteAnimeFromList(req, res);
});

//* Ottiene il progresso dell'utente in tutti gli anime con lo status specificato
router.get("/list/:status/progress", (req, res) => {
  /* #swagger.tags = ['Private Lists']
     #swagger.description = 'Retrieve the comprehensive playback and episode tracking progress for all anime in a specified tracking status.'
     #swagger.security = [{ "bearerAuth": [] }]
     #swagger.parameters['status'] = { in: 'path', type: 'string', required: true, description: 'Anime tracking status filter', enum: ['WATCHING', 'COMPLETED', 'DROPPED'] }
     #swagger.responses[200] = { schema: { $ref: '#/definitions/UserAnimesProgressResponse' } }
     #swagger.responses[400] = { schema: { $ref: '#/definitions/ErrorResponse' } }
     #swagger.responses[500] = { schema: { $ref: '#/definitions/ErrorResponse' } }
  */
  getUserAnimesProgress(req, res);
});

//* Aggiorna il progresso in un anime (+1)
router.post("/list/:status/progress/entry/:animeId", (req, res) => {
  /* #swagger.tags = ['Private Lists']
     #swagger.description = 'Increment the watched episode counter by 1 for a specific anime in the user list.'
     #swagger.security = [{ "bearerAuth": [] }]
     #swagger.parameters['status'] = { in: 'path', type: 'string', required: true }
     #swagger.parameters['animeId'] = { in: 'path', type: 'integer', required: true }
     #swagger.responses[200] = { schema: { $ref: '#/definitions/UpdateProgressSuccessResponse' } }
     #swagger.responses[500] = { schema: { $ref: '#/definitions/ErrorResponse' } }
  */
  updateUserProgress(req, res);
});

//* Aggiorno le puntate viste in bulk (animeDetails page)
router.post("/anime/episodes/watch", (req, res) => {
  /* #swagger.tags = ['Private Lists']
     #swagger.description = 'Bulk update the last watched episode checkpoint for a specific anime.'
     #swagger.security = [{ "bearerAuth": [] }]
     #swagger.parameters['body'] = { in: 'body', required: true, schema: { $ref: '#/definitions/BulkWatchBody' } }
     #swagger.responses[200] = { schema: { message: "Success", currentEpisode: 15 } }
     #swagger.responses[500] = { schema: { $ref: '#/definitions/ErrorResponse' } }
  */
  updateLastWatchedEpisode(req, res);
});

//* Ottengo le info dell'anime e l'ultima puntata vista
router.get("/anime/episodes/:animeId", (req, res) => {
  /* #swagger.tags = ['Private Lists']
     #swagger.description = 'Retrieve metadata and the last watched episode indicator for a specific anime.'
     #swagger.security = [{ "bearerAuth": [] }]
     #swagger.parameters['animeId'] = { in: 'path', type: 'integer', required: true }
     #swagger.responses[200] = { schema: { $ref: '#/definitions/LastWatchedEpisodeResponse' } }
     #swagger.responses[500] = { schema: { $ref: '#/definitions/ErrorResponse' } }
  */
  getLastWatchedEpisode(req, res);
});

export default router;
