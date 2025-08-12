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
            motivo: { type: "string", description: "Opcional. Por defecto 'seguimiento'." }
          },
          required: ["fecha"]
        }
      }
    }
  ] as const;
}