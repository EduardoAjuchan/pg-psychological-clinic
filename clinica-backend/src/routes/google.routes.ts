import { Router } from "express";
import { getAuthUrl, exchangeCodeForTokens } from "../lib/google";

const r = Router();

// GET /api/google/connect -> redirige a Google para consentir
r.get("/connect", (_req, res) => {
  const url = getAuthUrl();
  return res.redirect(url);
});

// GET /api/google/callback -> Google redirige aquí con ?code=...
r.get("/callback", async (req, res) => {
  try {
    const code = String(req.query.code || "");
    if (!code) return res.status(400).send("Falta code");
    await exchangeCodeForTokens(code);
    res.send("Google Calendar conectado ✅. Tokens guardados en BD.");
  } catch (e: any) {
    res.status(500).send(`Error en callback: ${e?.message}`);
  }
});

export default r;