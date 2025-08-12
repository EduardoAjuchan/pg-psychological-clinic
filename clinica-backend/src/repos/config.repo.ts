

import { pool } from "../lib/db";

export async function getVariable(variable: string) {
  const [rows]: any = await pool.query(
    "SELECT valor, tipo FROM configuracion WHERE variable=? LIMIT 1",
    [variable]
  );
  return rows[0] || null;
}

export async function upsertVariable(
  variable: string,
  valor: string,
  tipo: "string" | "number" | "boolean" | "json" = "string",
  descripcion?: string
) {
  await pool.query(
    `INSERT INTO configuracion (variable, valor, tipo, descripcion)
     VALUES (?,?,?,?)
     ON DUPLICATE KEY UPDATE
       valor=VALUES(valor),
       tipo=VALUES(tipo),
       descripcion=VALUES(descripcion),
       ultima_actualizacion=CURRENT_TIMESTAMP`,
    [variable, valor, tipo, descripcion ?? null]
  );
}