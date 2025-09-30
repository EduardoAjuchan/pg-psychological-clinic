import * as configService from "../services/config.service";

/**
 * Carga las descripciones de las tools desde la BD (tabla `configuracion`).
 * Claves sugeridas:
 *  - tool.create_patient.description
 *  - tool.schedule_appointment.description
 * Si no existen, usa fallbacks sensatos.
 */
export async function getTools() {
  const createDesc = (await configService.get("tool.create_patient.description"))
    || "Crea un paciente con estado_proceso 'iniciado'.";

  const scheduleDesc = (await configService.get("tool.schedule_appointment.description"))
    || "Agenda una cita para un paciente. NO requiere teléfono. Si no hay motivo, usar 'seguimiento'. La fecha puede venir en lenguaje natural ('jueves 3pm') o ISO; el backend la normaliza a DATETIME MySQL (UTC-6).";

  const rescheduleDesc = (await configService.get("tool.reschedule_appointment.description"))
    || "Reprograma una cita de un paciente existente. Palabras clave: reprogramar, cambiar, mover. Si la fecha no trae año, asumir el año actual. Si el paciente tiene varias citas activas próximas, el backend pedirá la fecha original para desambiguar.";

  const cancelDesc = (await configService.get("tool.cancel_appointment.description"))
    || "Cancela (lógicamente) una cita de un paciente y elimina el evento en Google Calendar. Palabras clave: cancelar, anular. Si hay varias próximas activas, el backend pedirá fecha para desambiguar.";

  return [
    {
      type: "function",
      function: {
        name: "create_patient",
        description: createDesc,
        parameters: {
          type: "object",
          properties: {
            nombre_completo: { type: "string" },
            alias: { type: "string" },
            telefono: { type: "string" },
            genero: { type: "string", enum: ["masculino","femenino","otro","no_especificado"] },
            motivo_consulta: { type: "string" }
          },
          required: ["nombre_completo"]
        }
      }
    },
    {
      type: "function",
      function: {
        name: "schedule_appointment",
        description: scheduleDesc,
        parameters: {
          type: "object",
          properties: {
            nombre: { type: "string", description: "Si falta, usar pacienteActivo." },
            fecha:  { type: "string", description: "Texto natural (p. ej. 'jueves 3pm') o ISO (YYYY-MM-DD HH:mm)." },
            motivo: { type: "string", description: "Opcional. Por defecto 'seguimiento'." },
            duracion_min: { type: "number", description: "Opcional. Duración en minutos. Si falta, usar configuración 'appointment_default_duration_minutes'." }
          },
          required: ["fecha"]
        }
      }
    }
    ,
    {
      type: "function",
      function: {
        name: "reschedule_appointment",
        description: rescheduleDesc,
        parameters: {
          type: "object",
          properties: {
            nombre: { type: "string", description: "Nombre del paciente. Si falta, usar pacienteActivo." },
            nueva_fecha: { type: "string", description: "Fecha/horario destino en lenguaje natural o ISO (YYYY-MM-DD HH:mm). Si no trae año, asumir el actual." },
            motivo: { type: "string", description: "Opcional. Nuevo motivo si cambió; si no, mantener." },
            duracion_min: { type: "number", description: "Opcional. Duración en minutos; si falta, usar configuración 'appointment_default_duration_minutes'." }
          },
          required: ["nueva_fecha"]
        }
      }
    }
    ,
    {
      type: "function",
      function: {
        name: "cancel_appointment",
        description: cancelDesc,
        parameters: {
          type: "object",
          properties: {
            nombre: { type: "string", description: "Nombre del paciente. Si falta, usar pacienteActivo." },
            fecha: { type: "string", description: "Opcional. Fecha de la cita a cancelar si el paciente tiene múltiples citas próximas; puede ser lenguaje natural o ISO." }
          },
          required: []
        }
      }
    }
  ] as const;
}
