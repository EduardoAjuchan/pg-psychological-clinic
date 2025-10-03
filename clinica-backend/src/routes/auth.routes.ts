import { login, verifyLogin2FA } from "../services/auth.service";
import { Router } from "express";
import * as twofa from "../services/twofa.service";
import { loginLimiter } from "../middlewares/rateLimit";
import { requireJwt, requirePermissionJwt } from "../middlewares/jwt";

const r = Router();

/**
 * GET /api/auth/2fa/setup/:userId
 * - Genera secreto TOTP, muestra QR en terminal y devuelve dataURL opcional.
 * - En prod deberías protegerlo (JWT + users:create). Por ahora, sin middleware para probar.
 */
r.get("/2fa/setup/:userId", requireJwt, requirePermissionJwt("users:create"), async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    const setup = await twofa.generateSetup(userId);
    res.json({ ok: true, ...setup });
  } catch (e: any) {
    const code = String(e?.message || "ERROR");
    const status = code === "USER_NOT_FOUND" ? 404 : 400;
    res.status(status).json({ ok: false, message: code });
  }
});

/**
 * POST /api/auth/2fa/verify-setup
 * Body: { userId: number, tempSecretBase32: string, token: string }
 * - Verifica un OTP contra el secret temporal y si es válido, lo guarda en BD.
 */
r.post("/2fa/verify-setup", requireJwt, requirePermissionJwt("users:create"), async (req, res) => {
  try {
    const { userId, tempSecretBase32, token } = req.body as {
      userId: number; tempSecretBase32: string; token: string;
    };
    const out = await twofa.verifySetup(Number(userId), tempSecretBase32, token);
    res.json(out);
  } catch (e: any) {
    const code = String(e?.message || "ERROR");
    const map: Record<string, number> = {
      USER_NOT_FOUND: 404,
      USER_INACTIVE: 400,
      INVALID_2FA_TOKEN: 401,
    };
    res.status(map[code] ?? 400).json({ ok: false, message: code });
  }
});

// Paso 1: login con usuario y password
r.post("/login", loginLimiter, async (req, res) => {
  try {
    const out = await login(req, req.body);
    res.json({ ok: true, ...out });
  } catch (e: any) {
    const code = String(e?.message || "ERROR");
    const status = code === "INVALID_CREDENTIALS" ? 401 : 400;
    res.status(status).json({ ok: false, message: code });
  }
});

// Paso 2: verificación del OTP 2FA
r.post("/login/2fa/verify", loginLimiter, async (req, res) => {
  try {
    const { token } = req.body as { token: string };
    const out = await verifyLogin2FA(req, token);
    res.json({ ok: true, ...out });
  } catch (e: any) {
    const code = String(e?.message || "ERROR");
    const map: Record<string, number> = {
      NO_2FA_PENDING: 400,
      NO_2FA_ENABLED: 400,
      INVALID_2FA_TOKEN: 401,
    };
    res.status(map[code] ?? 400).json({ ok: false, message: code });
  }
});

export default r;