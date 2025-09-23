'use client';
import { Button, TextField } from '@mui/material';
import { useState } from 'react';
import DataTable from '@/components/ui/DataTable';
import { usePacientes } from '../hooks/usePacientes';

export default function PacientesListPage() {
  const { items, loading, error, fetch, createPaciente } = usePacientes();
  const [q, setQ] = useState('');
  return (
    <div id="pacientes-list" className="space-y-4">
      <div className="flex gap-2 items-center">
        <TextField size="small" label="Buscar" value={q} onChange={e => setQ(e.target.value)} />
        <Button onClick={() => fetch(q)}>Buscar</Button>
        <Button onClick={() => createPaciente({ nombre: 'Paciente demo' })}>+ Nuevo</Button>
      </div>
      {loading && <div>Cargando…</div>}
      {error && <div className="text-red-600">{error}</div>}
      <DataTable
        columns={[
          { key: 'nombre', header: 'Nombre' },
          { key: 'alias', header: 'Alias' },
          { key: 'telefono', header: 'Teléfono' },
          { key: 'estado', header: 'Estado' },
        ]}
        data={items}
        emptyText="No hay pacientes"
      />
    </div>
  );
}
