import { pool } from "../lib/db";

export async function insertByPacienteId(paciente_id: number, d: { fecha: string; motivo?: string | null }) {
  const [r]: any = await pool.query(
    "INSERT INTO citas (paciente_id, fecha, motivo) VALUES (?,?,?)",
    [paciente_id, d.fecha, d.motivo ?? null]
  );
  const [rows]: any = await pool.query("SELECT * FROM citas WHERE id=?", [r.insertId]);
  return rows[0];
}

export async function setGoogleEventId(citaId: number, eventId: string | null) {
  await pool.query("UPDATE citas SET google_event_id=? WHERE id=?", [eventId, citaId]);
}

export async function getById(id: number) {
  const [rows]: any = await pool.query("SELECT * FROM citas WHERE id=?", [id]);
  return rows[0] || null;
}

export async function updateById(id: number, d: { fecha?: string; motivo?: string | null; estado?: "activo" | "inactivo" }) {
  const fields: string[] = [];
  const vals: any[] = [];
  if (d.fecha !== undefined) { fields.push("fecha=?"); vals.push(d.fecha); }
  if (d.motivo !== undefined) { fields.push("motivo=?"); vals.push(d.motivo); }
  if (d.estado !== undefined) { fields.push("estado=?"); vals.push(d.estado); }
  vals.push(id);
  const sql = `UPDATE citas SET ${fields.join(", ")} WHERE id=?`;
  await pool.query(sql, vals);
  return getById(id);
}

export async function getUpcomingActiveByPaciente(pacienteId: number) {
  const [rows]: any = await pool.query(
    `SELECT * FROM citas
     WHERE paciente_id=? AND estado='activo' AND fecha >= NOW()
     ORDER BY fecha ASC`,
    [pacienteId]
  );
  return rows as any[];
}

export async function updateFechaMotivo(id: number, d: { fecha: string; motivo?: string }) {
  if (d.motivo !== undefined) {
    await pool.query(`UPDATE citas SET fecha=?, motivo=? WHERE id=?`, [d.fecha, d.motivo, id]);
  } else {
    await pool.query(`UPDATE citas SET fecha=? WHERE id=?`, [d.fecha, id]);
  }
  return getById(id);
}

export async function cancelById(id: number) {
  await pool.query(`UPDATE citas SET estado='inactivo' WHERE id=?`, [id]);
  return getById(id);
}

/** Listado flexible para menú */
export async function list(opts: {
  paciente_id?: number;
  estado?: "activo" | "inactivo";
  desde?: string;  // 'YYYY-MM-DD HH:mm:ss'
  hasta?: string;  // 'YYYY-MM-DD HH:mm:ss'
  limit?: number;
  offset?: number;
}) {
  const {
    paciente_id,
    estado,
    desde,
    hasta,
    limit = 50,
    offset = 0,
  } = opts || {};

  const where: string[] = ["1=1"];
  const params: any[] = [];

  if (paciente_id) { where.push("c.paciente_id = ?"); params.push(paciente_id); }
  if (estado)      { where.push("c.estado = ?");      params.push(estado); }
  if (desde)       { where.push("c.fecha >= ?");      params.push(desde); }
  if (hasta)       { where.push("c.fecha < ?");       params.push(hasta); }

  const sql =
    `SELECT c.*, p.nombre_completo
     FROM citas c
     JOIN pacientes p ON p.id = c.paciente_id
     WHERE ${where.join(" AND ")}
     ORDER BY c.fecha DESC
     LIMIT ? OFFSET ?`;

  const [rows]: any = await pool.query(sql, [...params, Number(limit), Number(offset)]);
  return rows as any[];
}

export async function count(opts: {
  paciente_id?: number;
  estado?: "activo" | "inactivo";
  desde?: string;
  hasta?: string;
}) {
  const { paciente_id, estado, desde, hasta } = opts || {};
  const where: string[] = ["1=1"];
  const params: any[] = [];

  if (paciente_id) { where.push("paciente_id = ?"); params.push(paciente_id); }
  if (estado)      { where.push("estado = ?");      params.push(estado); }
  if (desde)       { where.push("fecha >= ?");      params.push(desde); }
  if (hasta)       { where.push("fecha < ?");       params.push(hasta); }

  const [rows]: any = await pool.query(
    `SELECT COUNT(*) AS total FROM citas WHERE ${where.join(" AND ")}`,
    params
  );
  return rows[0]?.total ?? 0;
}