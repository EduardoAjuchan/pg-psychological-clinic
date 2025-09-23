'use client';
import { useEffect, useState } from 'react';
import { listarPacientes, crearPaciente } from '../services/pacientes.service';
import type { Paciente, CrearPacienteDTO } from '../types/pacientes';
export function usePacientes() {
  const [items, setItems] = useState<Paciente[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetch(q?: string, page = 1, size = 10) {
    try {
      setLoading(true); setError(null);
      const res = await listarPacientes({ q, page, size });
      setItems(res.items); setTotal(res.total);
    } catch (e: any) {
      setError(e?.message || 'Error al cargar pacientes');
    } finally { setLoading(false); }
  }

  async function createPaciente(payload: CrearPacienteDTO) {
    await crearPaciente(payload);
    await fetch();
  }

  useEffect(() => { fetch(); }, []);
  return { items, total, loading, error, fetch, createPaciente };
}
