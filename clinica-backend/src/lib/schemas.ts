import { z } from "zod";

export const MCPRequest = z.object({
  action: z.enum([
    "create_patient",
    "schedule_appointment",
    "create_session_entry",
    "get_patient_summary",
    "update_patient",
    "change_patient_state",
  ]),
  data: z.record(z.any()),
});
export type TMCPRequest = z.infer<typeof MCPRequest>;