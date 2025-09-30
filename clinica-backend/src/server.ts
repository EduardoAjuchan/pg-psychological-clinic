import 'dotenv/config';
import { createServer } from "http";
import express from "express";
import session from "express-session";
import cors from "cors";
import routes from "./routes";

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN?.split(",") || true, credentials: true }));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET!,
  resave: false,
  saveUninitialized: false,
}));

app.use("/api", routes);

const port = process.env.PORT ? Number(process.env.PORT) : 3000;
const server = createServer(app);

server.listen(port, () => {
  console.log(`API escuchando en http://localhost:${port}`);
});