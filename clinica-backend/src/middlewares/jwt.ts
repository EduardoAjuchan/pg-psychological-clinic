import { Request, Response, NextFunction } from "express";
import { verifyAccessToken, JWTPayload } from "../lib/jwt";

declare global {
  namespace Express {
    interface Request { user?: JWTPayload }
  }
}

export function requireJwt(req: Request, res: Response, next: NextFunction) {
  const h = req.headers.authorization || "";
  const m = h.match(/^Bearer\s+(.+)$/i);
  if (!m) return res.status(401).json({ ok:false, message:"Token requerido" });

  try {
    const payload = verifyAccessToken(m[1]);
    req.user = payload;
    return next();
  } catch {
    return res.status(401).json({ ok:false, message:"Token inválido o expirado" });
  }
}

export function requirePermissionJwt(perm: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ ok:false, message:"No autenticado" });
    const has = req.user.permisos?.includes(perm);
    if (!has) return res.status(403).json({ ok:false, message:"Sin permiso", required: perm });
    return next();
  };
}