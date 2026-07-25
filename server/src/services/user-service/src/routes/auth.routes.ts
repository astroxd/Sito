import { Router } from "express";
import {
  login,
  logout,
  refreshToken,
  register,
  session,
} from "../controllers/auth.controller";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/refresh-token", refreshToken);

// router.use(requireAuth);

router.get("/session", session);
router.post("/logout", logout);

export default router;
