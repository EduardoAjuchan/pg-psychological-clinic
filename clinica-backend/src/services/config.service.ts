import * as repo from "../repos/config.repo";

// Cache simple en memoria con TTL para variables de config
const cache = new Map<string, { value: string; expires: number }>();
const DEFAULT_TTL_MS = 60_000; // 1 minuto

export async function get(variable: string, ttlMs: number = DEFAULT_TTL_MS): Promise<string | null> {
  const now = Date.now();
  const c = cache.get(variable);
  if (c && c.expires > now) return c.value;

  const row = await repo.getVariable(variable);
  if (!row) return null;

  const value: string = row.valor;
  cache.set(variable, { value, expires: now + ttlMs });
  return value;
}

export async function set(variable: string, value: string, tipo: "string"|"number"|"boolean"|"json" = "string", descripcion?: string) {
  await repo.upsertVariable(variable, value, tipo, descripcion);
  cache.delete(variable);
}

// Helper específico para el prompt del sistema
export async function getSystemPrompt(): Promise<string> {
  const v = await get("system_prompt", 30_000);
  if (v && v.trim().length > 0) return v;
  throw new Error("Falta configuración 'system_prompt' en la tabla 'configuracion'. Inserta la variable con el prompt de sistema.");
}
