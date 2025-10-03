// src/repos/dashboard.repo.ts
import { pool } from "../lib/db";

// Helper to normalize date range for SQL queries
function normalizeRange(
  from?: string,
  to?: string,
  field: string = "fecha"
): { clause: string; params: any[] } {
  // If no range provided, default to current month
  let clause = "";
  let params: any[] = [];
  if (!from && !to) {
    clause = `AND ${field} >= DATE_FORMAT(NOW(), '%Y-%m-01') AND ${field} < DATE_ADD(DATE_FORMAT(NOW(), '%Y-%m-01'), INTERVAL 1 MONTH)`;
  } else if (from && to) {
    clause = `AND ${field} BETWEEN ? AND ?`;
    params = [from, to];
  } else if (from) {
    clause = `AND ${field} >= ?`;
    params = [from];
  } else if (to) {
    clause = `AND ${field} <= ?`;
    params = [to];
  }
  return { clause, params };
}

export async function getTotalPacientesActivos({
  estado = "activo",
}: { estado?: string } = {}) {
  const [rows]: any = await pool.query(
    "SELECT COUNT(*) as total FROM pacientes WHERE estado=?",
    [estado]
  );
  return rows[0]?.total ?? 0;
}

export async function getTotalCitasFuturas({
  from,
  to,
}: { from?: string; to?: string } = {}) {
  const { clause, params } = normalizeRange(from, to, "fecha");
  const [rows]: any = await pool.query(
    `SELECT COUNT(*) as total FROM citas WHERE estado='activo' ${clause || "AND fecha >= NOW()"}`,
    params
  );
  return rows[0]?.total ?? 0;
}

export async function getCitasCanceladas({
  from,
  to,
}: { from?: string; to?: string } = {}) {
  const { clause, params } = normalizeRange(from, to, "fecha");
  const [rows]: any = await pool.query(
    `SELECT COUNT(*) as total
     FROM citas
     WHERE estado='inactivo'
     ${clause}`,
    params
  );
  return rows[0]?.total ?? 0;
}

export async function getNotasCount({
  from,
  to,
}: { from?: string; to?: string } = {}) {
  const { clause, params } = normalizeRange(from, to, "fecha");
  const [rows]: any = await pool.query(
    `SELECT COUNT(*) as total
     FROM notas_sesion
     WHERE estado='activo'
     ${clause}`,
    params
  );
  return rows[0]?.total ?? 0;
}

export async function getPacientesNuevos({
  from,
  to,
}: { from?: string; to?: string } = {}) {
  const { clause, params } = normalizeRange(from, to, "creado_en");
  const [rows]: any = await pool.query(
    `SELECT COUNT(*) as total
     FROM pacientes
     WHERE 1=1
     ${clause}`,
    params
  );
  return rows[0]?.total ?? 0;
}

// Nuevas funciones agrupadas

export async function getAppointmentsByDay({
  from,
  to,
}: { from?: string; to?: string } = {}) {
  const { clause, params } = normalizeRange(from, to, "fecha");
  const [rows]: any = await pool.query(
    `SELECT DATE(fecha) as dia, COUNT(*) as total
     FROM citas
     WHERE estado='activo'
     ${clause}
     AND google_event_id IS NOT NULL
     GROUP BY dia
     ORDER BY dia ASC`,
    params
  );
  return rows;
}

export async function getAppointmentsByStatus({
  from,
  to,
}: { from?: string; to?: string } = {}) {
  const { clause, params } = normalizeRange(from, to, "fecha");
  const extraFuture = (!from && !to) ? " AND fecha >= NOW()" : "";
  const [rows]: any = await pool.query(
    `SELECT estado, COUNT(*) as total
     FROM citas
     WHERE 1=1
     ${clause}
     ${extraFuture}
     AND google_event_id IS NOT NULL
     GROUP BY estado
     ORDER BY estado`,
    params
  );
  return rows;
}

export async function getPatientsByState() {
  const [rows]: any = await pool.query(
    `SELECT estado, COUNT(*) as total
     FROM pacientes
     GROUP BY estado
     ORDER BY estado`
  );
  return rows;
}