import * as dashboardRepo from "../repos/dashboard.repo";

type Filters = { from?: string; to?: string; estado?: string };
const TZ = process.env.DEFAULT_TZ || "America/Guatemala";
function toLocalYMD(value: any) {
  if (!value) return value;
  const d = new Date(String(value));
  if (isNaN(d.getTime())) return String(value);
  const y = d.toLocaleString("en-CA", { timeZone: TZ, year: "numeric" });
  const m = d.toLocaleString("en-CA", { timeZone: TZ, month: "2-digit" });
  const day = d.toLocaleString("en-CA", { timeZone: TZ, day: "2-digit" });
  return `${y}-${m}-${day}`;
}

function pad2(n: number) { return String(n).padStart(2, "0"); }
function monthRangeDefaultTZ() {
  const now = new Date();
  // Current date in TZ to find month/year in that TZ
  const y = Number(now.toLocaleString("en-CA", { timeZone: TZ, year: "numeric" }));
  const m = Number(now.toLocaleString("en-CA", { timeZone: TZ, month: "2-digit" }));
  const firstDayThis = `${y}-${pad2(m)}-01`;
  // First day next month
  const nextY = m === 12 ? y + 1 : y;
  const nextM = m === 12 ? 1 : m + 1;
  const firstDayNext = `${nextY}-${pad2(nextM)}-01`;
  return { from: firstDayThis, to: firstDayNext };
}

function eachDayYMD(fromYMD: string, toYMD: string): string[] {
  const out: string[] = [];
  const [fy, fm, fd] = fromYMD.split("-").map(Number);
  const [ty, tm, td] = toYMD.split("-").map(Number);
  const start = new Date(Date.UTC(fy, fm - 1, fd));
  const end = new Date(Date.UTC(ty, tm - 1, td)); // exclusive
  for (let d = start; d < end; d = new Date(d.getTime() + 86400000)) {
    out.push(`${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`);
  }
  return out;
}

export async function getDashboardData(filters?: Filters) {
  const baseRange = (filters?.from || filters?.to) ? {
    from: filters?.from,
    to: filters?.to,
  } : monthRangeDefaultTZ();
  const fromYMD = baseRange.from || monthRangeDefaultTZ().from;
  const toYMD = baseRange.to || monthRangeDefaultTZ().to;

  const [
    pacientesActivos,
    citasFuturas,
    citasCanceladas,
    notas,
    pacientesNuevos,
    apptByDayRaw,
    apptByStatusRaw,
    patientsByStateRaw,
  ] = await Promise.all([
    dashboardRepo.getTotalPacientesActivos(filters),
    dashboardRepo.getTotalCitasFuturas(filters),
    dashboardRepo.getCitasCanceladas(filters),
    dashboardRepo.getNotasCount(filters),
    dashboardRepo.getPacientesNuevos(filters),
    dashboardRepo.getAppointmentsByDay(filters),
    dashboardRepo.getAppointmentsByStatus(filters),
    dashboardRepo.getPatientsByState(), // global
  ]);

  // Normalizar nombres para que el frontend pinte fácil
  const apptByDay = (apptByDayRaw || []).map((r: any) => ({
    date: toLocalYMD(r.date || r.dia || r.day),
    count: Number(r.count ?? r.total ?? 0),
  }));

  // Indexar por día y completar días vacíos en rango [from, to)
  const dayMap = new Map<string, number>();
  for (const row of apptByDay) {
    if (!row.date) continue;
    dayMap.set(row.date, (dayMap.get(row.date) || 0) + Number(row.count || 0));
  }
  const allDays = eachDayYMD(fromYMD, toYMD);
  const appointmentsByDay = allDays.map(d => ({ date: d, count: dayMap.get(d) || 0 }));

  const appointmentsByStatus = (apptByStatusRaw || []).map((r: any) => ({
    status: r.status || r.estado,
    count: Number(r.count ?? r.total ?? 0),
  }));

  const patientsByState = (patientsByStateRaw || []).map((r: any) => ({
    state: r.state || r.estado,
    count: Number(r.count ?? r.total ?? 0),
  }));

  return {
    range: { from: fromYMD, to: toYMD, tz: TZ },
    kpis: {
      pacientesActivos,
      citasFuturas,
      citasCanceladas,
      notas,
      pacientesNuevos,
    },
    charts: {
      appointmentsByDay,
      appointmentsByStatus,
      patientsByState,
    },
  };
}   