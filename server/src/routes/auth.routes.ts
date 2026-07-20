import { Router } from "express";
import {
  login,
  logout,
  refreshToken,
  register,
  session,
  updateAvatar,
  updateAvatarConfirm,
} from "../controllers/auth.controller";
import { requireAuth } from "../middlewares/auth.middleware";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/refresh-token", refreshToken);

router.use(requireAuth);

router.get("/session", session);
router.post("/logout", logout);
router.get("/update-avatar", updateAvatar);
router.patch("/update-avatar/confirm", updateAvatarConfirm);

export default router;
