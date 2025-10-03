

import { Request, Response } from "express";
import * as citasRepo from "../repos/citas.repo";
import * as citasSvc from "../services/citas.service";

// GET /api/citas?paciente_id=&estado=activo|inactivo&desde=YYYY-MM-DD HH:mm:ss&hasta=...&limit=&offset=
export async function listarCitasController(req: Request, res: Response) {
  try {
    const paciente_id = req.query.paciente_id ? Number(req.query.paciente_id) : undefined;
    const estado = req.query.estado ? String(req.query.estado) as "activo"|"inactivo" : undefined;
    const desde = req.query.desde ? String(req.query.desde) : undefined;
    const hasta = req.query.hasta ? String(req.query.hasta) : undefined;
    const limit = Math.min(Number(req.query.limit || 50), 100);
    const offset = Math.max(Number(req.query.offset || 0), 0);

    const [data, total] = await Promise.all([
      citasRepo.list({ paciente_id, estado, desde, hasta, limit, offset }),
      citasRepo.count({ paciente_id, estado, desde, hasta })
    ]);

    res.json({ ok: true, total, data });
  } catch (e: any) {
    res.status(500).json({ ok: false, message: "ERROR", details: String(e?.message || e) });
  }
}

// GET /api/citas/:id
export async function detalleCitaController(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const cita = await citasRepo.getById(id);
    if (!cita) return res.status(404).json({ ok: false, message: "NOT_FOUND" });
    res.json({ ok: true, cita });
  } catch (e: any) {
    res.status(500).json({ ok: false, message: "ERROR", details: String(e?.message || e) });
  }
}

export async function crearCitaController(req: Request, res: Response) {
  try {
    const { nombre, fecha, motivo, duracion_min } = req.body || {};
    if (!nombre || !fecha) {
      return res.status(400).json({ ok: false, message: "MISSING_FIELDS" });
    }

    const cita = await citasSvc.scheduleByName(String(nombre), { fecha, motivo, duracion_min });
    return res.status(201).json({ ok: true, cita });
  } catch (err: any) {
    const msg = String(err?.message || err);
    if (msg.startsWith("CONFLICTO_HORARIO:")) {
      return res.status(409).json({ ok: false, message: msg });
    }
    return res.status(500).json({ ok: false, message: msg });
  }
}

export async function reprogramarCitaController(req: Request, res: Response) {
  try {
    const { nombre, nueva_fecha, motivo, duracion_min, fecha } = req.body || {};
    if (!nombre || !nueva_fecha) {
      return res.status(400).json({ ok: false, message: "MISSING_FIELDS" });
    }

    const out = await citasSvc.rescheduleByName(String(nombre), {
      nueva_fecha,
      motivo,
      duracion_min,
      fecha,
    });

    const { ok: _ok, ...rest } = out || {};
    return res.json({ ok: true, ...rest });
  } catch (err: any) {
    const msg = String(err?.message || err);
    if (msg.startsWith("CONFLICTO_HORARIO:")) {
      return res.status(409).json({ ok: false, message: msg });
    }
    return res.status(500).json({ ok: false, message: msg });
  }
}
export async function cancelarCitaController(req: Request, res: Response) {
  try {
    const { nombre, fecha } = req.body || {};
    if (!nombre) {
      return res.status(400).json({ ok: false, message: "MISSING_FIELDS" });
    }

    const out = await citasSvc.cancelByName(String(nombre), { fecha });
    const { ok: _ok, ...rest } = out || {};
    return res.json({ ok: true, ...rest });
  } catch (err: any) {
    const msg = String(err?.message || err);
    return res.status(500).json({ ok: false, message: msg });
  }
} 
