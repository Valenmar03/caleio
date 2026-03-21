import { Router } from "express";
import {
  createClientHandler,
  getClientByIdHandler,
  listClientsHandler,
  updateClientHandler,
  deleteClientHandler,
  getClientAppointmentsHandler,
} from "../controllers/clients.controller";
import { validate } from "../middleware/validate";
import {
  createClientBody,
  updateClientBody,
  clientIdParams,
  clientsQuery,
} from "../validators";

const router = Router();

router.get("/", validate(clientsQuery, "query"), listClientsHandler);
router.get("/:id", validate(clientIdParams, "params"), getClientByIdHandler);
router.post("/", validate(createClientBody), createClientHandler);
router.patch("/:id", validate(clientIdParams, "params"), validate(updateClientBody), updateClientHandler);
router.delete("/:id", validate(clientIdParams, "params"), deleteClientHandler);
router.get("/:id/appointments", validate(clientIdParams, "params"), getClientAppointmentsHandler);

export default router;
