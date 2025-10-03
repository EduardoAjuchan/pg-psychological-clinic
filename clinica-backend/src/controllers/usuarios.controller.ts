

import { Request, Response } from "express";
import * as usuariosSvc from "../services/usuarios.service";

/**
 * POST /api/usuarios
 * Body: { nombre: string, usuario: string, password: string, rol_id: number }
 * Protegido por: requireJwt + requirePermissionJwt("users:create") (en router)
 */
export async function crearUsuarioController(req: Request, res: Response) {
  try {
    const created = await usuariosSvc.create(req.body);
    return res.status(201).json({ ok: true, user: created });
  } catch (e: any) {
    const code = String(e?.message || "ERROR");
    const statusMap: Record<string, number> = {
      USERNAME_TAKEN: 409,
      NOMBRE_INVALIDO: 400,
      USUARIO_INVALIDO: 400,
      PASSWORD_DEBIL: 400,
      ROL_INVALIDO: 400
    };
    const status = statusMap[code] ?? 500;
    return res.status(status).json({ ok: false, message: code });
  }
}