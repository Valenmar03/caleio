import { Router } from "express";
import { getServicesHandler } from "../controllers/services.controller";

const router = Router();

router.get("/", getServicesHandler);

export default router;