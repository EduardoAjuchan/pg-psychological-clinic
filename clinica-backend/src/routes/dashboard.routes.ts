// src/routes/dashboard.routes.ts
import { Router } from "express";
import { requireJwt, requirePermissionJwt } from "../middlewares/jwt";
import { getDashboardController } from "../controllers/dashboard.controller";

const r = Router();

r.get("/",
  requireJwt,
  requirePermissionJwt("dashboard:view"),
  getDashboardController
);

export default r;