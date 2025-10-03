

import { pool } from "../lib/db";

export type UsuarioRow = {
  id: number;
  nombre: string;
  usuario: string;
  contraseña_hash: string;
  secreto_2fa: string | null;
  rol_id: number;
  estado: "activo" | "inactivo";
  creado_en: Date;
};

export async function getById(id: number): Promise<UsuarioRow | null> {
  const [rows] = await pool.query(
    `SELECT id, nombre, usuario, contraseña_hash, secreto_2fa, rol_id, estado, creado_en
     FROM usuarios WHERE id=?`,
    [id]
  );
  const r = (rows as any[])[0];
  return r || null;
}

export async function getByUsername(usuario: string): Promise<UsuarioRow | null> {
  const [rows] = await pool.query(
    `SELECT id, nombre, usuario, contraseña_hash, secreto_2fa, rol_id, estado, creado_en
     FROM usuarios WHERE usuario=?`,
    [usuario]
  );
  const r = (rows as any[])[0];
  return r || null;
}

export async function insert({ nombre, usuario, contraseña_hash, rol_id }: {
  nombre: string;
  usuario: string;
  contraseña_hash: string;
  rol_id: number;
}): Promise<Pick<UsuarioRow, "id" | "nombre" | "usuario" | "rol_id" | "estado">> {
  const [res]: any = await pool.query(
    `INSERT INTO usuarios (nombre, usuario, contraseña_hash, rol_id, estado)
     VALUES (?, ?, ?, ?, 'activo')`,
    [nombre, usuario, contraseña_hash, rol_id]
  );
  return { id: res.insertId, nombre, usuario, rol_id, estado: "activo" };
}

export async function set2FASecret(userId: number, secretBase32: string): Promise<void> {
  await pool.query(
    `UPDATE usuarios SET secreto_2fa=? WHERE id=? AND estado='activo'`,
    [secretBase32, userId]
  );
}

export async function clear2FASecret(userId: number): Promise<void> {
  await pool.query(
    `UPDATE usuarios SET secreto_2fa=NULL WHERE id=? AND estado='activo'`,
    [userId]
  );
}

export async function listPermissionsByUserId(userId: number): Promise<string[]> {
  const [rows] = await pool.query(
    `SELECT p.clave
     FROM usuarios u
     JOIN roles r ON r.id = u.rol_id
     JOIN rol_permiso rp ON rp.rol_id = r.id
     JOIN permisos p ON p.id = rp.permiso_id
     WHERE u.id=?`,
    [userId]
  );
  return (rows as any[]).map(r => r.clave as string);
}

export async function logLoginAttempt({ usuario_id, exito, ip, user_agent, mensaje }: {
  usuario_id: number | null;
  exito: boolean;
  ip?: string;
  user_agent?: string;
  mensaje?: string;
}): Promise<void> {
  await pool.query(
    `INSERT INTO log_inicio_sesion (usuario_id, exito, ip, user_agent, mensaje)
     VALUES (?, ?, ?, ?, ?)`,
    [usuario_id, exito ? 1 : 0, ip || null, user_agent || null, mensaje || null]
  );
}