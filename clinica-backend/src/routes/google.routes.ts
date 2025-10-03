const FRONTEND_URL = (process.env.FRONTEND_URL || "http://localhost:4000").replace(/\/$/, "");
import { Router } from "express";
import { getAuthUrl, exchangeCodeForTokens } from "../lib/google";

const r = Router();

// GET /api/google/connect -> redirige a Google para consentir
// GET /api/google/connect -> redirige a Google para consentir
r.get("/connect", (_req, res) => {
  const baseUrl = getAuthUrl();
  try {
    const u = new URL(baseUrl);
    // Si el front envía ?return_to=..., lo propagamos en state
    const returnTo = (String((_req.query as any)?.return_to || "") || "").trim();
    if (returnTo && !u.searchParams.has("state")) {
      u.searchParams.set("state", encodeURIComponent(JSON.stringify({ return_to: returnTo })));
    }
    return res.redirect(u.toString());
  } catch {
    // fallback sencillo
    return res.redirect(baseUrl);
  }
});

// GET /api/google/callback -> Google redirige aquí con ?code=...
r.get("/callback", async (req, res) => {
  try {
    const code = String(req.query.code || "");
    if (!code) return res.status(400).send("Falta code");
    await exchangeCodeForTokens(code);
    const stateParam = typeof req.query.state === 'string' ? req.query.state : undefined;
    let returnTo = FRONTEND_URL;
    try {
      if (stateParam) {
        const parsed = JSON.parse(decodeURIComponent(stateParam));
        if (parsed?.return_to && typeof parsed.return_to === 'string') {
          returnTo = String(parsed.return_to).replace(/\/$/, "");
        }
      }
    } catch {}
    // En éxito: cerrar popup y notificar al opener (frontend)
    const html = `<!doctype html>
<html><head><meta charset="utf-8"/></head>
<body>
<script>
  try {
    if (window.opener && !window.opener.closed) {
      // Notificar al frontend que la conexión fue exitosa
      window.opener.postMessage({ type: 'google-calendar-connected', ok: true }, '*');
      window.close();
    } else {
      // Fallback: redirigir a un dashboard del front (ajustá si es necesario)
      window.location.href = (window.localStorage && window.localStorage.getItem('return_to')) || '${returnTo}';
    }
  } catch (e) {
    // Si algo falla, igual intentamos cerrar
    window.close();
  }
</script>
</body></html>`;
    return res.status(200).send(html);
  } catch (e: any) {
    res.status(500).send(`Error en callback: ${e?.message}`);
  }
});

export default r;