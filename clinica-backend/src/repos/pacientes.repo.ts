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

export async function getById(id: number) {
  const [rows]: any = await pool.query("SELECT * FROM pacientes WHERE id=? LIMIT 1", [id]);
  return rows[0] || null;
}

export async function updateById(id: number, data: {
  nombre_completo?: string;
  nombre_normalizado?: string;
  alias?: string | null;
  telefono?: string | null;
  genero?: "masculino"|"femenino"|"otro"|"no_especificado"|null;
  motivo_consulta?: string | null;
  estado_proceso?: "iniciado"|"en_pausa"|"finalizado";
}) {
  const fields: string[] = [];
  const values: any[] = [];
  for (const [k, v] of Object.entries(data)) {
    if (v !== undefined) { // permitir null explícito
      fields.push(`${k} = ?`);
      values.push(v);
    }
  }
  if (!fields.length) return getById(id);
  values.push(id);
  await pool.query(`UPDATE pacientes SET ${fields.join(", ")} WHERE id=?`, values);
  return getById(id);
}

export async function softDeleteById(id: number) {
  await pool.query(`UPDATE pacientes SET estado='inactivo' WHERE id=?`, [id]);
  return getById(id);
}

export async function listAll({ q, estado = "activo", limit = 50, offset = 0 }: {
  q?: string;
  estado?: "activo" | "inactivo";
  limit?: number;
  offset?: number;
}) {
  const params: any[] = [];
  let where = `WHERE 1=1`;
  if (estado) { where += ` AND estado=?`; params.push(estado); }
  if (q) {
    where += ` AND (nombre_normalizado LIKE ? OR alias LIKE ? OR telefono LIKE ?)`;
    params.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }
  const [rows]: any = await pool.query(
    `SELECT id, nombre_completo, alias, telefono, genero, estado_proceso, estado, creado_en
     FROM pacientes ${where}
     ORDER BY creado_en DESC
     LIMIT ? OFFSET ?`,
    [...params, Number(limit), Number(offset)]
  );
  return rows as any[];
}

export async function countAll({ q, estado = "activo" }: { q?: string; estado?: "activo" | "inactivo" }) {
  const params: any[] = [];
  let where = `WHERE 1=1`;
  if (estado) { where += ` AND estado=?`; params.push(estado); }
  if (q) {
    where += ` AND (nombre_normalizado LIKE ? OR alias LIKE ? OR telefono LIKE ?)`;
    params.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }
  const [rows]: any = await pool.query(`SELECT COUNT(*) as total FROM pacientes ${where}`, params);
  return rows[0]?.total ?? 0;
}

export async function getByNameNormalized(nombre_normalizado: string) {
  const [rows]: any = await pool.query(
    `SELECT * FROM pacientes WHERE nombre_normalizado=? AND estado='activo' LIMIT 1`,
    [nombre_normalizado]
  );
  return rows[0] || null;
}