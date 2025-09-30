import { z } from "zod";

export const MCPAction = z.enum([
  "create_patient",
  "schedule_appointment",
  "reschedule_appointment",
  "cancel_appointment",
  "create_session_entry",
  "get_patient_summary",
  "update_patient",
  "change_patient_state",
  "deactivate_patient",     // baja lógica
  "list_patients",          // listado con filtro
  "get_patient_details",    // detalle + notas
]);
export type TMCPAction = z.infer<typeof MCPAction>;

export const MCPRequest = z.object({
  action: MCPAction,
  data: z.record(z.any()),
});
export type TMCPRequest = z.infer<typeof MCPRequest>;