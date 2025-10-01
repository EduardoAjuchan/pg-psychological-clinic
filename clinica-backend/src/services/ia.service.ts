import * as config from "../services/config.service";
import * as pacientes from "../services/pacientes.service";
import * as notasSvc from "../services/notas.service";
import * as pacientesRepo from "../repos/pacientes.repo";
import OpenAI from "openai";
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

type BuildCtxOpts = { notasEstado?: "activo"|"inactivo"|"todos"; notasLimit?: number };

export async function buildPatientContext(patientId: number, opts: BuildCtxOpts = {}) {
  const p = await pacientesRepo.getById(patientId); // asumimos ya existe
  if (!p) {
    throw new Error("Paciente no encontrado");
  }
  const motivo = p?.motivo_consulta || "";
  const limit = Number((await config.get("analysis.max_notes")) ?? (opts.notasLimit ?? 50));
  const estado = (await config.get("analysis.notes_state_default")) ?? (opts.notasEstado ?? "activo");
  const { items: notas } = await notasSvc.listByPaciente(patientId, { estado: estado as any, limit, offset: 0 });

  // Armado de contexto clínico (conciso y cronológico)
  const historial = notas
    .map(n => {
      const f = (n.fecha || "").toString().slice(0,19).replace("T"," ");
      const bloques: string[] = [];
      if (n.sintomas) bloques.push(`Síntomas: ${n.sintomas}`);
      if (n.padecimientos) bloques.push(`Padecimientos: ${n.padecimientos}`);
      if (n.trastornos) bloques.push(`Trastornos: ${n.trastornos}`);
      if (n.afectamientos_subyacentes) bloques.push(`Afectamientos: ${n.afectamientos_subyacentes}`);
      if (n.notas_importantes) bloques.push(`Notas: ${n.notas_importantes}`);
      if (n.diagnostico) bloques.push(`Dx: ${n.diagnostico}`);
      return `- [${f}] ${bloques.join(" | ")}`;
    })
    .join("\n");

  return {
    paciente: p.nombre_completo,
    motivo,
    historial
  };
}

async function renderPrompt(template: string, data: Record<string,string>) {
  return template
    .replaceAll("{{paciente}}", data.paciente ?? "")
    .replaceAll("{{motivo_consulta}}", data.motivo ?? "")
    .replaceAll("{{historial}}", data.historial ?? "");
}

export async function suggestDiagnosisByPatientId(patientId: number) {
  const ctx = await buildPatientContext(patientId);
  const tpl = (await config.get("prompt.suggest_diagnosis")) || (
`Eres un psicólogo clínico. Con base en el motivo de consulta y el historial,
proporciona hipótesis diagnósticas diferenciales (CIE-10/DSM-5 si aplica), factores a descartar,
y señales de alerta. Sé específico y estructurado.

Paciente: {{paciente}}
Motivo de consulta: {{motivo_consulta}}

Historial (cronológico):
{{historial}}

Devuelve:
- Hipótesis diagnósticas (con breve justificación)
- Diagnóstico principal sugerido (si procede)
- Diferenciales a considerar
- Red flags / riesgos
- Recomendaciones de evaluación adicional
`
  );

  const prompt = await renderPrompt(tpl, ctx);
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const resp = await openai.chat.completions.create({
    model,
    messages: [
      { role: "system", content: "Responde de forma clínica, ordenada y concisa." },
      { role: "user", content: prompt }
    ],
    temperature: 0.2
  });
  return resp.choices[0]?.message?.content || "No se pudo generar sugerencias diagnósticas.";
}

export async function suggestTechniquesByPatientId(patientId: number) {
  const ctx = await buildPatientContext(patientId);
  const tpl = (await config.get("prompt.suggest_techniques")) || (
`Eres un psicólogo clínico. Con base en el motivo de consulta e historial,
propón un conjunto de técnicas/intervenciones personalizadas (p. ej. TCC, psicoeducación, respiración,
exposición, activación conductual, reestructuración cognitiva, mindfulness, habilidades DBT, etc.).
Incluye objetivos, racional breve, y una mini-hoja de ruta de 4-8 sesiones.

Paciente: {{paciente}}
Motivo de consulta: {{motivo_consulta}}

Historial (cronológico):
{{historial}}

Devuelve:
- Objetivos terapéuticos
- Técnicas recomendadas (con racional)
- Ejercicios/tareas para casa
- Riesgos/contraindicaciones
- Plan de sesiones (breve)
`
  );

  const prompt = await renderPrompt(tpl, ctx);
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const resp = await openai.chat.completions.create({
    model,
    messages: [
      { role: "system", content: "Responde en formato clínico, claro y accionable." },
      { role: "user", content: prompt }
    ],
    temperature: 0.3
  });
  return resp.choices[0]?.message?.content || "No se pudo generar técnicas recomendadas.";
}