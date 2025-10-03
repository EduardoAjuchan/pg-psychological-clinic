import { Router } from "express";
import { crearUsuarioController } from "../controllers/usuarios.controller";
import { requireJwt, requirePermissionJwt } from "../middlewares/jwt";

const r = Router();

r.post("/",
  requireJwt,
  requirePermissionJwt("users:create"),
  crearUsuarioController
);

export default r;