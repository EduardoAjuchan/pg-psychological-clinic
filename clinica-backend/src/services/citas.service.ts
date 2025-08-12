import * as pacientes from "./pacientes.service";
import * as citasRepo from "../repos/citas.repo";
import { z } from "zod";
import * as chrono from "chrono-node";

const ScheduleAppointmentInput = z.object({
  nombre: z.string().optional(),   // se completa desde sesión si falta
  fecha: z.string().min(3),
  motivo: z.string().nullish(),
});

// Guatemala: UTC-6
const TZ_OFFSET_MINUTES = -6 * 60;

function toMySQLDateTimeLocal(date: Date, tzOffsetMinutes: number) {
  // Ajustar la fecha a "hora local" de Guatemala, independiente del TZ del server
  const utcMs = date.getTime() + date.getTimezoneOffset() * 60000;
  const local = new Date(utcMs + tzOffsetMinutes * 60000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${local.getFullYear()}-${pad(local.getMonth() + 1)}-${pad(local.getDate())} ${pad(local.getHours())}:${pad(local.getMinutes())}:00`;
}

function parseFechaToMySQL(fechaStr: string): string {
  // 1) Intentar con chrono y ajustar manualmente a la zona horaria de Guatemala
  let dt: Date | null = chrono.parseDate(fechaStr, new Date()) as Date | null;
  if (dt) {
    // Ajustar la fecha a la zona horaria de Guatemala
    dt = new Date(dt.getTime() + TZ_OFFSET_MINUTES * 60000);
  }

  // 2) Si falla, intentar parseo nativo (ISO)
  if (!dt) {
    const maybe = new Date(fechaStr);
    if (!isNaN(maybe.getTime())) dt = maybe;
  }

  if (!dt) {
    throw new Error("Fecha inválida. Enviá ISO (YYYY-MM-DD HH:mm) o texto tipo 'jueves 3pm'.");
  }
  return toMySQLDateTimeLocal(dt, TZ_OFFSET_MINUTES);
}

export async function scheduleByName(nombre: string, raw: unknown) {
  const data = ScheduleAppointmentInput.parse(raw);
  const p = await pacientes.getByName(nombre);

  const fechaMySQL = parseFechaToMySQL(String(data.fecha));
  const motivo = (data.motivo && data.motivo.trim()) ? data.motivo.trim() : "seguimiento";

  return citasRepo.insertByPacienteId(p.id, { fecha: fechaMySQL, motivo });
}