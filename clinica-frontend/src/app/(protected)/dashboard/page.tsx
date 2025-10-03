'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Skeleton,
  Box,
  Divider,
  Button,
  Alert,
  Stack,
} from '@mui/material';
import KpiCard from '@/components/ui/KpiCard';
import api from '@/lib/axios';

// Date pickers
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';

// Charts (Recharts)
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

// Types
type Kpis = {
  pacientesActivos: number;
  citasFuturas: number;
  citasCanceladas: number;
  notas: number;
  pacientesNuevos: number;
};

type Charts = {
  appointmentsByDay: { date: string; count: number }[];
  appointmentsByStatus: { status: string; count: number }[];
  patientsByState: { state: string; count: number }[];
};

type DashboardResponse = {
  ok: boolean;
  kpis: Kpis;
  charts: Charts;
};

const PIE_COLORS = ['#7c3aed', '#06b6d4', '#f97316', '#0ea5e9', '#22c55e', '#ef4444'];

export default function DashboardPage() {
  const [from, setFrom] = useState<Dayjs | null>(null);
  const [to, setTo] = useState<Dayjs | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DashboardResponse | null>(null);

  const query = useMemo(() => {
    if (from && to) return `/dashboard?from=${from.format('YYYY-MM-DD')}&to=${to.format('YYYY-MM-DD')}`;
    if (from && !to) return `/dashboard?from=${from.format('YYYY-MM-DD')}`;
    return '/dashboard';
  }, [from, to]);

  async function fetchData() {
    try {
      setLoading(true);
      setError(null);
      const { data } = await api.get<DashboardResponse>(query);
      setData(data);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'No se pudo cargar el dashboard');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  // Quick ranges
  function setRange(type: 'hoy' | 'ult7' | 'mes') {
    const now = dayjs();
    if (type === 'hoy') {
      setFrom(now.startOf('day'));
      setTo(now.endOf('day'));
    } else if (type === 'ult7') {
      setFrom(now.subtract(6, 'day').startOf('day'));
      setTo(now.endOf('day'));
    } else {
      setFrom(now.startOf('month'));
      setTo(now.endOf('month'));
    }
  }

  return (
    <Box id="dashboard" className="space-y-6">
      {/* Encabezado */}
      <Box className="flex items-center justify-between flex-wrap gap-3">
        <Typography variant="h5" className="font-semibold">Panel principal</Typography>
      </Box>

      {/* Filtros de fecha */}
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Card>
          <CardContent>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'stretch', md: 'center' }}>
              <Box className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <DatePicker
                  label="Desde"
                  value={from}
                  onChange={(v) => setFrom(v)}
                  slotProps={{ textField: { variant: 'outlined', size: 'small', fullWidth: true } }}
                />
                <DatePicker
                  label="Hasta"
                  value={to}
                  onChange={(v) => setTo(v)}
                  slotProps={{ textField: { variant: 'outlined', size: 'small', fullWidth: true } }}
                />
              </Box>
              <Box
                sx={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 1,
                  justifyContent: { xs: 'flex-start', md: 'flex-end' },
                }}
              >
                <Button size="small" variant="text" sx={{ textTransform: 'none', px: 1.5 }} onClick={() => setRange('hoy')}>
                  Hoy
                </Button>
                <Button size="small" variant="text" sx={{ textTransform: 'none', px: 1.5 }} onClick={() => setRange('ult7')}>
                  Últimos 7 días
                </Button>
                <Button size="small" variant="text" sx={{ textTransform: 'none', px: 1.5 }} onClick={() => setRange('mes')}>
                  Este mes
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  onClick={fetchData}
                  sx={{ textTransform: 'none', px: 2, ml: { md: 1 }, width: { xs: '100%', sm: 'auto' } }}
                >
                  Aplicar
                </Button>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </LocalizationProvider>

      {error && <Alert severity="error">{error}</Alert>}

      {/* KPIs */}
      <Box className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {loading || !data ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}><CardContent><Skeleton variant="rounded" height={88} /></CardContent></Card>
          ))
        ) : (
          <>
            <KpiCard title="Pacientes activos" value={String(data.kpis.pacientesActivos)} helper="Periodo seleccionado" />
            <KpiCard title="Citas futuras" value={String(data.kpis.citasFuturas)} helper="Periodo seleccionado" />
            <KpiCard title="Citas canceladas" value={String(data.kpis.citasCanceladas)} helper="Periodo seleccionado" />
            <KpiCard title="Notas" value={String(data.kpis.notas)} helper="Periodo seleccionado" />
            <KpiCard title="Pacientes nuevos" value={String(data.kpis.pacientesNuevos)} helper="Periodo seleccionado" />
          </>
        )}
      </Box>

      {/* Gráficas */}
      {/* Citas por día a todo el ancho */}
      <Card>
        <CardContent>
          <Typography variant="subtitle1" className="font-medium">Citas por día</Typography>
          <Typography variant="body2" color="text.secondary" className="mb-4">Número de citas en el periodo.</Typography>
          <Box sx={{ width: '100%', height: { xs: 260, sm: 300, lg: 340 } }}>
            {loading || !data ? (
              <Skeleton variant="rounded" height="100%" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.charts.appointmentsByDay} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="colorAppt" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.45}/>
                      <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.05}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="count" stroke="#7c3aed" fill="url(#colorAppt)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Abajo: dos gráficas mitad y mitad, responsivas */}
      <Box className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Citas por estado */}
        <Card>
          <CardContent>
            <Typography variant="subtitle1" className="font-medium">Citas por estado</Typography>
            <Divider className="my-3" />
            <Box sx={{ width: '100%', height: { xs: 220, sm: 260 } }}>
              {loading || !data ? (
                <Skeleton variant="rounded" height="100%" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={data.charts.appointmentsByStatus} dataKey="count" nameKey="status" innerRadius={48} outerRadius={80} paddingAngle={4}>
                      {data.charts.appointmentsByStatus.map((_, idx) => (
                        <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend verticalAlign="bottom" height={24} />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </Box>
          </CardContent>
        </Card>

        {/* Estado de pacientes */}
        <Card>
          <CardContent>
            <Typography variant="subtitle1" className="font-medium">Estado de pacientes</Typography>
            <Divider className="my-3" />
            <Box sx={{ width: '100%', height: { xs: 220, sm: 260 } }}>
              {loading || !data ? (
                <Skeleton variant="rounded" height="100%" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={data.charts.patientsByState} dataKey="count" nameKey="state" innerRadius={45} outerRadius={78} paddingAngle={4}>
                      {data.charts.patientsByState.map((_, idx) => (
                        <Cell key={idx} fill={PIE_COLORS[(idx + 2) % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend verticalAlign="bottom" height={24} />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}