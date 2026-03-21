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
import { validate } from "../middleware/validate";
import {
  registerBody,
  loginBody,
  forgotPasswordBody,
  resetPasswordBody,
  verifyEmailBody,
  slugParams,
} from "../validators";

const router = Router();

router.get("/business/:slug", validate(slugParams, "params"), getBusinessBySlugHandler);
router.post("/register", validate(registerBody), registerHandler);
router.post("/verify-email", validate(verifyEmailBody), verifyEmailHandler);
router.post("/forgot-password", validate(forgotPasswordBody), forgotPasswordHandler);
router.post("/reset-password", validate(resetPasswordBody), resetPasswordHandler);
router.post("/login", validate(loginBody), loginHandler);
router.post("/refresh", refreshHandler);
router.post("/logout", logoutHandler);

export default router;
