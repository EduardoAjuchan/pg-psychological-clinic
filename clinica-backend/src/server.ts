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

app.use(cors({ origin: process.env.CORS_ORIGIN?.split(",") || true, credentials: true }));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET!,
  resave: false,
  saveUninitialized: false,
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