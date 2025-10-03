'use client';

import { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import {
  Box,
  Button,
  TextField,
  Typography,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  TablePagination,
} from '@mui/material';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import AddIcon from '@mui/icons-material/Add';
import { usePacientes } from '../hooks/usePacientes';

export default function PacientesListPage() {
  const { items, total, loading, error, fetch, createPaciente, getPacienteDetalle, detalle, detailLoading, updatePaciente } = usePacientes();

  const [q, setQ] = useState('');
  const [toast, setToast] = useState<{ open: boolean; msg: string; type?: 'success' | 'error' }>({ open: false, msg: '' });

  // Pagination state
  const [page, setPage] = useState(0);
  const rowsPerPage = 20;

  // Crear paciente modal
  const [openCreate, setOpenCreate] = useState(false);
  const [cNombre, setCNombre] = useState('');
  const [cAlias, setCAlias] = useState('');
  const [cTelefono, setCTelefono] = useState('');
  const [cGenero, setCGenero] = useState<'femenino' | 'masculino' | ''>('');
  const [cMotivo, setCMotivo] = useState('');

  // Editar modal
  const [openEdit, setOpenEdit] = useState(false);
  const [eId, setEId] = useState<number | null>(null);
  const [eAlias, setEAlias] = useState<string>('');
  const [eTelefono, setETelefono] = useState<string>('');
  const [eEstado, setEEstado] = useState<'iniciado' | 'finalizado' | 'en_pausa'>('iniciado');

  // Detalle modal
  const [openDetail, setOpenDetail] = useState(false);

  // Buscar
  function handleSearch() {
    setPage(0);
    fetch(q || undefined);
  }

  // Formateo fecha
  const fmt = (iso?: string | null) => (iso ? dayjs(iso).format('DD/MM/YYYY HH:mm') : '—');

  // Abrir detalle
  async function openDetalle(id: number) {
    try {
      await getPacienteDetalle(id);
      setOpenDetail(true);
    } catch (e: any) {
      setToast({ open: true, msg: e?.message || 'No se pudo cargar el detalle', type: 'error' });
    }
  }

  // Abrir edición
  function openEditar(row: any) {
    setEId(row.id);
    setEAlias(row.alias || '');
    setETelefono(row.telefono || '');
    setEEstado((row.estado_proceso as any) || 'iniciado');
    setOpenEdit(true);
  }

  // Guardar edición
  async function handleSaveEdit() {
    if (eId == null) return;
    if (eTelefono && /[^0-9]/.test(eTelefono)) {
      setToast({ open: true, msg: 'El teléfono solo debe contener números.', type: 'error' });
      return;
    }
    try {
      await updatePaciente(eId, { alias: eAlias || null, telefono: eTelefono || null, estado_proceso: eEstado });
      setOpenEdit(false);
      setToast({ open: true, msg: 'Paciente actualizado', type: 'success' });
      fetch(q || undefined);
    } catch (e: any) {
      setToast({ open: true, msg: e?.message || 'No se pudo actualizar', type: 'error' });
    }
  }

  // Guardar creación
  async function handleCreate() {
    if (!cNombre.trim()) return setToast({ open: true, msg: 'El nombre completo es obligatorio.', type: 'error' });
    if (!cGenero) return setToast({ open: true, msg: 'Selecciona un género.', type: 'error' });
    if (!cMotivo.trim()) return setToast({ open: true, msg: 'El motivo de consulta es obligatorio.', type: 'error' });
    if (cTelefono && /[^0-9]/.test(cTelefono)) return setToast({ open: true, msg: 'El teléfono solo debe contener números.', type: 'error' });

    try {
      await createPaciente({
        nombre_completo: cNombre.trim(),
        alias: cAlias.trim() || '',
        telefono: cTelefono || null,
        genero: cGenero,
        motivo_consulta: cMotivo.trim(),
      });
      setOpenCreate(false);
      setCNombre(''); setCAlias(''); setCTelefono(''); setCGenero(''); setCMotivo('');
      setToast({ open: true, msg: 'Paciente creado', type: 'success' });
      fetch(q || undefined);
    } catch (e: any) {
      setToast({ open: true, msg: e?.message || 'No se pudo crear el paciente', type: 'error' });
    }
  }

  const rows = useMemo(() => items, [items]);

  const pagedRows = useMemo(
    () => rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [rows, page]
  );

  const handleChangePage = (_: any, newPage: number) => {
    setPage(newPage);
  };

  useEffect(() => {
    fetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Box id="pacientes-list" className="space-y-4">
      {/* Header */}
      <Box className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <Box className="flex items-center gap-3">
          <Typography variant="h5" className="font-semibold text-purple-900">Pacientes</Typography>
          {!loading && <Typography color="text.secondary">Total: {total}</Typography>}
        </Box>
        <Box className="flex items-center gap-2">
          <TextField size="small" label="Buscar" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} />
          <Button variant="outlined" onClick={handleSearch}>Buscar</Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenCreate(true)}>
            Nuevo
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error">{error}</Alert>}

      {/* Tabla */}
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Nombre completo</TableCell>
              <TableCell>Alias</TableCell>
              <TableCell>Teléfono</TableCell>
              <TableCell>Estado del proceso</TableCell>
              <TableCell>Creado</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {pagedRows.map((row) => (
              <TableRow key={row.id} hover>
                <TableCell>{row.nombre_completo}</TableCell>
                <TableCell>{row.alias ?? '—'}</TableCell>
                <TableCell>{row.telefono ?? '—'}</TableCell>
                <TableCell>{row.estado_proceso ?? '—'}</TableCell>
                <TableCell>{fmt(row.creado_en)}</TableCell>
                <TableCell align="right">
                  <IconButton aria-label="Ver detalle" onClick={() => openDetalle(row.id)} size="small">
                    <VisibilityOutlinedIcon fontSize="small" />
                  </IconButton>
                  <IconButton aria-label="Editar" onClick={() => openEditar(row)} size="small">
                    <EditOutlinedIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {!loading && pagedRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">No hay pacientes</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={[rowsPerPage]}
        />
      </TableContainer>

      {/* Dialogo: Crear paciente */}
      <Dialog open={openCreate} onClose={() => setOpenCreate(false)} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>Nuevo paciente</DialogTitle>
        <DialogContent dividers sx={{ p: { xs: 2.5, sm: 3 } }}>
          <Box className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <TextField label="Nombre completo" value={cNombre} onChange={(e) => setCNombre(e.target.value)} fullWidth required />
            <TextField label="Alias" value={cAlias} onChange={(e) => setCAlias(e.target.value)} fullWidth />
            <TextField label="Teléfono" value={cTelefono} onChange={(e) => setCTelefono(e.target.value.replace(/[^0-9]/g, ''))} inputProps={{ inputMode: 'numeric' }} fullWidth />
            <FormControl fullWidth required>
              <InputLabel id="genero-label">Género</InputLabel>
              <Select labelId="genero-label" label="Género" value={cGenero} onChange={(e) => setCGenero(e.target.value as any)}>
                <MenuItem value={''} disabled>Selecciona…</MenuItem>
                <MenuItem value={'femenino'}>Femenino</MenuItem>
                <MenuItem value={'masculino'}>Masculino</MenuItem>
              </Select>
            </FormControl>
            <TextField className="md:col-span-2" label="Motivo de consulta" value={cMotivo} onChange={(e) => setCMotivo(e.target.value)} fullWidth multiline minRows={3} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpenCreate(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleCreate}>Guardar</Button>
        </DialogActions>
      </Dialog>

      {/* Dialogo: Detalle paciente */}
      <Dialog open={openDetail} onClose={() => setOpenDetail(false)} fullWidth maxWidth="md" PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>Detalle del paciente</DialogTitle>
        <DialogContent dividers sx={{ p: { xs: 2.5, sm: 3 } }}>
          {detailLoading ? (
            <Typography>Cargando…</Typography>
          ) : detalle ? (
            <Box className="space-y-4">
              <Box className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <TextField label="Nombre completo" value={detalle.paciente.nombre_completo} fullWidth InputProps={{ readOnly: true }} />
                <TextField label="Alias" value={detalle.paciente.alias ?? ''} fullWidth InputProps={{ readOnly: true }} />
                <TextField label="Teléfono" value={detalle.paciente.telefono ?? ''} fullWidth InputProps={{ readOnly: true }} />
                <TextField label="Género" value={detalle.paciente.genero ?? ''} fullWidth InputProps={{ readOnly: true }} />
                <TextField label="Estado del proceso" value={detalle.paciente.estado_proceso ?? ''} fullWidth InputProps={{ readOnly: true }} />
                <TextField label="Creado en" value={fmt(detalle.paciente.creado_en)} fullWidth InputProps={{ readOnly: true }} />
                <TextField className="md:col-span-2" label="Motivo de consulta" value={detalle.paciente.motivo_consulta ?? ''} fullWidth multiline minRows={2} InputProps={{ readOnly: true }} />
              </Box>

              <Box>
                <Typography variant="subtitle1" className="font-semibold mb-2">Notas de sesión</Typography>
                {detalle.notas?.length ? (
                  <Box className="space-y-2">
                    {detalle.notas.map(n => (
                      <Paper key={n.id} className="p-3" variant="outlined">
                        <Typography variant="body2" color="text.secondary" className="mb-1">{fmt(n.fecha)}</Typography>
                        <Typography variant="body2"><strong>Síntomas:</strong> {n.sintomas ?? '—'}</Typography>
                        <Typography variant="body2"><strong>Padecimientos:</strong> {n.padecimientos ?? '—'}</Typography>
                        <Typography variant="body2"><strong>Notas:</strong> {n.notas_importantes ?? '—'}</Typography>
                        <Typography variant="body2"><strong>Trastornos:</strong> {n.trastornos ?? '—'}</Typography>
                        <Typography variant="body2"><strong>Afectamientos:</strong> {n.afectamientos_subyacentes ?? '—'}</Typography>
                        <Typography variant="body2"><strong>Diagnóstico:</strong> {n.diagnostico ?? '—'}</Typography>
                      </Paper>
                    ))}
                  </Box>
                ) : (
                  <Typography color="text.secondary">Sin notas registradas</Typography>
                )}
              </Box>
            </Box>
          ) : (
            <Typography color="text.secondary">Sin datos</Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpenDetail(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Dialogo: Editar paciente */}
      <Dialog open={openEdit} onClose={() => setOpenEdit(false)} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>Editar paciente</DialogTitle>
        <DialogContent dividers sx={{ p: { xs: 2.5, sm: 3 } }}>
          <Box className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <TextField label="Alias" value={eAlias} onChange={(e) => setEAlias(e.target.value)} fullWidth />
            <TextField label="Teléfono" value={eTelefono} onChange={(e) => setETelefono(e.target.value.replace(/[^0-9]/g, ''))} inputProps={{ inputMode: 'numeric' }} fullWidth />
            <FormControl fullWidth>
              <InputLabel id="estado-proc-label">Estado del proceso</InputLabel>
              <Select labelId="estado-proc-label" label="Estado del proceso" value={eEstado} onChange={(e) => setEEstado(e.target.value as any)}>
                <MenuItem value={'iniciado'}>Iniciado</MenuItem>
                <MenuItem value={'finalizado'}>Finalizado</MenuItem>
                <MenuItem value={'en_pausa'}>En Pausa</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpenEdit(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSaveEdit}>Guardar</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={toast.open} autoHideDuration={2400} onClose={() => setToast({ open: false, msg: '' })} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={toast.type || 'success'} variant="filled" sx={{ borderRadius: 2 }}>
          {toast.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
