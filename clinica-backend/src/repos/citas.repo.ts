import { pool } from "../lib/db";

export async function insertByPacienteId(paciente_id: number, d: { fecha: string; motivo?: string | null }) {
  const [r]: any = await pool.query(
    "INSERT INTO citas (paciente_id,fecha,motivo) VALUES (?,?,?)",
    [paciente_id, d.fecha, d.motivo ?? null]
  );
  const [rows]: any = await pool.query("SELECT * FROM citas WHERE id=?", [r.insertId]);
  return rows[0];
}