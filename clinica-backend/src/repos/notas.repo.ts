

import { pool } from "../lib/db";

export async function insert(data: any) {
  const [result]: any = await pool.query(
    `INSERT INTO notas_sesion
     (paciente_id, creada_por, sintomas, padecimientos, notas_importantes, trastornos, afectamientos_subyacentes, diagnostico, estado)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'activo')`,
    [
      data.paciente_id,
      data.creada_por,
      data.sintomas ?? null,
      data.padecimientos ?? null,
      data.notas_importantes ?? null,
      data.trastornos ?? null,
      data.afectamientos_subyacentes ?? null,
      data.diagnostico ?? null,
    ]
  );
  return { id: result.insertId, ...data, estado: "activo" };
}

export async function getById(id: number) {
  const [rows]: any = await pool.query(
    `SELECT * FROM notas_sesion WHERE id=?`,
    [id]
  );
  return rows[0];
}

export async function listByPaciente(
  pacienteId: number,
  { estado = 'activo', limit = 20, offset = 0 }: { estado?: 'activo' | 'inactivo' | 'todos'; limit?: number; offset?: number } = {}
) {
  const params: any[] = [pacienteId];
  let whereEstado = `estado='activo'`;
  if (estado === 'inactivo') whereEstado = `estado='inactivo'`;
  if (estado === 'todos') whereEstado = `estado IN ('activo','inactivo')`;

  const [rows]: any = await pool.query(
    `SELECT id, fecha, creada_por, sintomas, padecimientos, notas_importantes, trastornos,
            afectamientos_subyacentes, diagnostico, estado
     FROM notas_sesion
     WHERE paciente_id=? AND ${whereEstado}
     ORDER BY fecha DESC
     LIMIT ? OFFSET ?`,
    [...params, Number(limit), Number(offset)]
  );
  return rows as any[];
}

export async function countByPaciente(
  pacienteId: number,
  { estado = 'activo' as 'activo' | 'inactivo' | 'todos' } = {}
) {
  const params: any[] = [pacienteId];
  let whereEstado = `estado='activo'`;
  if (estado === 'inactivo') whereEstado = `estado='inactivo'`;
  if (estado === 'todos') whereEstado = `estado IN ('activo','inactivo')`;

  const [rows]: any = await pool.query(
    `SELECT COUNT(*) AS total FROM notas_sesion WHERE paciente_id=? AND ${whereEstado}`,
    params
  );
  return (rows?.[0]?.total as number) ?? 0;
}

export async function updateById(id: number, data: any) {
  const fields = Object.keys(data).filter(k => data[k] !== undefined);
  if (fields.length === 0) return null;
  const setClause = fields.map(f => `${f}=?`).join(", ");
  const values = fields.map(f => data[f]);
  const [result]: any = await pool.query(
    `UPDATE notas_sesion SET ${setClause} WHERE id=?`,
    [...values, id]
  );
  return result.affectedRows > 0;
}

export async function softDeleteById(id: number) {
  const [result]: any = await pool.query(
    `UPDATE notas_sesion SET estado='inactivo' WHERE id=?`,
    [id]
  );
  return result.affectedRows > 0;
}