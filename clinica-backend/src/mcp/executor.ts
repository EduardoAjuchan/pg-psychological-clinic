import { MCPRequest } from "../lib/schemas";
import * as pacientes from "../services/pacientes.service";
import * as citas from "../services/citas.service";

export async function mcpExecutor(payload: unknown, sess: any) {
  const req = MCPRequest.parse(payload);

  switch (req.action) {
    case "create_patient": {
      const p = await pacientes.create(req.data);
      sess.pacienteActivo = { id: p.id, nombre: p.nombre_completo };
      const wasExisting = (p as any)?.alreadyExisted === true;
      return {
        ok: true,
        message: wasExisting ? "Paciente ya existía; quedó como activo." : "Paciente creado",
        data: { paciente_id: p.id, nombre: p.nombre_completo, alreadyExisted: wasExisting }
      };
    }

    case "schedule_appointment": {
      const nombre = req.data?.nombre ?? sess?.pacienteActivo?.nombre;

      if (!nombre) {
        sess.pendingAction = "schedule_appointment";
        sess.pendingArgs = { ...(req.data || {}) };
        sess.pendingMissing = ["nombre"];
        sess.pendingSince = Date.now();
        return { ok: false, code: "MISSING_FIELD", missing: ["nombre"], message: "¿De qué paciente es la cita?" };
      }

      const c = await citas.scheduleByName(nombre, req.data);

      sess.pendingAction = null;
      sess.pendingArgs = null;
      sess.pendingMissing = null;
      sess.pendingSince = null;

      // Normalizamos respuesta
      sess.pacienteActivo = { nombre };
      return { ok: true, message: c?.message || "Cita agendada", data: { cita_id: c?.id ?? c?.cita_id, fecha: c?.fecha } };
    }

    case "reschedule_appointment": {
      const nombre = req.data?.nombre ?? sess?.pacienteActivo?.nombre;
      if (!nombre) {
        sess.pendingAction = "reschedule_appointment";
        sess.pendingArgs = { ...(req.data || {}) };
        sess.pendingMissing = ["nombre"];
        sess.pendingSince = Date.now();
        return { ok: false, code: "MISSING_FIELD", missing: ["nombre"], message: "¿De qué paciente querés reprogramar la cita?" };
      }
      if (!req.data?.nueva_fecha) {
        sess.pendingAction = "reschedule_appointment";
        sess.pendingArgs = { ...(req.data || {}), nombre };
        sess.pendingMissing = ["nueva_fecha"];
        sess.pendingSince = Date.now();
        return { ok: false, code: "MISSING_FIELD", missing: ["nueva_fecha"], message: "¿Para cuándo querés moverla? (YYYY-MM-DD HH:mm)" };
      }

      const r = await citas.rescheduleByName(nombre, req.data);

      sess.pendingAction = null;
      sess.pendingArgs = null;
      sess.pendingMissing = null;
      sess.pendingSince = null;

      sess.pacienteActivo = { nombre };
      return { ok: true, message: r?.message || `Cita reprogramada para ${req.data?.nueva_fecha}.`, data: { cita_id: r?.cita_id } };
    }

    case "cancel_appointment": {
      const nombre = req.data?.nombre ?? sess?.pacienteActivo?.nombre;
      if (!nombre) {
        sess.pendingAction = "cancel_appointment";
        sess.pendingArgs = { ...(req.data || {}) };
        sess.pendingMissing = ["nombre"];
        sess.pendingSince = Date.now();
        return { ok: false, code: "MISSING_FIELD", missing: ["nombre"], message: "¿A qué paciente le cancelamos la cita?" };
      }

      const r = await citas.cancelByName(nombre, req.data);

      sess.pendingAction = null;
      sess.pendingArgs = null;
      sess.pendingMissing = null;
      sess.pendingSince = null;

      sess.pacienteActivo = { nombre };
      return { ok: true, message: r?.message || "Cita cancelada.", data: { cita_id: r?.cita_id } };
    }

    default:
      return { ok: false, message: "Acción no reconocida" };
  }
}