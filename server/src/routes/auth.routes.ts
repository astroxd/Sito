import { Router } from "express";
import {
  login,
  logout,
  refreshToken,
  register,
  session,
} from "../controllers/auth.controller";
import { uploadAvatarMiddleware } from "../middlewares/upload.middleware";
import { requireAuth } from "../middlewares/auth.middleware";

const router = Router();

router.post("/register", uploadAvatarMiddleware, register);
router.post("/login", login);
router.get("/refresh-token", refreshToken);

router.use(requireAuth);

router.get("/session", session);
router.post("/logout", logout);

export default router;
