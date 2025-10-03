import { Request, Response } from "express";
import * as dashboardService from "../services/dashboard.service";

/**
 * GET /api/dashboard
 * Devuelve KPIs esenciales para el tablero.
 * (Por ahora usa ventanas fijas: futuros, último mes, etc. según el repo.)
 */
export async function getDashboardController(req: Request, res: Response) {
  try {
    const from = req.query.from ? String(req.query.from) : undefined;
    const to = req.query.to ? String(req.query.to) : undefined;

    const { kpis, charts } = await dashboardService.getDashboardData({ from, to });

    return res.json({
      ok: true,
      kpis,
      charts,
    });
  } catch (e: any) {
    return res
      .status(500)
      .json({ ok: false, message: "ERROR", details: String(e?.message || e) });
  }
}