import { Router } from "express";
import chatRouter from "./chat.routes";
import healthRouter from "./health.routes";
import googleRouter from "./google.routes";


const router = Router();
router.use("/chat", chatRouter);
router.use("/health", healthRouter);
router.use("/google", googleRouter);


// TODO: router.use("/auth", authRouter);
// TODO: router.use("/usuarios", usuariosRouter);
// TODO: router.use("/config", configRouter);

export default router;