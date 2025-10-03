import { normalize } from "../lib/normalize";
import * as repo from "../repos/pacientes.repo";
import { z } from "zod";

const CreatePatientInput = z.object({
  nombre_completo: z.string().min(3),
  alias: z.string().nullish(),
  telefono: z.string().nullish(),
  genero: z.enum(["masculino","femenino","otro","no_especificado"]).optional(),
  motivo_consulta: z.string().nullish(),
});

export async function create(raw: unknown) {
  const data = CreatePatientInput.parse(raw);
  const nn = normalize(data.nombre_completo);
  const exists = await repo.findByNormalizedName(nn);
  if (exists) throw new Error("Paciente ya existe");
  return repo.insert({ ...data, nombre_normalizado: nn });
}

export async function getByName(nombre: string) {
  const nn = normalize(nombre);
  const p = await repo.findByNormalizedName(nn);
  if (!p) throw new Error("Paciente no encontrado");
  return p;
}

const UpdatePacienteInput = z.object({
  nombre_completo: z.string().min(2).optional(),
  alias: z.string().nullish(),
  telefono: z.string().nullish(),
  genero: z.enum(["masculino","femenino","otro","no_especificado"]).optional(),
  motivo_consulta: z.string().nullish(),
  estado_proceso: z.enum(["iniciado","en_pausa","finalizado"]).optional()
});

export async function update(id: number, raw: unknown) {
  const data = UpdatePacienteInput.parse(raw);
  const payload: any = { ...data };
  if (data.nombre_completo) {
    payload.nombre_normalizado = normalize(data.nombre_completo);
  }
  const updated = await repo.updateById(id, payload);
  if (!updated) throw new Error("Paciente no encontrado");
  return updated;
}

export async function removeLogical(id: number) {
  const p = await repo.softDeleteById(id);
  if (!p) throw new Error("Paciente no encontrado");
  return { ok: true, id: p.id, estado: p.estado };
}

export async function list(params: { q?: string; estado?: "activo" | "inactivo"; limit?: number; offset?: number }) {
  const qn = params.q ? normalize(params.q) : undefined;
  const rows = await repo.listAll({ q: qn, estado: params.estado ?? "activo", limit: params.limit ?? 50, offset: params.offset ?? 0 });
  const total = await repo.countAll({ q: qn, estado: params.estado ?? "activo" });
  return { items: rows, total };
}

// use require to avoid TS error if notas.repo.ts has no exports
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const notasRepo: any = require("../repos/notas.repo");
export async function getDetails(id: number, { notasLimit = 20, notasOffset = 0 } = {}) {
  const p = await repo.getById(id);
  if (!p) throw new Error("Paciente no encontrado");
  const notas = await notasRepo.listByPaciente(id, { limit: notasLimit, offset: notasOffset });
  return { paciente: p, notas };
}