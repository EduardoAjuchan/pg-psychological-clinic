import { Router } from "express";
import { requireJwt, requirePermissionJwt } from "../middlewares/jwt";
import {
  listarPacientesController,
  detallePacienteController,
  crearPacienteController,
  actualizarPacienteController,
  desactivarPacienteController
} from "../controllers/pacientes.controller";

const r = Router();

// Lectura
r.get("/",
  requireJwt,
  requirePermissionJwt("patients:read"),
  listarPacientesController
);

r.get("/:id",
  requireJwt,
  requirePermissionJwt("patients:read"),
  detallePacienteController
);

// Escritura
r.post("/",
  requireJwt,
  requirePermissionJwt("patients:write"),
  crearPacienteController
);

r.patch("/:id",
  requireJwt,
  requirePermissionJwt("patients:write"),
  actualizarPacienteController
);

r.patch("/:id/deactivate",
  requireJwt,
  requirePermissionJwt("patients:write"),
  desactivarPacienteController
);

export default r;