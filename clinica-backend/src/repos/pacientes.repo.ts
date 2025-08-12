import { pool } from "../lib/db";

export async function findByNormalizedName(nn: string) {
  const [rows]: any = await pool.query(
    "SELECT * FROM pacientes WHERE nombre_normalizado=? AND estado='activo' LIMIT 1",
    [nn]
  );
  return rows[0] || null;
}

export async function insert(d: {
  nombre_completo: string;
  nombre_normalizado: string;
  alias?: string | null;
  telefono?: string | null;
  genero?: "masculino"|"femenino"|"otro"|"no_especificado"|null;
  motivo_consulta?: string | null;
}) {
  const [r]: any = await pool.query(
    `INSERT INTO pacientes (nombre_completo,nombre_normalizado,alias,telefono,genero,motivo_consulta)
     VALUES (?,?,?,?,?,?)`,
    [d.nombre_completo, d.nombre_normalizado, d.alias ?? null, d.telefono ?? null, d.genero ?? null, d.motivo_consulta ?? null]
  );
  const [rows]: any = await pool.query("SELECT * FROM pacientes WHERE id=?", [r.insertId]);
  return rows[0];
}