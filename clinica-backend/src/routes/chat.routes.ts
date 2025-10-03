import { Router } from "express";
import { chatController } from "../controllers/chat.controller";
import { requireJwt } from "../middlewares/jwt";  // 👈 importás el middleware

const r = Router();

// Proteger la ruta con JWT
r.post("/", requireJwt, chatController);

export default r;