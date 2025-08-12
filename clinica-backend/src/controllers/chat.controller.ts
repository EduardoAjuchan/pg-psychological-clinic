import { Request, Response } from "express";
import { getOpenAI } from "../lib/openai";
import { getTools } from "../mcp/tools";
import { mcpExecutor } from "../mcp/executor";
import * as configService from "../services/config.service";

// Helper to check if a string looks like a name (simple heuristics: 1-3 words, only letters and spaces, no punctuation)
function looksLikeName(str: string): boolean {
  if (!str || typeof str !== "string") return false;
  const trimmed = str.trim();
  // Between 1 and 3 words, all alphabetic (allow accents), no numbers or punctuation
  if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñüÜ ]{2,40}$/.test(trimmed)) return false;
  const words = trimmed.split(/\s+/);
  return words.length >= 1 && words.length <= 3;
}

export async function chatController(req: Request, res: Response) {
  try {
    const openai = getOpenAI();
    const { message } = req.body as { message: string };
    const sess: any = req.session;

    // TTL cleanup for pending actions: 10 min
    if (sess?.pendingSince) {
      const pendingSince = new Date(sess.pendingSince).getTime();
      const now = Date.now();
      if (now - pendingSince > 10 * 60 * 1000) {
        delete sess.pendingAction;
        delete sess.pendingArgs;
        delete sess.pendingMissing;
        delete sess.pendingSince;
      }
    }

    // Slot-filling for "nombre" if pending
    if (
      sess?.pendingAction === "schedule_appointment" &&
      Array.isArray(sess.pendingMissing) &&
      sess.pendingMissing.includes("nombre") &&
      looksLikeName(message)
    ) {
      // Merge pendingArgs with the provided name
      const args = Object.assign({}, sess.pendingArgs || {}, { nombre: message.trim() });
      const result = await mcpExecutor({ action: "schedule_appointment", data: args }, sess);
      // Clear pending fields
      delete sess.pendingAction;
      delete sess.pendingArgs;
      delete sess.pendingMissing;
      delete sess.pendingSince;
      req.session.save(() => {}); // Save session async
      return res.json({ ok: true, message: result?.message ?? "Listo.", result });
    }

    const systemPrompt = await configService.getSystemPrompt();
    const ctxHints = [
      sess?.pacienteActivo ? `Paciente activo: ${sess.pacienteActivo.nombre}.` : `No hay paciente activo.`,
      sess?.pendingAction ? `Acción pendiente: ${sess.pendingAction}.` : ``,
      Array.isArray(sess?.pendingMissing) && sess.pendingMissing.length ? `Faltan: ${sess.pendingMissing.join(", ")}.` : ``
    ].filter(Boolean).join(" ");

    let messages: any[] = [
      { role: "system", content: `${systemPrompt}\n${ctxHints}` },
      { role: "user", content: message }
    ];

    const tools = Array.from(await getTools());

    for (let i = 0; i < 4; i++) {
      const step = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        temperature: 0.2,
        tools,
        messages
      });

      const msg = step.choices[0].message!;
      messages.push(msg);
      const toolCalls = msg.tool_calls;

      if (!toolCalls || toolCalls.length === 0) {
        const finalText = msg.content ?? "Listo.";
        return res.json({ ok: true, message: finalText });
      }

      for (const call of toolCalls) {
        if (call.type === "function" && call.function) {
          const name = call.function.name;
          const args = JSON.parse(call.function.arguments || "{}");
          if (!args.nombre && sess?.pacienteActivo?.nombre) args.nombre = sess.pacienteActivo.nombre;

          const result = await mcpExecutor({ action: name, data: args }, sess);

          messages.push({
            role: "tool",
            tool_call_id: call.id,
            content: JSON.stringify(result)
          });
        }
      }
    }

    return res.json({ ok: false, message: "Se excedió el límite de pasos." });
  } catch (err: any) {
    // Return error as JSON, not HTML
    return res.status(500).json({ ok: false, error: err?.message || "Error interno", details: err?.stack });
  }
}