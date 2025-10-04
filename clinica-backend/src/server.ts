// src/server.ts
import 'dotenv/config';
import { createServer } from "http";
import express from "express";
import session from "express-session";
import cors from "cors";
import routes from "./routes";
import usuariosRoutes from "./routes/usuarios.routes"; // <-- import correcto
import authRoutes from "./routes/auth.routes";
import pacientesRoutes from "./routes/pacientes.routes";
import citasRoutes from "./routes/citas.routes";
import dashboardRoutes from "./routes/dashboard.routes";


const app = express();
app.set("trust proxy", 1);

// CORS: permitir múltiples orígenes desde .env (coma-separados)
const ALLOWED_ORIGINS_RAW = (process.env.CORS_ORIGIN || "");
const ALLOWED_ORIGINS = ALLOWED_ORIGINS_RAW
  .split(",")
  .map(s => s.trim().replace(/\/$/, "")) // sin barra final
  .filter(Boolean);

function normalizeOrigin(o?: string) {
  return (o || "").replace(/\/$/, "");
}

function isAllowedOrigin(origin?: string) {
  const o = normalizeOrigin(origin);
  if (!o) return true; // curl/postman sin origin
  if (ALLOWED_ORIGINS.length === 0) return true; // sin config -> permitir en dev
  if (ALLOWED_ORIGINS.includes("*")) return true; // comodín global (dev)
  if (ALLOWED_ORIGINS.includes(o)) return true; // match exacto

  // localhost / 127.0.0.1 con cualquier puerto
  const allowLocalhostAny = ALLOWED_ORIGINS.includes("http://localhost:*") || ALLOWED_ORIGINS.includes("https://localhost:*");
  const allowLoopbackAny = ALLOWED_ORIGINS.includes("http://127.0.0.1:*") || ALLOWED_ORIGINS.includes("https://127.0.0.1:*");
  if (allowLocalhostAny && /^https?:\/\/(localhost)(?::\d+)?$/.test(o)) return true;
  if (allowLoopbackAny && /^https?:\/\/(127\.0\.0\.1)(?::\d+)?$/.test(o)) return true;

  return false;
}

app.use(cors({
  origin(origin, callback) {
    if (isAllowedOrigin(origin)) {
      return callback(null, true);
    }
    // negar CORS (el navegador bloqueará)
    return callback(null, false);
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));

app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET!,
  resave: false,
  saveUninitialized: false,
  cookie: {
    sameSite: process.env.SESSION_SAMESITE === "None" ? "none" : "lax",
    secure: process.env.SESSION_SECURE === "true",
  },
}));


// monta el router de usuarios
app.use("/api/usuarios", usuariosRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/pacientes", pacientesRoutes);
app.use("/api/citas", citasRoutes);
app.use("/api", routes);
app.use("/api/dashboard", dashboardRoutes);


const port = process.env.PORT ? Number(process.env.PORT) : 3000;
const server = createServer(app);

server.listen(port, () => {
  console.log(`API escuchando en http://localhost:${port}`);
});