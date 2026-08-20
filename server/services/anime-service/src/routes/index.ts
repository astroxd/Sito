import { Router } from "express";
import detailsRoutes from "./details.routes";

const router = Router();

router.use("/anime/details", detailsRoutes);

export default router;
