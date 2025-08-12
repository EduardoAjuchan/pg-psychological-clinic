import express from "express";
import dotenv from "dotenv";
import helmet from "helmet";
import morgan from "morgan";
import session from "express-session";
import { sessionConfig } from "./lib/session";
import { corsMiddleware } from "./lib/cors";
import apiRouter from "./routes";

dotenv.config();

const app = express();
app.disable("x-powered-by");

// Middlewares base
app.use(helmet());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use(corsMiddleware);

// Sesión
app.use(session(sessionConfig));

// Rutas
app.use("/api", apiRouter);

// Health root
app.get("/", (_req, res) => res.status(200).send("Clinica API OK"));
export default app;