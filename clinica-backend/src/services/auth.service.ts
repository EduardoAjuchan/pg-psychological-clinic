

import bcrypt from "bcrypt";
import speakeasy from "speakeasy";
import { Request } from "express";
import * as usuariosRepo from "../repos/usuarios.repo";
import { signAccessToken } from "../lib/jwt";

/**
 * Paso 1: Login usuario + password.
 * - Si el usuario no tiene 2FA: devuelve token inmediatamente.
 * - Si tiene 2FA: marca pending2FA en session y pide OTP en paso 2.
 */
export async function login(req: Request, {
  usuario,
  password,
}: { usuario: string; password: string }) {
  const u = await usuariosRepo.getByUsername(usuario);
  if (!u || u.estado !== "activo") throw new Error("INVALID_CREDENTIALS");

  const okPass = await bcrypt.compare(password, u.contraseña_hash);
  if (!okPass) throw new Error("INVALID_CREDENTIALS");

  const permisos = await usuariosRepo.listPermissionsByUserId(u.id);

  if (!u.secreto_2fa) {
    // Sin 2FA: emitir JWT directo
    const token = signAccessToken({
      sub: u.id,
      username: u.usuario,
      name: u.nombre,
      rol_id: u.rol_id,
      permisos,
    });
    // Opcional: mantener sesión para contexto del chat
    (req.session as any).user = {
      id: u.id,
      nombre: u.nombre,
      usuario: u.usuario,
      rol_id: u.rol_id,
      permisos,
    };
    return { requires2FA: false, user: (req.session as any).user, token };
  }

  // Con 2FA habilitado: guardar estado intermedio
  (req.session as any).pending2FA = {
    userId: u.id,
    usuario: u.usuario,
    nombre: u.nombre,
    rol_id: u.rol_id,
    permisos,
  };
  return { requires2FA: true };
}

/**
 * Paso 2: Verificación de OTP (2FA) tras un login pendiente.
 * - Verifica TOTP con el secreto guardado en BD.
 * - Si es válido: emite JWT y completa sesión.
 */
export async function verifyLogin2FA(req: Request, token: string) {
  const pending = (req.session as any).pending2FA as
    | { userId: number; usuario: string; nombre: string; rol_id: number; permisos: string[] }
    | undefined;

  if (!pending) throw new Error("NO_2FA_PENDING");

  const u = await usuariosRepo.getById(pending.userId);
  if (!u || !u.secreto_2fa) throw new Error("NO_2FA_ENABLED");

  const ok = speakeasy.totp.verify({
    secret: u.secreto_2fa,
    encoding: "base32",
    token,
    window: 1,
  });
  if (!ok) throw new Error("INVALID_2FA_TOKEN");

  const jwt = signAccessToken({
    sub: u.id,
    username: u.usuario,
    name: u.nombre,
    rol_id: u.rol_id,
    permisos: pending.permisos,
  });

  (req.session as any).user = {
    id: u.id,
    nombre: u.nombre,
    usuario: u.usuario,
    rol_id: u.rol_id,
    permisos: pending.permisos,
  };
  delete (req.session as any).pending2FA;

  return { user: (req.session as any).user, token: jwt };
}