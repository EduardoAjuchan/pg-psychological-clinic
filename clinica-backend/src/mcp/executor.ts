import { MCPRequest } from "../lib/schemas";
import * as pacientes from "../services/pacientes.service";
import * as citas from "../services/citas.service";
import * as notas from "../services/notas.service";
import * as ia from "../services/ia.service";

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

    case "update_patient": {
      const id = (req.data as any)?.id as number | undefined;
      let targetId = id;
      if (!targetId) {
        const nombre = (req.data as any)?.nombre ?? sess?.pacienteActivo?.nombre;
        if (!nombre) {
          return { ok: false, code: "MISSING_FIELD", missing: ["nombre|id"], message: "¿A qué paciente querés editar? (id o nombre)" };
        }
        const p = await pacientes.getByName(nombre);
        targetId = p.id;
      }

      const updates = {
        nombre_completo: (req.data as any)?.nombre_completo,
        alias: (req.data as any)?.alias,
        telefono: (req.data as any)?.telefono,
        genero: (req.data as any)?.genero,
        motivo_consulta: (req.data as any)?.motivo_consulta,
        estado_proceso: (req.data as any)?.estado_proceso,
      } as any;

      const out = await pacientes.update(targetId!, updates);
      // actualizar contexto activo
      sess.pacienteActivo = { id: out.id, nombre: out.nombre_completo };
      return { ok: true, message: `Paciente actualizado: ${out.nombre_completo}.`, paciente: out };
    }

    case "deactivate_patient": {
      const id = (req.data as any)?.id as number | undefined;
      let targetId = id;
      if (!targetId) {
        const nombre = (req.data as any)?.nombre ?? sess?.pacienteActivo?.nombre;
        if (!nombre) {
          return { ok: false, code: "MISSING_FIELD", missing: ["nombre|id"], message: "¿A quién querés desactivar? (id o nombre)" };
        }
        const p = await pacientes.getByName(nombre);
        targetId = p.id;
      }

      const out = await pacientes.removeLogical(targetId!);
      // limpiar contexto si corresponde
      if (sess?.pacienteActivo?.id === targetId) {
        delete sess.pacienteActivo;
      }
      return { ok: true, message: `Paciente desactivado (id=${out.id}).`, result: out };
    }

    case "list_patients": {
      // Forzar estado por defecto = 'activo' salvo que explícitamente pidan 'inactivo'
      let estado = (req.data as any)?.estado;
      if (estado !== "inactivo") estado = "activo";

      const params = {
        q: (req.data as any)?.q,
        estado,
        limit: (req.data as any)?.limit,
        offset: (req.data as any)?.offset,
      } as any;

      const out = await pacientes.list(params);
      return {
        ok: true,
        message: out.total
          ? `Se encontraron ${out.total} pacientes ${estado}s.`
          : `No hay pacientes ${estado}s para los filtros indicados.`,
        ...out,
      };
    }

    case "get_patient_details": {
      const id = (req.data as any)?.id as number | undefined;
      let targetId = id;
      if (!targetId) {
        const nombre = (req.data as any)?.nombre ?? sess?.pacienteActivo?.nombre;
        if (!nombre) {
          return { ok: false, code: "MISSING_FIELD", missing: ["nombre|id"], message: "Necesito el id o el nombre del paciente." };
        }
        const p = await pacientes.getByName(nombre);
        targetId = p.id;
      }
      const notasLimit = (req.data as any)?.notas_limit ?? 20;
      const notasOffset = (req.data as any)?.notas_offset ?? 0;
      const out = await pacientes.getDetails(targetId!, { notasLimit, notasOffset });
      // set contexto activo por conveniencia
      sess.pacienteActivo = { id: out.paciente.id, nombre: out.paciente.nombre_completo };
      return { ok: true, message: `Detalle de ${out.paciente.nombre_completo}.`, ...out };
    }

    case "create_session_entry": {
      // Resolver paciente por nombre (o contexto) o por id; si falta, pedir nombre
      const nombre = (req.data as any)?.nombre ?? sess?.pacienteActivo?.nombre;
      const pacienteId = (req.data as any)?.paciente_id as number | undefined;

      if (!nombre && !pacienteId) {
        sess.pendingAction = "create_session_entry";
        sess.pendingArgs = { ...(req.data || {}) };
        // Para compatibilidad con el slot-filling actual, pedimos específicamente el nombre
        sess.pendingMissing = ["nombre"];
        sess.pendingSince = Date.now();
        return { ok: false, code: "MISSING_FIELD", missing: ["nombre"], message: "¿De qué paciente es la nota? Decime el nombre." };
      }

      const created = await notas.createByRef(req.data, pacienteId, undefined);

      // Actualizar contexto si tenemos nombre
      if (nombre) {
        sess.pacienteActivo = { ...(sess.pacienteActivo || {}), nombre };
      }

      return { ok: true, message: `Nota de sesión creada (id=${created.id}).`, nota: created };
    }

    case "list_session_entries": {
      // Identificar paciente por id o nombre (o contexto)
      const nombre = (req.data as any)?.nombre ?? sess?.pacienteActivo?.nombre;
      const pacienteId = (req.data as any)?.paciente_id as number | undefined;
      if (!nombre && !pacienteId) {
        sess.pendingAction = "list_session_entries";
        sess.pendingArgs = { ...(req.data || {}) };
        sess.pendingMissing = ["nombre"];
        sess.pendingSince = Date.now();
        return { ok: false, code: "MISSING_FIELD", missing: ["nombre"], message: "¿De qué paciente querés ver las notas? Decime el nombre." };
      }

      // Si vino id lo usamos directo; si vino nombre, el servicio lo resuelve internamente
      const estado = (req.data as any)?.estado ?? "activo"; // 'activo' | 'inactivo' | 'todos'
      const limit = (req.data as any)?.limit ?? 20;
      const offset = (req.data as any)?.offset ?? 0;

      // Para obtener el id cuando tenemos nombre, reutilizamos pacientes.getByName (consistente con el resto del sistema)
      let targetId = pacienteId;
      if (!targetId && nombre) {
        const p = await pacientes.getByName(nombre);
        targetId = p.id;
      }

      const out = await notas.listByPaciente(targetId!, { estado, limit, offset } as any);

      // Setear contexto por conveniencia
      if (nombre) {
        sess.pacienteActivo = { ...(sess.pacienteActivo || {}), nombre };
      }

      const qty = out.total ?? (out.items?.length || 0);
      const estadoTxt = estado === 'todos' ? 'activos e inactivos' : `${estado}s`;
      const msg = qty
        ? `Se encontraron ${qty} notas ${estadoTxt} para el paciente.`
        : `No hay notas ${estadoTxt} para el paciente.`;

      return { ok: true, message: msg, ...out };
    }

    case "suggest_diagnosis": {
      const nombre = (req.data as any)?.nombre ?? sess?.pacienteActivo?.nombre;
      const pacienteId = (req.data as any)?.paciente_id as number | undefined;

      if (!nombre && !pacienteId) {
        sess.pendingAction = "suggest_diagnosis";
        sess.pendingArgs = { ...(req.data || {}) };
        sess.pendingMissing = ["nombre"];
        sess.pendingSince = Date.now();
        return { ok: false, code: "MISSING_FIELD", missing: ["nombre"], message: "¿De qué paciente querés el posible diagnóstico? Decime el nombre." };
      }

      let targetId = pacienteId;
      if (!targetId && nombre) {
        const p = await pacientes.getByName(nombre);
        targetId = p.id;
      }

      const content = await ia.suggestDiagnosisByPatientId(targetId!);

      if (nombre) {
        sess.pacienteActivo = { ...(sess.pacienteActivo || {}), nombre };
      }

      return { ok: true, message: content };
    }

    case "suggest_techniques": {
      const nombre = (req.data as any)?.nombre ?? sess?.pacienteActivo?.nombre;
      const pacienteId = (req.data as any)?.paciente_id as number | undefined;

      if (!nombre && !pacienteId) {
        sess.pendingAction = "suggest_techniques";
        sess.pendingArgs = { ...(req.data || {}) };
        sess.pendingMissing = ["nombre"];
        sess.pendingSince = Date.now();
        return { ok: false, code: "MISSING_FIELD", missing: ["nombre"], message: "¿Para qué paciente querés recomendaciones de técnicas? Decime el nombre." };
      }

      let targetId = pacienteId;
      if (!targetId && nombre) {
        const p = await pacientes.getByName(nombre);
        targetId = p.id;
      }

      const content = await ia.suggestTechniquesByPatientId(targetId!);

      if (nombre) {
        sess.pacienteActivo = { ...(sess.pacienteActivo || {}), nombre };
      }

      return { ok: true, message: content };
    }

    default:
      return { ok: false, message: "Acción no reconocida" };
  }
}