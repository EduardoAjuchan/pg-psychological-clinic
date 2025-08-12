import 'dotenv/config';
import { createServer } from "http";
import app from "./app";

const port = process.env.PORT ? Number(process.env.PORT) : 3000;
const server = createServer(app);

server.listen(port, () => {
  console.log(`API escuchando en http://localhost:${port}`);
});