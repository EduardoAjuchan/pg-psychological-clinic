'use client';

import { Card, CardContent, Typography, Skeleton, Box, Divider, Chip } from '@mui/material';
import KpiCard from '@/components/ui/KpiCard';

export default function DashboardPage() {
  return (
    <Box id="dashboard-kpis" className="space-y-6">
      {/* Encabezado */}
      <Box className="flex items-center justify-between">
        <Typography variant="h5" className="font-semibold">Panel principal</Typography>
        <Chip label="Demo" color="primary" variant="outlined" />
      </Box>

      {/* KPIs principales (Tailwind grid) */}
      <Box className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Pacientes activos" value="—" helper="Últimos 30 días" loading />
        <KpiCard title="Citas hoy" value="—" helper="Actualizado cada 5 min" loading />
        <KpiCard title="NPS" value="—" helper="Encuestas cerradas" loading suffix="%" />
        <KpiCard title="Resuelto por el bot" value="—" helper="Interacciones sin agente" loading suffix="%" />
      </Box>

      {/* Gráfica / Tendencias */}
      <Box className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <Box className="lg:col-span-8">
          <Card>
            <CardContent>
              <Typography variant="subtitle1" className="font-medium">Tendencia de citas</Typography>
              <Typography variant="body2" color="text.secondary" className="mb-4">
                Próximamente: línea de tiempo semanal con citas programadas, atendidas y canceladas.
              </Typography>
              {/* Placeholder de “gráfica” */}
              <Box className="w-full" sx={{ height: 220 }}>
                <Skeleton variant="rounded" height="100%" />
              </Box>
            </CardContent>
          </Card>
        </Box>

        <Box className="lg:col-span-4">
          <Card>
            <CardContent>
              <Typography variant="subtitle1" className="font-medium">Top motivos de consulta</Typography>
              <Typography variant="body2" color="text.secondary" className="mb-4">
                Próximamente: distribución por categorías de la semana.
              </Typography>
              <Box className="space-y-2">
                <Skeleton variant="rounded" height={30} />
                <Skeleton variant="rounded" height={30} />
                <Skeleton variant="rounded" height={30} />
                <Skeleton variant="rounded" height={30} />
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Actividad reciente / Próximas citas */}
      <Box className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent>
            <Typography variant="subtitle1" className="font-medium">Próximas citas</Typography>
            <Divider className="my-3" />
            <Box className="space-y-3">
              <Skeleton variant="rounded" height={56} />
              <Skeleton variant="rounded" height={56} />
              <Skeleton variant="rounded" height={56} />
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="subtitle1" className="font-medium">Actividad reciente</Typography>
            <Divider className="my-3" />
            <Box className="space-y-3">
              <Skeleton variant="text" height={28} />
              <Skeleton variant="text" height={28} />
              <Skeleton variant="text" height={28} />
              <Skeleton variant="text" height={28} />
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}