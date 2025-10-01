

import { z } from "zod";
import * as notasRepo from "../repos/notas.repo";
import * as pacientesSvc from "./pacientes.service";

/**
 * Esquemas de validación
 */
export const CreateNotaInput = z.object({
  // Identificación del paciente
  paciente_id: z.number().int().positive().optional(),
  nombre: z.string().optional(),

  // Datos de la nota
  fecha: z.string().optional(), // ISO o "YYYY-MM-DD HH:mm"; si no viene, se usa CURRENT_TIMESTAMP
  sintomas: z.string().nullish(),
  padecimientos: z.string().nullish(),
  notas_importantes: z.string().nullish(),
  trastornos: z.string().nullish(),
  afectamientos_subyacentes: z.string().nullish(),
  diagnostico: z.string().nullish(),
});
export type TCreateNotaInput = z.infer<typeof CreateNotaInput>;

export const UpdateNotaInput = z.object({
  fecha: z.string().optional(),
  sintomas: z.string().nullish(),
  padecimientos: z.string().nullish(),
  notas_importantes: z.string().nullish(),
  trastornos: z.string().nullish(),
  afectamientos_subyacentes: z.string().nullish(),
  diagnostico: z.string().nullish(),
});
export type TUpdateNotaInput = z.infer<typeof UpdateNotaInput>;

/**
 * Crea una nota de sesión. Puede resolverse el paciente por id, por nombre, o
 * se puede inyectar desde el executor (contexto) con resolvedPacienteId.
 * createdByUserId se usará cuando tengamos auth real.
 */
export async function createByRef(raw: unknown, resolvedPacienteId?: number, createdByUserId?: number) {
  const data = CreateNotaInput.parse(raw);

  // Resolver paciente: prioridad al parámetro explícito, luego al contexto, luego por nombre
  let pacienteId = data.paciente_id ?? resolvedPacienteId;
  if (!pacienteId && data.nombre) {
    const p = await pacientesSvc.getByName(data.nombre);
    pacienteId = p.id;
  }
  if (!pacienteId) throw new Error("MISSING_FIELD:nombre|paciente_id");

  const payload: any = {
    paciente_id: pacienteId,
    creada_por: createdByUserId ?? null,
    sintomas: data.sintomas ?? null,
    padecimientos: data.padecimientos ?? null,
    notas_importantes: data.notas_importantes ?? null,
    trastornos: data.trastornos ?? null,
    afectamientos_subyacentes: data.afectamientos_subyacentes ?? null,
    diagnostico: data.diagnostico ?? null,
  };

  const inserted = await notasRepo.insert(payload);

  // Si se provee fecha explícita, actualizamos el campo tras el insert
  if (data.fecha) {
    await notasRepo.updateById(inserted.id, { fecha: data.fecha });
    const refreshed = await notasRepo.getById(inserted.id);
    return refreshed;
  }

  return inserted;
}

/**
 * Lista notas por paciente con paginación y filtro de estado.
 */
export async function listByPaciente(
  pacienteId: number,
  { estado = "activo" as "activo" | "inactivo" | "todos", limit = 20, offset = 0 } = {}
) {
  const items = await notasRepo.listByPaciente(pacienteId, { estado, limit, offset });
  const total = await notasRepo.countByPaciente(pacienteId, { estado });
  return { items, total };
}

/**
 * Obtiene una nota por id
 */
export async function getById(id: number) {
  return await notasRepo.getById(id);
}

/**
 * Actualiza campos de una nota (parcial)
 */
export async function update(id: number, raw: unknown) {
  const patch = UpdateNotaInput.parse(raw);
  const ok = await notasRepo.updateById(id, patch as any);
  if (!ok) throw new Error("No se pudo actualizar la nota (o no existe)");
  return await notasRepo.getById(id);
}

/**
 * Baja lógica de la nota
 */
export async function deactivate(id: number) {
  const ok = await notasRepo.softDeleteById(id);
  if (!ok) throw new Error("No se pudo desactivar la nota (o no existe)");
  return { ok: true, id };
}