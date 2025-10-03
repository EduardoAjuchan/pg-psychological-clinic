import { Router } from "express";
import { chatController } from "../controllers/chat.controller";
import { requireJwt, requirePermissionJwt } from "../middlewares/jwt";
import { chatLimiter } from "../middlewares/rateLimit";

const r = Router();

// Proteger la ruta con JWT + permiso + rate limit
r.post("/", requireJwt, requirePermissionJwt("chat:use"), chatLimiter, chatController);

export default r;