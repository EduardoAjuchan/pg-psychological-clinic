import { Request, Response } from "express";
import * as pacientesRepo from "../repos/pacientes.repo";
import * as notasRepo from "../repos/notas.repo"; // para incluir últimas notas en el detalle (si lo tenés)

function normalizeName(s: string) {
  return s
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// GET /api/pacientes?estado=activo|inactivo|todos&q=&limit=&offset=
export async function listarPacientesController(req: Request, res: Response) {
  try {
    const estadoRaw = String(req.query.estado ?? "activo");
    const estado = estadoRaw === "todos" ? undefined : (estadoRaw as "activo" | "inactivo");
    const q = (req.query.q as string) || "";
    const limit = Math.min(Number(req.query.limit ?? 50), 100);
    const offset = Math.max(Number(req.query.offset ?? 0), 0);

    const [data, total] = await Promise.all([
      pacientesRepo.listAll({ q, estado: estado as any, limit, offset }),
      pacientesRepo.countAll({ q, estado: (estado as any) ?? "activo" })
    ]);

    return res.json({ ok: true, total, data });
  } catch (e: any) {
    return res.status(500).json({ ok: false, message: "ERROR", details: String(e?.message || e) });
  }
}

// GET /api/pacientes/:id
export async function detallePacienteController(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const paciente = await pacientesRepo.getById(id);
    if (!paciente) return res.status(404).json({ ok: false, message: "NOT_FOUND" });

    // últimas 5 notas (si tu repo de notas ya expone esta función)
    let notas: any[] = [];
    try {
      notas = await notasRepo.listByPaciente(id, { limit: 5, offset: 0 });
    } catch { /* si aún no está implementado, ignoramos */ }

    return res.json({ ok: true, paciente, notas });
  } catch (e: any) {
    return res.status(500).json({ ok: false, message: "ERROR", details: String(e?.message || e) });
  }
}

// POST /api/pacientes
export async function crearPacienteController(req: Request, res: Response) {
  try {
    const {
      nombre_completo,
      alias,
      telefono,
      genero, // 'masculino'|'femenino'|'otro'|'no_especificado'
      motivo_consulta
    } = req.body || {};

    if (!nombre_completo || String(nombre_completo).trim().length < 2) {
      return res.status(400).json({ ok: false, message: "NOMBRE_INVALIDO" });
    }

    const nombre_normalizado = normalizeName(String(nombre_completo));

    // Si querés, podrías prevenir duplicados exactos por nombre_normalizado activo:
    // const dup = await pacientesRepo.findByNormalizedName(nombre_normalizado);
    // if (dup) return res.status(409).json({ ok:false, message:"PACIENTE_YA_EXISTE", id: dup.id });

    const out = await pacientesRepo.insert({
      nombre_completo: String(nombre_completo).trim(),
      nombre_normalizado,
      alias: alias ?? null,
      telefono: telefono ?? null,
      genero: genero ?? null,
      motivo_consulta: motivo_consulta ?? null
    });

    return res.status(201).json({ ok: true, paciente: out });
  } catch (e: any) {
    return res.status(500).json({ ok: false, message: "ERROR", details: String(e?.message || e) });
  }
}

// PATCH /api/pacientes/:id
export async function actualizarPacienteController(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const curr = await pacientesRepo.getById(id);
    if (!curr) return res.status(404).json({ ok: false, message: "NOT_FOUND" });

    const {
      nombre_completo,
      alias,
      telefono,
      genero, // 'masculino'|'femenino'|'otro'|'no_especificado'
      motivo_consulta,
      estado_proceso // 'iniciado'|'en_pausa'|'finalizado'
    } = req.body || {};

    const data: any = {};
    if (nombre_completo !== undefined) {
      data.nombre_completo = String(nombre_completo).trim();
      data.nombre_normalizado = normalizeName(String(nombre_completo));
    }
    if (alias !== undefined) data.alias = alias ?? null;
    if (telefono !== undefined) data.telefono = telefono ?? null;
    if (genero !== undefined) data.genero = genero ?? null;
    if (motivo_consulta !== undefined) data.motivo_consulta = motivo_consulta ?? null;
    if (estado_proceso !== undefined) data.estado_proceso = estado_proceso;

    const updated = await pacientesRepo.updateById(id, data);
    return res.json({ ok: true, paciente: updated });
  } catch (e: any) {
    return res.status(500).json({ ok: false, message: "ERROR", details: String(e?.message || e) });
  }
}

// PATCH /api/pacientes/:id/deactivate
export async function desactivarPacienteController(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const curr = await pacientesRepo.getById(id);
    if (!curr) return res.status(404).json({ ok: false, message: "NOT_FOUND" });

    const updated = await pacientesRepo.softDeleteById(id);
    return res.json({ ok: true, paciente: updated });
  } catch (e: any) {
    return res.status(500).json({ ok: false, message: "ERROR", details: String(e?.message || e) });
  }
}