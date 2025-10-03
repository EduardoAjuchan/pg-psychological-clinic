'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/axios';

// ====== Tipos ======
export type Paciente = {
  id: number;
  nombre_completo: string;
  alias: string | null;
  telefono: string | null;
  genero: 'femenino' | 'masculino' | null;
  estado_proceso: 'iniciado' | 'finalizado' | 'en_pausa' | null;
  estado: 'activo' | 'inactivo';
  creado_en: string; // ISO
};

export type CrearPacienteDTO = {
  nombre_completo: string;
  alias?: string;
  telefono?: string | null;
  genero: 'femenino' | 'masculino';
  motivo_consulta: string;
};

export type ActualizarPacienteDTO = Partial<{
  alias: string | null;
  estado_proceso: 'iniciado' | 'finalizado' | 'en_pausa';
  telefono: string | null;
}>;

export type NotaSesion = {
  id: number;
  fecha: string; // ISO
  creada_por: string | null;
  sintomas: string | null;
  padecimientos: string | null;
  notas_importantes: string | null;
  trastornos: string | null;
  afectamientos_subyacentes: string | null;
  diagnostico: string | null;
  estado: 'activo' | 'inactivo';
};

export type PacienteDetalleResponse = {
  ok: boolean;
  paciente: Paciente & { nombre_normalizado?: string | null; motivo_consulta?: string | null };
  notas: NotaSesion[];
};

export type ListarPacientesResponse = {
  ok: boolean;
  total: number;
  data: Paciente[];
};

// ====== Validaciones ======
function validateCrearPaciente(dto: CrearPacienteDTO): string | null {
  if (!dto.nombre_completo?.trim()) return 'El nombre completo es obligatorio.';
  if (!dto.genero || (dto.genero !== 'femenino' && dto.genero !== 'masculino')) return 'Selecciona un género válido.';
  if (!dto.motivo_consulta?.trim()) return 'El motivo de consulta es obligatorio.';
  if (dto.telefono && /[^0-9]/.test(dto.telefono)) return 'El teléfono solo debe contener números.';
  return null;
}

// ====== Hook ======
export function usePacientes() {
  const [items, setItems] = useState<Paciente[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Detalle
  const [detalle, setDetalle] = useState<PacienteDetalleResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Listar (activos por defecto)
  async function fetch(q?: string, page = 1, size = 10) {
    try {
      setLoading(true);
      setError(null);
      const { data } = await api.get<ListarPacientesResponse>('/pacientes', {
        params: { q, page, size },
      });
      setItems(Array.isArray(data?.data) ? data.data : []);
      setTotal(Number(data?.total || 0));
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Error al cargar pacientes');
    } finally {
      setLoading(false);
    }
  }

  // Crear
  async function createPaciente(payload: CrearPacienteDTO) {
    const msg = validateCrearPaciente(payload);
    if (msg) throw new Error(msg);
    const { data } = await api.post('/pacientes', payload);
    // Backend devuelve { ok, paciente }
    if (!data?.ok) throw new Error('No se pudo crear el paciente');
    await fetch(); // refrescar lista
    return data.paciente as Paciente;
  }

  // Detalle por id (con notas)
  async function getPacienteDetalle(id: number) {
    try {
      setDetailLoading(true);
      setError(null);
      const { data } = await api.get<PacienteDetalleResponse>(`/pacientes/${id}`);
      if (!data?.ok) throw new Error('No se pudo cargar el detalle');
      setDetalle(data);
      return data;
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Error al cargar detalle';
      setError(msg);
      throw new Error(msg);
    } finally {
      setDetailLoading(false);
    }
  }

  // Actualizar (PATCH /pacientes/:id)
  async function updatePaciente(id: number, payload: ActualizarPacienteDTO) {
    // Sanitizar teléfono si viene
    if (payload.telefono && /[^0-9]/.test(payload.telefono)) {
      throw new Error('El teléfono solo debe contener números.');
    }
    // Mapear estado_proceso desde UI si hiciera falta (ya esperamos los valores backend)
    const { data } = await api.patch(`/pacientes/${id}`, payload);
    if (!data?.ok) throw new Error('No se pudo actualizar el paciente');
    await fetch();
    // Si el detalle abierto corresponde al mismo id, refrescarlo
    if (detalle?.paciente?.id === id) {
      await getPacienteDetalle(id);
    }
    return true;
  }

  useEffect(() => {
    fetch();
  }, []);

  return {
    items,
    total,
    loading,
    error,
    fetch,
    // CRUD
    createPaciente,
    getPacienteDetalle,
    detalle,
    detailLoading,
    updatePaciente,
  };
}
