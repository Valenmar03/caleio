import { Router } from "express";
import {
  registerHandler,
  verifyEmailHandler,
  forgotPasswordHandler,
  resetPasswordHandler,
  loginHandler,
  refreshHandler,
  logoutHandler,
  getBusinessBySlugHandler,
} from "../controllers/auth.controller";

const router = Router();

router.get("/business/:slug", getBusinessBySlugHandler);
router.post("/register", registerHandler);
router.post("/verify-email", verifyEmailHandler);
router.post("/forgot-password", forgotPasswordHandler);
router.post("/reset-password", resetPasswordHandler);
router.post("/login", loginHandler);
router.post("/refresh", refreshHandler);
router.post("/logout", logoutHandler);

export default router;
