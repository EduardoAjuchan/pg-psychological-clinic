'use client';

import { useEffect, useMemo, useState } from 'react';
import Grid from '@mui/material/GridLegacy';
import {
  Card,
  CardContent,
  Typography,
  Box,
  IconButton,
  ToggleButtonGroup,
  ToggleButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Alert,
  CircularProgress,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import api from '@/lib/axios';

// Date pickers
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import dayjs, { Dayjs } from 'dayjs';

// Types from backend
type Cita = {
  id: number;
  paciente_id: number;
  fecha: string; // ISO string
  motivo: string;
  google_event_id?: string | null;
  creada_por?: string | null;
  estado: 'activo' | 'inactivo';
  creada_en: string;
  nombre_completo: string;
};

type CitasResponse = {
  ok: boolean;
  total: number;
  data: Cita[];
};

export default function CitasPage() {
  const [order, setOrder] = useState<'desc' | 'asc'>('desc'); // desc = más reciente primero
  const [showCancelled, setShowCancelled] = useState(false); // si true, mostrar inactivos
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState<number>(0);
  const [rows, setRows] = useState<Cita[]>([]);

  // Reschedule dialog state
  const [openReschedule, setOpenReschedule] = useState(false);
  const [selected, setSelected] = useState<Cita | null>(null);
  const [nuevaFecha, setNuevaFecha] = useState<Dayjs | null>(null);
  const [nuevoMotivo, setNuevoMotivo] = useState('');
  const [busy, setBusy] = useState(false);

  // Cancel dialog
  const [openCancel, setOpenCancel] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ open: boolean; msg: string; type?: 'success' | 'error' }>({ open: false, msg: '' });

  const fetchCitas = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await api.get<CitasResponse>('/citas/');
      setRows(data.data || []);
      setTotal(data.total || 0);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'No se pudieron cargar las citas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCitas();
  }, []);

  const citas = useMemo(() => {
    const filter = (c: Cita) => (showCancelled ? c.estado === 'inactivo' : c.estado === 'activo');
    const ts = (c: Cita) => new Date(c.fecha).getTime();
    return rows
      .filter(filter)
      .sort((a, b) => (order === 'desc' ? ts(b) - ts(a) : ts(a) - ts(b)));
  }, [rows, order, showCancelled]);

  const formatFecha = (iso: string) => dayjs(iso).format('YYYY-MM-DD HH:mm');
  const formatFechaLine = (iso: string) => dayjs(iso).format('DD/MM/YYYY • HH:mm');

  function handleOpenReschedule(c: Cita) {
    setSelected(c);
    setNuevaFecha(dayjs(c.fecha));
    setNuevoMotivo(c.motivo || '');
    setOpenReschedule(true);
  }

  async function handleReschedule() {
    if (!selected || !nuevaFecha) return;
    try {
      setBusy(true);
      const body = {
        nombre: selected.nombre_completo,
        nueva_fecha: nuevaFecha.format('YYYY-MM-DD HH:mm'),
        motivo: nuevoMotivo || selected.motivo || '',
      };
      await api.patch('/citas/reschedule', body);
      setOpenReschedule(false);
      setToast({ open: true, msg: 'Cita reagendada', type: 'success' });
      fetchCitas();
    } catch (e: any) {
      setToast({ open: true, msg: e?.response?.data?.message || 'No se pudo reagendar', type: 'error' });
    } finally {
      setBusy(false);
    }
  }

  function handleOpenCancel(c: Cita) {
    setSelected(c);
    setOpenCancel(true);
  }

  async function handleCancel() {
    if (!selected) return;
    try {
      setBusy(true);
      const body = {
        nombre: selected.nombre_completo,
        fecha: dayjs(selected.fecha).format('YYYY-MM-DD HH:mm'),
      };
      await api.patch('/citas/cancel', body);
      setOpenCancel(false);
      setToast({ open: true, msg: 'Cita cancelada', type: 'success' });
      fetchCitas();
    } catch (e: any) {
      setToast({ open: true, msg: e?.response?.data?.message || 'No se pudo cancelar', type: 'error' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box className="space-y-4">
        {/* Título + controles */}
        <Box className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <Box className="flex items-center gap-3">
            <Typography variant="h5" className="font-semibold text-purple-900">Citas</Typography>
            {!loading && (
              <Typography variant="body2" color="text.secondary">Total: {total}</Typography>
            )}
          </Box>

          <Box className="flex items-center gap-2">
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

            <ToggleButton
              value={showCancelled ? 'cancelled' : 'active'}
              selected={showCancelled}
              onChange={() => setShowCancelled((v) => !v)}
              size="small"
              aria-label="Ver canceladas"
            >
              {showCancelled ? 'Ver activas' : 'Ver canceladas'}
            </ToggleButton>
          </Box>
        </Box>

        {error && <Alert severity="error">{error}</Alert>}

        {loading ? (
          <Box className="w-full flex justify-center py-10"><CircularProgress /></Box>
        ) : (
          <Grid id="citas-grid" container spacing={2}>
            {citas.map((cita) => (
              <Grid item xs={12} md={6} lg={4} key={cita.id}>
                <Card
                  onClick={() => handleOpenReschedule(cita)}
                  sx={(theme) => ({
                    background: `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.10)}, ${alpha(theme.palette.secondary.light, 0.06)})`,
                    transition: 'transform 0.3s, box-shadow 0.3s, background 0.3s',
                    boxShadow: theme.shadows[1],
                    borderRadius: 3,
                    position: 'relative',
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
                        <Typography variant="h6">{cita.nombre_completo}</Typography>
                        <Typography color="text.secondary" sx={{ mt: 0.5 }}>{cita.motivo || '—'}</Typography>
                        <Typography color="text.secondary" sx={{ mt: 0.5 }}>{formatFechaLine(cita.fecha)}</Typography>
                      </Box>
                      <Box className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <IconButton aria-label="Editar cita" onClick={() => handleOpenReschedule(cita)} size="small">
                          <EditOutlinedIcon fontSize="small" />
                        </IconButton>
                        <IconButton aria-label="Cancelar cita" onClick={() => handleOpenCancel(cita)} size="small" color="error">
                          <CloseOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Dialogo Reagendar */}
        <Dialog open={openReschedule} onClose={() => !busy && setOpenReschedule(false)} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 3 } }}>
          <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>Reagendar cita</DialogTitle>
          <DialogContent dividers sx={{ p: { xs: 2.5, sm: 3 } }}>
            {selected && (
              <Box className="space-y-4">
                <Typography variant="subtitle2" className="font-semibold">{selected.nombre_completo}</Typography>
                <DateTimePicker
                  label="Nueva fecha y hora"
                  value={nuevaFecha}
                  onChange={(v) => setNuevaFecha(v)}
                  slotProps={{ textField: { fullWidth: true, variant: 'outlined' } }}
                  sx={{ mt: 2 }}
                />
                <TextField
                  label="Motivo"
                  value={nuevoMotivo}
                  onChange={(e) => setNuevoMotivo(e.target.value)}
                  fullWidth
                  variant="outlined"
                  sx={{ mt: 2 }}
                />
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setOpenReschedule(false)} disabled={busy}>Cancelar</Button>
            <Button onClick={handleReschedule} variant="contained" disabled={busy || !nuevaFecha}>
              Guardar
            </Button>
          </DialogActions>
        </Dialog>

        {/* Dialogo Cancelar */}
        <Dialog open={openCancel} onClose={() => !busy && setOpenCancel(false)} fullWidth maxWidth="xs" PaperProps={{ sx: { borderRadius: 3 } }}>
          <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>Cancelar cita</DialogTitle>
          <DialogContent dividers sx={{ p: { xs: 2.5, sm: 3 } }}>
            {selected && (
              <Box className="space-y-2">
                <Alert severity="warning" variant="outlined">
                  ¿Seguro que deseas cancelar esta cita?
                </Alert>
                <Typography variant="subtitle2" className="font-semibold">{selected.nombre_completo}</Typography>
                <Typography color="text.secondary">{formatFechaLine(selected.fecha)}</Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setOpenCancel(false)} disabled={busy}>No, volver</Button>
            <Button onClick={handleCancel} color="error" variant="contained" disabled={busy}>
              Cancelar cita
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={toast.open}
          autoHideDuration={2400}
          onClose={() => setToast({ open: false, msg: '' })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert severity={toast.type || 'success'} variant="filled" sx={{ borderRadius: 2 }}>
            {toast.msg}
          </Alert>
        </Snackbar>
      </Box>
    </LocalizationProvider>
  );
}
