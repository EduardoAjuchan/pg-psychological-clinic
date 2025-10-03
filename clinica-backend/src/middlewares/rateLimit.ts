// src/middlewares/rateLimit.ts
import rateLimit from "express-rate-limit";

// Limite estricto para login (prevención fuerza bruta)
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 50, // máximo 5 intentos
  message: { ok: false, message: "Demasiados intentos de login, intentá más tarde." },
  standardHeaders: true, // devuelve info en headers RateLimit-*
  legacyHeaders: false,  // quita X-RateLimit-*
});

// Limite más alto para chat (evitar flood)
export const chatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 100, // 100 requests por minuto
  message: { ok: false, message: "Demasiadas solicitudes al chat, esperá un momento." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Un limitador general opcional para toda la API
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 500, // máximo 500 requests por IP
  message: { ok: false, message: "Demasiadas solicitudes, intentá más tarde." },
  standardHeaders: true,
  legacyHeaders: false,
});