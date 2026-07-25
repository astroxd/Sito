import { Router } from "express";
import {
  updateAvatar,
  updateAvatarConfirm,
} from "../controllers/auth.controller";
const router = Router();

// router.use(requireAuth);

router.get("/update-avatar", updateAvatar);
router.patch("/update-avatar/confirm", updateAvatarConfirm);

export default router;
