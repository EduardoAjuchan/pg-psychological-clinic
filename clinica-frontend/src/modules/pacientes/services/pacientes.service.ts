import api from '@/lib/axios';
import type { Paciente, CrearPacienteDTO } from '../types/pacientes';
export async function listarPacientes(params?: { q?: string; page?: number; size?: number }) {
  const { data } = await api.get<{ items: Paciente[]; total: number }>('/pacientes', { params });
  return data;
}
export async function crearPaciente(payload: CrearPacienteDTO) {
  const { data } = await api.post<Paciente>('/pacientes', payload);
  return data;
}
