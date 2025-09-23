export type Paciente = {
  id: string;
  nombre: string;
  alias?: string;
  telefono?: string;
  genero?: 'M' | 'F' | 'O';
  estado?: 'activo' | 'en_proceso' | 'alta';
  creadoEn?: string;
};
export type CrearPacienteDTO = { nombre: string; alias?: string; telefono?: string; genero?: 'M' | 'F' | 'O'; };
