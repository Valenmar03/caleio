import { Router } from "express";
import { getClientsHandler } from "../controllers/clients.controller";

const router = Router();

router.get("/", getClientsHandler);

export default router;