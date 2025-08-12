import { Router } from "express";
import { chatController } from "../controllers/chat.controller";

const r = Router();
r.post("/", chatController);
export default r;