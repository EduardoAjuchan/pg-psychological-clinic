import * as pacientes from "./pacientes.service";
import * as citasRepo from "../repos/citas.repo";
import { z } from "zod";
import * as chrono from "chrono-node";
import { createEventForCita, isSlotFree, getConflictEvent, updateEventForCita, deleteEventForCita } from "./google-calendar.service";
import * as configService from "../services/config.service";

const ScheduleAppointmentInput = z.object({
  nombre: z.string().optional(),   // se completa desde sesión si falta
  fecha: z.string().min(3),
  motivo: z.string().nullish(),
  duracion_min: z.number().int().positive().optional(),
});

const RescheduleInput = z.object({
  nombre: z.string().optional(),
  nueva_fecha: z.string().min(3),
  motivo: z.string().nullish(),
  duracion_min: z.number().int().positive().optional(),
  // opcional: fecha original para desambiguar si el paciente tiene varias próximas
  fecha: z.string().min(3).optional(),
});

const CancelInput = z.object({
  nombre: z.string().optional(),
  // si hay múltiples próximas, permitir desambiguar
  fecha: z.string().min(3).optional(),
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
  // 1) Intentar con chrono (sin options que no están en los tipos)
  let dt: Date | null = chrono.parseDate(fechaStr, new Date()) as Date | null;

  // 2) Si falla, intentar parseo nativo (ISO)
  if (!dt) {
    const maybe = new Date(fechaStr);
    if (!isNaN(maybe.getTime())) dt = maybe;
  }

  if (!dt) {
    throw new Error("Fecha inválida. Enviá ISO (YYYY-MM-DD HH:mm) o texto tipo 'jueves 3pm'.");
  }

  // 3) Convertir a DATETIME MySQL en hora de Guatemala
  return toMySQLDateTimeLocal(dt, TZ_OFFSET_MINUTES);
}

export async function scheduleByName(nombre: string, raw: unknown) {
  const data = ScheduleAppointmentInput.parse(raw);
  const p = await pacientes.getByName(nombre);

  const fechaMySQL = parseFechaToMySQL(String(data.fecha));
  const motivo = (data.motivo && data.motivo.trim()) ? data.motivo.trim() : "seguimiento";

  // Resolver duración: usar la indicada o la de configuración
  let duracionMin = typeof data.duracion_min === "number" ? data.duracion_min : undefined;
  if (duracionMin == null) {
    const cfg = await configService.get("appointment_default_duration_minutes", 0);
    const parsed = Number.parseInt(String(cfg ?? "50"), 10);
    duracionMin = Number.isFinite(parsed) && parsed > 0 ? parsed : 50;
  }

  // 0) Validar disponibilidad del slot en Google Calendar antes de crear
  const libre = await isSlotFree(fechaMySQL, duracionMin);
  if (!libre) {
    const ev = await getConflictEvent(fechaMySQL, duracionMin);
    const detalle = ev
      ? `Ocupado por "${ev.summary || "evento"}" de ${ev.start} a ${ev.end}${ev.htmlLink ? ` (ver: ${ev.htmlLink})` : ""}.`
      : "Ocupado por otro evento.";
    throw new Error(`CONFLICTO_HORARIO: ${detalle}`);
  }

  // 1) Crear en BD
  const cita = await citasRepo.insertByPacienteId(p.id, { fecha: fechaMySQL, motivo });

  // 2) Crear en Google Calendar (no romper si falla). Guardar eventId en la cita.
  try {
    const event = await createEventForCita({
      pacienteNombre: p.nombre_completo,
      motivo,
      fechaMySQL,
      duracionMin,
    });
    if (event?.eventId) {
      await citasRepo.setGoogleEventId(cita.id, event.eventId);
      (cita as any).google_event_id = event.eventId;
      (cita as any).google_html_link = event.htmlLink;
    }
  } catch (err: any) {
    console.error("Calendar:createEvent error:", err?.message);
  }

  return cita;
}

export async function rescheduleByName(nombre: string, raw: unknown) {
  const data = RescheduleInput.parse(raw);
  const p = await pacientes.getByName(nombre);

  // 1) Obtener próximas citas activas del paciente
  const futuras = await citasRepo.getUpcomingActiveByPaciente(p.id);
  if (!futuras.length) {
    throw new Error(`No hay citas activas próximas para ${p.nombre_completo}.`);
  }

  // Desambiguación si hay varias
  let target = futuras[0];
  if (futuras.length > 1 && !data.fecha) {
    throw new Error(`MISSING_FIELD:fecha -> ${p.nombre_completo} tiene múltiples citas próximas. Indicá la fecha de la que querés mover.`);
  }
  if (futuras.length > 1 && data.fecha) {
    // intentar matchear por prefijo de fecha (YYYY-MM-DD HH:mm)
    const pref = String(data.fecha).slice(0, 16);
    const found = futuras.find(c => String(c.fecha).startsWith(pref));
    if (found) target = found;
  }

  const motivo = (data.motivo && data.motivo.trim()) ? data.motivo.trim() : (target.motivo || "seguimiento");
  const nuevaFechaMySQL = parseFechaToMySQL(String(data.nueva_fecha));

  // resolver duración
  let duracionMin = typeof data.duracion_min === "number" ? data.duracion_min : undefined;
  if (duracionMin == null) {
    const cfg = await configService.get("appointment_default_duration_minutes", 0);
    const parsed = Number.parseInt(String(cfg ?? "50"), 10);
    duracionMin = Number.isFinite(parsed) && parsed > 0 ? parsed : 50;
  }

  // validar conflicto en destino
  const libre = await isSlotFree(nuevaFechaMySQL, duracionMin);
  if (!libre) {
    const ev = await getConflictEvent(nuevaFechaMySQL, duracionMin);
    const detalle = ev
      ? `Ocupado por "${ev.summary || "evento"}" de ${ev.start} a ${ev.end}${ev.htmlLink ? ` (ver: ${ev.htmlLink})` : ""}.`
      : "Ocupado por otro evento.";
    throw new Error(`CONFLICTO_HORARIO: ${detalle}`);
  }

  // 2) Actualizar en Google Calendar (si existe), o crear si no tiene eventId
  let eventId = (target as any).google_event_id as string | null;
  try {
    if (eventId) {
      const upd = await updateEventForCita({
        eventId,
        pacienteNombre: p.nombre_completo,
        motivo,
        fechaMySQL: nuevaFechaMySQL,
        duracionMin,
      });
      eventId = upd.eventId;
    } else {
      const created = await createEventForCita({
        pacienteNombre: p.nombre_completo,
        motivo,
        fechaMySQL: nuevaFechaMySQL,
        duracionMin,
      });
      eventId = created?.eventId || null;
    }
  } catch (err: any) {
    console.error("Calendar:updateEvent error:", err?.message);
  }

  // 3) Actualizar BD
  await citasRepo.updateFechaMotivo(target.id, { fecha: nuevaFechaMySQL, motivo });
  await citasRepo.setGoogleEventId(target.id, eventId || null);

  return { ok: true, message: `Cita reprogramada para ${nuevaFechaMySQL}.`, cita_id: target.id };
}

export async function cancelByName(nombre: string, raw: unknown) {
  const data = CancelInput.parse(raw);
  const p = await pacientes.getByName(nombre);

  const futuras = await citasRepo.getUpcomingActiveByPaciente(p.id);
  if (!futuras.length) throw new Error(`No hay citas activas próximas para ${p.nombre_completo}.`);

  let target = futuras[0];
  if (futuras.length > 1 && !data.fecha) {
    throw new Error(`MISSING_FIELD:fecha -> ${p.nombre_completo} tiene múltiples citas próximas. Indicá la fecha de la que querés cancelar.`);
  }
  if (futuras.length > 1 && data.fecha) {
    const pref = String(data.fecha).slice(0, 16);
    const found = futuras.find(c => String(c.fecha).startsWith(pref));
    if (found) target = found;
  }

  // Eliminar evento en Google si existe (no romper si falla)
  if ((target as any).google_event_id) {
    try {
      await deleteEventForCita((target as any).google_event_id);
    } catch (err: any) {
      console.error("Calendar:deleteEvent error:", err?.message);
    }
  }

  // Baja lógica en BD
  await citasRepo.cancelById(target.id);

  return { ok: true, message: `Cita cancelada para ${p.nombre_completo} (${target.fecha}).`, cita_id: target.id };
}