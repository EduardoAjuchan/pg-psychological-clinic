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