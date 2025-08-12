import { Router } from "express";
import { pool } from "../lib/db";

const r = Router();
r.get("/", async (_req, res) => {
  try {
    const [rows]: any = await pool.query("SELECT 1 AS ok");
    return res.json({ ok: rows[0]?.ok === 1 });
  } catch (e:any) {
    return res.status(500).json({ ok:false, error: e.message });
  }
});
export default r;