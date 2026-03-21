import { Router } from "express";
import { getBusinessHandler, updateBusinessHandler } from "../controllers/business.controller";
import { validate } from "../middleware/validate";
import { updateBusinessBody } from "../validators";

const router = Router();

router.get("/", getBusinessHandler);
router.patch("/", validate(updateBusinessBody), updateBusinessHandler);

export default router;
