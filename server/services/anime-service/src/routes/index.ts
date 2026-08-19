import { Router } from "express";
import detailsRoutes from "./details.routes";

const router = Router();

// router.get("/anime/:id", (req, res) => {
//   console.log("Req");
// });

router.use("/anime", detailsRoutes);

export default router;
