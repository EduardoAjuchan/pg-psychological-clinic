import { insertCalendarEvent, getAuthorizedClient } from "../lib/google";
import * as configService from "../services/config.service";

// Guatemala no tiene DST; offset fijo -06:00
const GUATEMALA_OFFSET = "-06:00";
function toRFC3339WithOffset(isoLocal: string, offset = GUATEMALA_OFFSET) {
  // isoLocal: "YYYY-MM-DDTHH:mm:ss"  ->  "YYYY-MM-DDTHH:mm:ss-06:00"
  return `${isoLocal}${offset}`;
}

function rfcToMySQLLike(dt: string | undefined): string | undefined {
  if (!dt) return dt;
  let s = dt;
  if (s.includes("T")) {
    s = s.replace("T", " ");
    // remover zona: Z o ±HH:MM
    s = s.replace(/([+-]\d{2}:\d{2}|Z)$/i, "");
    if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}$/.test(s)) s += ":00";
    return s;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s + " 00:00:00";
  return s;
}

// Convierte "YYYY-MM-DD HH:mm:00" -> "YYYY-MM-DDTHH:mm:00"
function mysqlToLocalISO(dt: string) {
  return dt.replace(" ", "T");
}

// Suma minutos en "espacio local" sin convertir a UTC
function addMinutesLocalSafe(isoLocal: string, minutes: number) {
  // isoLocal: "YYYY-MM-DDTHH:mm:ss" (sin zona)
  const [datePart, timePart] = isoLocal.split("T");
  const [Y, M, D] = datePart.split("-").map(Number);
  const [h, m, s] = timePart.split(":").map(Number);

  let total = h * 60 + m + minutes;
  let daysCarry = Math.floor(total / (24 * 60));
  total = total % (24 * 60);
  if (total < 0) { total += 24 * 60; daysCarry -= 1; }
  const nh = Math.floor(total / 60);
  const nmin = total % 60;

  // ajustar la fecha por daysCarry en local time
  const base = new Date(Y, M - 1, D);
  base.setDate(base.getDate() + daysCarry);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${base.getFullYear()}-${pad(base.getMonth() + 1)}-${pad(base.getDate())}T${pad(nh)}:${pad(nmin)}:${pad(s || 0)}`;
}

export async function ensureGoogleReady() {
  // valida que exista tokens y calendar id
  const tokens = await configService.get("google_tokens_json");
  if (!tokens) throw new Error("Google Calendar no está conectado. Ve a /api/google/connect");
  const calId = await configService.get("google_calendar_id");
  if (!calId) throw new Error("Falta 'google_calendar_id' en configuración.");
  return { calId };
}

export async function isSlotFree(fechaMySQL: string, duracionMin: number) {
  await ensureGoogleReady();
  const auth = await getAuthorizedClient();
  const calendar = (await import("googleapis")).google.calendar({ version: "v3", auth });
  const calId = (await configService.get("google_calendar_id")) || "primary";

  const startISO = mysqlToLocalISO(fechaMySQL);               // "YYYY-MM-DDTHH:mm:00"
  const endISO   = addMinutesLocalSafe(startISO, duracionMin); // "YYYY-MM-DDTHH:mm:ss"
  const timeMin = toRFC3339WithOffset(startISO);              // RFC3339 con offset -06:00
  const timeMax = toRFC3339WithOffset(endISO);

  const res = await calendar.events.list({
    calendarId: calId,
    timeMin,
    timeMax,
    singleEvents: true,
    orderBy: "startTime",
    maxResults: 1
  });

  const items = res.data.items || [];
  return items.length === 0;
}

export async function getConflictEvent(fechaMySQL: string, duracionMin: number) {
  await ensureGoogleReady();
  const auth = await getAuthorizedClient();
  const calendar = (await import("googleapis")).google.calendar({ version: "v3", auth });
  const calId = (await configService.get("google_calendar_id")) || "primary";

  const startISO = mysqlToLocalISO(fechaMySQL);
  const endISO   = addMinutesLocalSafe(startISO, duracionMin);
  const timeMin = toRFC3339WithOffset(startISO);
  const timeMax = toRFC3339WithOffset(endISO);

  const res = await calendar.events.list({
    calendarId: calId,
    timeMin,
    timeMax,
    singleEvents: true,
    orderBy: "startTime",
    maxResults: 1
  });

  const items = res.data.items || [];
  if (!items.length) return null;
  const ev = items[0];
  const start = rfcToMySQLLike((ev.start?.dateTime ?? ev.start?.date) as string | undefined);
  const end   = rfcToMySQLLike((ev.end?.dateTime   ?? ev.end?.date)   as string | undefined);
  return {
    id: ev.id,
    summary: ev.summary,
    start,
    end,
    htmlLink: ev.htmlLink,
  };
}

export async function createEventForCita(opts: {
  pacienteNombre: string;
  motivo: string;
  fechaMySQL: string;      // "YYYY-MM-DD HH:mm:00"
  duracionMin?: number;    // default 50
}) {
  await ensureGoogleReady();
  const timeZone = process.env.DEFAULT_TZ || "America/Guatemala";
  const startISO = mysqlToLocalISO(opts.fechaMySQL); // "YYYY-MM-DDTHH:mm:00"
  // Duración: si no viene, leemos de configuración
  let dur = typeof opts.duracionMin === "number" ? opts.duracionMin : undefined;
  if (dur == null) {
    const cfg = await configService.get("appointment_default_duration_minutes", 0);
    const parsed = Number.parseInt(String(cfg ?? "50"), 10);
    dur = Number.isFinite(parsed) && parsed > 0 ? parsed : 50;
  }
  const endISO = addMinutesLocalSafe(startISO, dur);

  // Usa helper insertCalendarEvent (lib/google.ts)
  const event = await insertCalendarEvent({
    summary: `Sesión con ${opts.pacienteNombre}`,
    description: `Motivo: ${opts.motivo}`,
    startDateTimeISO: startISO,
    endDateTimeISO: endISO,
    timeZone
  });

  return { eventId: event.id as string, htmlLink: event.htmlLink as string | undefined };
}

export async function updateEventForCita(opts: {
  eventId: string;
  pacienteNombre?: string;
  motivo?: string;
  fechaMySQL: string;     // nueva fecha
  duracionMin?: number;
}) {
  await ensureGoogleReady();
  const auth = await getAuthorizedClient();
  const calendar = (await import("googleapis")).google.calendar({ version: "v3", auth });
  const calId = (await configService.get("google_calendar_id")) || "primary";
  const timeZone = process.env.DEFAULT_TZ || "America/Guatemala";

  const startISO = mysqlToLocalISO(opts.fechaMySQL);
  // Duración: si no viene, leemos de configuración
  let dur = typeof opts.duracionMin === "number" ? opts.duracionMin : undefined;
  if (dur == null) {
    const cfg = await configService.get("appointment_default_duration_minutes", 0);
    const parsed = Number.parseInt(String(cfg ?? "50"), 10);
    dur = Number.isFinite(parsed) && parsed > 0 ? parsed : 50;
  }
  const endISO = addMinutesLocalSafe(startISO, dur);

  const summary = opts.pacienteNombre ? `Sesión con ${opts.pacienteNombre}` : undefined;
  const description = opts.motivo ? `Motivo: ${opts.motivo}` : undefined;

  const res = await calendar.events.patch({
    calendarId: calId,
    eventId: opts.eventId,
    requestBody: {
      ...(summary ? { summary } : {}),
      ...(description ? { description } : {}),
      start: { dateTime: toRFC3339WithOffset(startISO), timeZone },
      end:   { dateTime: toRFC3339WithOffset(endISO),   timeZone },
    }
  });

  return { eventId: res.data.id as string, htmlLink: res.data.htmlLink as string | undefined };
}

export async function deleteEventForCita(eventId: string) {
  await ensureGoogleReady();
  const auth = await getAuthorizedClient();
  const calendar = (await import("googleapis")).google.calendar({ version: "v3", auth });
  const calId = (await configService.get("google_calendar_id")) || "primary";
  await calendar.events.delete({ calendarId: calId, eventId });
}