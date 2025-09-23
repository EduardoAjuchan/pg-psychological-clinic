'use client';
import { useMemo, useState } from 'react';
import { Grid, Card, CardContent, Typography, Box, IconButton, ToggleButtonGroup, ToggleButton } from '@mui/material';
import { alpha } from '@mui/material/styles';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';

// Datos demo
const citasBase = [
  { id: 1, fecha: '2025-09-23', hora: '10:00', paciente: 'Juan Pérez' },
  { id: 2, fecha: '2025-09-23', hora: '11:30', paciente: 'María López' },
  { id: 3, fecha: '2025-09-24', hora: '09:15', paciente: 'Ana Torres' },
];

export default function CitasPage() {
  const [order, setOrder] = useState<'desc' | 'asc'>('desc'); // desc = más reciente primero

  const citas = useMemo(() => {
    const ts = (c: { fecha: string; hora: string }) => new Date(`${c.fecha}T${c.hora}:00`).getTime();
    const arr = [...citasBase].sort((a, b) => (order === 'desc' ? ts(b) - ts(a) : ts(a) - ts(b)));
    return arr;
  }, [order]);

  const handleEdit = (id: number) => {
    // TODO: abrir modal/route edición
    alert(`Editar cita ${id} (placeholder)`);
  };

  return (
    <Box className="space-y-4">
      {/* Título + controles */}
      <Box className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <Typography variant="h5" className="font-semibold text-purple-900">Citas</Typography>
        <ToggleButtonGroup
          exclusive
          size="small"
          value={order}
          onChange={(_, v) => v && setOrder(v)}
          aria-label="Orden de citas"
        >
          <ToggleButton value="desc" aria-label="Más recientes primero">
            <ArrowDownwardIcon fontSize="small" />
            <span className="ml-1 hidden sm:inline">Recientes primero</span>
          </ToggleButton>
          <ToggleButton value="asc" aria-label="Más lejanas primero">
            <ArrowUpwardIcon fontSize="small" />
            <span className="ml-1 hidden sm:inline">Lejanas primero</span>
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <Grid id="citas-grid" container spacing={2}>
        {citas.map((c) => (
          <Grid item xs={12} md={6} lg={4} key={c.id}>
            <Card
              sx={(theme) => ({
                background: `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.10)}, ${alpha(theme.palette.secondary.light, 0.06)})`,
                transition: 'transform 0.3s, box-shadow 0.3s, background 0.3s',
                boxShadow: theme.shadows[1],
                borderRadius: 3,
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: theme.shadows[4],
                  background: `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.22)}, ${alpha(theme.palette.secondary.light, 0.14)})`,
                  cursor: 'pointer',
                },
              })}
            >
              <CardContent sx={{ bgcolor: 'transparent' }}>
                <Box className="flex items-start justify-between gap-2">
                  <Box>
                    <Typography variant="h6">{c.paciente}</Typography>
                    <Typography color="text.secondary">{c.fecha} • {c.hora}</Typography>
                  </Box>
                  <IconButton aria-label="Editar cita" onClick={() => handleEdit(c.id)} size="small">
                    <EditOutlinedIcon fontSize="small" />
                  </IconButton>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
