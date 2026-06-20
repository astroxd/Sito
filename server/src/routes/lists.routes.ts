import { Router } from "express";
import {
  getList,
  searchInList,
  getAnimeInList,
  addAnimeToList,
  updateAnimeList,
  deleteAnimeFromList,
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

export default router;
