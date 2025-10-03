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

  const updatePatientDesc = (await configService.get("tool.update_patient.description"))
    || "Edita datos de un paciente. Si no se pasa id, usar 'nombre' o pacienteActivo. Campos opcionales: nombre_completo, alias, telefono, genero, motivo_consulta, estado_proceso.";

  const deactivatePatientDesc = (await configService.get("tool.deactivate_patient.description"))
    || "Elimina lógicamente (estado='inactivo') un paciente. Usar id o nombre (o pacienteActivo).";

  const listPatientsDesc = (await configService.get("tool.list_patients.description"))
    || "Lista pacientes. Filtros: q (búsqueda normalizada), estado ('activo'|'inactivo'), paginación (limit, offset).";

  const getPatientDetailsDesc = (await configService.get("tool.get_patient_details.description"))
    || "Detalle del paciente más historial de notas activas. Usar id o nombre (o pacienteActivo). Parámetros de notas: notas_limit, notas_offset.";

  const createSessionEntryDesc = (await configService.get("tool.create_session_entry.description"))
    || "Crea una nota de sesión para un paciente existente. Extrae campos desde lenguaje natural con estas reglas: \n- sintomas: experiencias subjetivas (insomnio, palpitaciones, tensión, etc.); evita diagnósticos aquí.\n- padecimientos: antecedentes/condiciones médicas (diabetes, hipertensión, migraña, etc.).\n- notas_importantes: recordatorios/plan de intervención/seguimiento (p. ej., higiene del sueño, adherencia al tratamiento).\n- trastornos: nombres de trastornos o hipótesis clínicas (TAG, depresión leve, trastorno adaptativo, etc.).\n- afectamientos_subyacentes: factores contextuales externos que influyen (familia, trabajo, economía, pareja).\n- diagnostico: diagnóstico clínico preliminar o sugerido; no dupliques con sintomas.\nNo inventes datos. No dejes campos vacíos si hay evidencia en el texto; si no hay información, omite el campo (no envíes string vacío). Devuelve cada campo como texto conciso (frases separadas por comas si aplica), sin etiquetas ni formato. Usa 'nombre' o 'paciente_id' (o pacienteActivo). 'fecha' es opcional; si no viene, usar la actual.";

  const listSessionEntriesDesc = (await configService.get("tool.list_session_entries.description"))
    || "Lista notas de sesión de un paciente. Identificar por id o nombre (o pacienteActivo). Filtros: estado ('activo'|'inactivo'|'todos'), paginación (limit, offset).";

  const suggestDxDesc = (await configService.get("tool.suggest_diagnosis.description"))
    || "Genera hipótesis diagnósticas diferenciales y un diagnóstico principal sugerido basándose en motivo de consulta e historial de notas. Usa nombre o paciente_id (o pacienteActivo).";

  const suggestTechDesc = (await configService.get("tool.suggest_techniques.description"))
    || "Genera técnicas/intervenciones recomendadas, objetivos y mini plan de sesiones basándose en motivo de consulta e historial de notas. Usa nombre o paciente_id (o pacienteActivo).";

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
    ,
    {
      type: "function",
      function: {
        name: "update_patient",
        description: updatePatientDesc,
        parameters: {
          type: "object",
          properties: {
            id: { type: "number", description: "ID del paciente si se conoce." },
            nombre: { type: "string", description: "Nombre del paciente si no hay ID. Si falta, usar pacienteActivo." },
            nombre_completo: { type: "string" },
            alias: { type: "string" },
            telefono: { type: "string" },
            genero: { type: "string", enum: ["masculino","femenino","otro","no_especificado"] },
            motivo_consulta: { type: "string" },
            estado_proceso: { type: "string", enum: ["iniciado","en_pausa","finalizado"] }
          },
          required: []
        }
      }
    }
    ,
    {
      type: "function",
      function: {
        name: "deactivate_patient",
        description: deactivatePatientDesc,
        parameters: {
          type: "object",
          properties: {
            id: { type: "number" },
            nombre: { type: "string", description: "Si falta id, usar nombre; si falta, usar pacienteActivo." }
          },
          required: []
        }
      }
    }
    ,
    {
      type: "function",
      function: {
        name: "list_patients",
        description: listPatientsDesc,
        parameters: {
          type: "object",
          properties: {
            q: { type: "string" },
            estado: { type: "string", enum: ["activo","inactivo"] },
            limit: { type: "number" },
            offset: { type: "number" }
          },
          required: []
        }
      }
    }
    ,
    {
      type: "function",
      function: {
        name: "get_patient_details",
        description: getPatientDetailsDesc,
        parameters: {
          type: "object",
          properties: {
            id: { type: "number" },
            nombre: { type: "string" },
            notas_limit: { type: "number" },
            notas_offset: { type: "number" }
          },
          required: []
        }
      }
    }
    ,
    {
      type: "function",
      function: {
        name: "create_session_entry",
        description: createSessionEntryDesc,
        parameters: {
          type: "object",
          properties: {
            nombre: { type: "string", description: "Nombre del paciente. Si falta, usar pacienteActivo o paciente_id." },
            paciente_id: { type: "number", description: "ID del paciente (opcional si se usa nombre o contexto)." },
            fecha: { type: "string", description: "Opcional. Fecha/hora de la nota (ISO o YYYY-MM-DD HH:mm)." },
            sintomas: { type: "string" },
            padecimientos: { type: "string" },
            notas_importantes: { type: "string" },
            trastornos: { type: "string" },
            afectamientos_subyacentes: { type: "string" },
            diagnostico: { type: "string" }
          },
          required: []
        }
      }
    }
    ,
    {
      type: "function",
      function: {
        name: "list_session_entries",
        description: listSessionEntriesDesc,
        parameters: {
          type: "object",
          properties: {
            nombre: { type: "string", description: "Nombre del paciente; si falta usar pacienteActivo o paciente_id." },
            paciente_id: { type: "number", description: "ID del paciente; opcional si viene 'nombre' o contexto." },
            estado: { type: "string", enum: ["activo","inactivo","todos"], description: "Por defecto 'activo'." },
            limit: { type: "number" },
            offset: { type: "number" }
          },
          required: []
        }
      }
    }
    ,
    {
      type: "function",
      function: {
        name: "suggest_diagnosis",
        description: suggestDxDesc,
        parameters: {
          type: "object",
          properties: {
            nombre: { type: "string", description: "Nombre del paciente; si falta, usar pacienteActivo o paciente_id." },
            paciente_id: { type: "number", description: "ID del paciente (opcional si hay nombre o contexto)." }
          },
          required: []
        }
      }
    }
    ,
    {
      type: "function",
      function: {
        name: "suggest_techniques",
        description: suggestTechDesc,
        parameters: {
          type: "object",
          properties: {
            nombre: { type: "string", description: "Nombre del paciente; si falta, usar pacienteActivo o paciente_id." },
            paciente_id: { type: "number", description: "ID del paciente (opcional si hay nombre o contexto)." }
          },
          required: []
        }
      }
    }
  ] as const;
}
