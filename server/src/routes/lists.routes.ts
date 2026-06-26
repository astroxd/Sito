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

//TODO Aggiungo un middleware che controlla se lo status è valido?

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
router.delete("/list/entrie/:animeId", deleteAnimeFromList);

//* Ottiene il progresso dell'utente in tutti gli anime con lo status specificato
router.get("/list/:status/progress", getUserAnimesProgress);

//* Aggiorna il progresso in un anime (+1)
router.post("/list/:status/progress/entry/:animeId", updateUserProgress);

//* Aggiorno le puntate viste in bulk (animeDetails page)
router.post("/anime/episodes/watch", updateLastWatchedEpisode);
//* Ottengo le info dell'anime e l'ultima puntata vista
router.get("/anime/episodes/:animeId", getLastWatchedEpisode);

export default router;
