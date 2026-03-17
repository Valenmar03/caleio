import { Router } from "express";
import { getBusinessHandler, updateBusinessHandler } from "../controllers/business.controller";

const router = Router();

router.get("/", getBusinessHandler);
router.patch("/", updateBusinessHandler);

export default router;
