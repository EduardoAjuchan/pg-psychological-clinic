import { MCPRequest } from "../lib/schemas";
import * as pacientes from "../services/pacientes.service";
import * as citas from "../services/citas.service";

export async function mcpExecutor(payload: unknown, sess: any) {
  const req = MCPRequest.parse(payload);

  switch (req.action) {
    case "create_patient": {
      const p = await pacientes.create(req.data);
      sess.pacienteActivo = { id: p.id, nombre: p.nombre_completo };
      return { ok: true, message: "Paciente creado", data: { paciente_id: p.id, nombre: p.nombre_completo } };
    }

    case "schedule_appointment": {
      const nombre = req.data?.nombre ?? sess?.pacienteActivo?.nombre;

      // Si falta el nombre, dejamos la acción pendiente para completar luego
      if (!nombre) {
        sess.pendingAction = "schedule_appointment";
        sess.pendingArgs = { ...(req.data || {}) }; // por ejemplo, { fecha, motivo }
        sess.pendingMissing = ["nombre"];
        sess.pendingSince = Date.now();

        return {
          ok: false,
          code: "MISSING_FIELD",
          missing: ["nombre"],
          message: "¿De qué paciente es la cita?"
        };
      }

      // Ejecutar la acción normalmente
      const c = await citas.scheduleByName(nombre, req.data);

      // Limpiar pendientes porque ya se completó
      sess.pendingAction = null;
      sess.pendingArgs = null;
      sess.pendingMissing = null;
      sess.pendingSince = null;

      return { ok: true, message: "Cita agendada", data: { cita_id: c.id, fecha: c.fecha } };
    }

    default:
      return { ok: false, message: "Acción no reconocida" };
  }
}