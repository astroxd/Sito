import { Router } from "express";
import {
  login,
  logout,
  refreshToken,
  register,
  session,
} from "../controllers/auth.controller";
import {
  createRateLimit,
  loginLimiter,
} from "../middlewares/rate-limiters.middleware";

const router = Router();

router.post("/register", createRateLimit({}, "auth-register"), register);
router.post("/login", loginLimiter, login);
router.get("/refresh-token", refreshToken);

// router.use(requireAuth);

router.get("/session", session);
router.post("/logout", logout);

export default router;
