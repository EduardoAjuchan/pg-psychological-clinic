#!/usr/bin/env bash
set -euo pipefail

echo "[1/6] Instalando Driver.js…"
npm install driver.js --save

echo "[2/6] Creando carpetas…"
mkdir -p "src/app/(auth)/login"
mkdir -p "src/app/(protected)/dashboard"
mkdir -p "src/app/(protected)/pacientes"
mkdir -p "src/app/(protected)/citas"
mkdir -p "src/app/api/health"
mkdir -p "src/components/auth"
mkdir -p "src/components/layout"
mkdir -p "src/components/ui"
mkdir -p "src/lib"
mkdir -p "src/modules/tour"
mkdir -p "src/modules/pacientes/types"
mkdir -p "src/modules/pacientes/services"
mkdir -p "src/modules/pacientes/hooks"
mkdir -p "src/modules/pacientes/pages"
mkdir -p "src/hooks"
mkdir -p "src/utils"

echo "[3/6] Escribiendo archivos…"

# Root layout
cat > "src/app/layout.tsx" <<'TSX'
import type { Metadata } from 'next';
import { CssBaseline, ThemeProvider } from '@mui/material';
import theme from '@/lib/theme';
import 'driver.js/dist/driver.css';
import './globals.css';

export const metadata: Metadata = {
  title: 'Clínica | Frontend',
  description: 'Frontend de la clínica psicológica',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
TSX

# Home redirect
cat > "src/app/page.tsx" <<'TSX'
import { redirect } from 'next/navigation';
export default function Home() {
  redirect('/dashboard');
}
TSX

# API mock
cat > "src/app/api/health/route.ts" <<'TS'
import { NextResponse } from 'next/server';
export function GET() {
  return NextResponse.json({ ok: true });
}
TS

# Protected layout
cat > "src/app/(protected)/layout.tsx" <<'TSX'
import AuthGuard from '@/components/auth/AuthGuard';
import Shell from '@/components/layout/Shell';
import TourProvider from '@/modules/tour/TourProvider';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <TourProvider>
        <Shell>{children}</Shell>
      </TourProvider>
    </AuthGuard>
  );
}
TSX

# Protected pages
cat > "src/app/(protected)/dashboard/page.tsx" <<'TSX'
export default function DashboardPage() {
  return <div id="dashboard-kpis" className="space-y-2">Bienvenido. KPIs próximamente.</div>;
}
TSX

cat > "src/app/(protected)/pacientes/page.tsx" <<'TSX'
import PacientesListPage from '@/modules/pacientes/pages/ListPage';
export default function PacientesPage() {
  return <PacientesListPage />;
}
TSX

cat > "src/app/(protected)/citas/page.tsx" <<'TSX'
'use client';
import { Grid, Card, CardContent, Typography } from '@mui/material';
const citas = [
  { id: 1, fecha: '2025-09-23', hora: '10:00', paciente: 'Juan Pérez' },
  { id: 2, fecha: '2025-09-23', hora: '11:30', paciente: 'María López' },
];
export default function CitasPage() {
  return (
    <Grid id="citas-grid" container spacing={2}>
      {citas.map(c => (
        <Grid item xs={12} md={6} lg={4} key={c.id}>
          <Card><CardContent>
            <Typography variant="h6">{c.paciente}</Typography>
            <Typography>{c.fecha} • {c.hora}</Typography>
          </CardContent></Card>
        </Grid>
      ))}
    </Grid>
  );
}
TSX

# Login
cat > "src/app/(auth)/login/page.tsx" <<'TSX'
'use client';
import { Box, Button, TextField, Typography, Paper } from '@mui/material';
import { useAuthStore } from '@/lib/auth-store';
import { useRouter, useSearchParams } from 'next/navigation';

export default function LoginPage() {
  const setToken = useAuthStore((s) => s.setToken);
  const router = useRouter();
  const params = useSearchParams();
  const from = params.get('from') || '/dashboard';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fakeJwt = 'demo.jwt.token';
    setToken(fakeJwt);
    router.replace(from);
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', window.location.href);
      window.onpopstate = () => { window.history.go(1); };
    }
  };

  return (
    <Box className="min-h-screen flex items-center justify-center">
      <Paper className="p-8 w-full max-w-md">
        <Typography variant="h5" className="mb-6">Iniciar sesión</Typography>
        <form onSubmit={handleSubmit} className="space-y-4">
          <TextField label="Usuario" fullWidth required />
          <TextField label="Contraseña" type="password" fullWidth required />
          <Button type="submit" fullWidth size="large">Entrar</Button>
        </form>
      </Paper>
    </Box>
  );
}
TSX

# Layout components
cat > "src/components/layout/Sidebar.tsx" <<'TSX'
'use client';
import Link from 'next/link';
import { List, ListItemButton, ListItemIcon, ListItemText, Drawer, Toolbar } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import EventIcon from '@mui/icons-material/Event';

export default function Sidebar() {
  return (
    <Drawer id="app-sidebar" variant="permanent" sx={{ width: 240, [`& .MuiDrawer-paper`]: { width: 240 } }}>
      <Toolbar />
      <List>
        <ListItemButton component={Link} href="/dashboard">
          <ListItemIcon><DashboardIcon /></ListItemIcon>
          <ListItemText primary="Inicio" />
        </ListItemButton>
        <ListItemButton component={Link} href="/pacientes">
          <ListItemIcon><PeopleIcon /></ListItemIcon>
          <ListItemText primary="Pacientes" />
        </ListItemButton>
        <ListItemButton component={Link} href="/citas">
          <ListItemIcon><EventIcon /></ListItemIcon>
          <ListItemText primary="Citas" />
        </ListItemButton>
      </List>
    </Drawer>
  );
}
TSX

cat > "src/components/layout/Topbar.tsx" <<'TSX'
'use client';
import { AppBar, Toolbar, Typography, Button } from '@mui/material';
import { useAuthStore } from '@/lib/auth-store';
import { useRouter } from 'next/navigation';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { useTourStore } from '@/modules/tour/tour.store';

export default function Topbar() {
  const logout = useAuthStore((s) => s.logout);
  const router = useRouter();
  const requestStart = useTourStore((s) => s.requestStart);

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  return (
    <AppBar id="app-topbar" position="fixed" elevation={0}>
      <Toolbar className="flex justify-between">
        <Typography variant="h6">Clínica</Typography>
        <div className="flex items-center gap-2">
          <Button onClick={() => requestStart()} color="inherit" startIcon={<HelpOutlineIcon />}>
            Ayuda
          </Button>
          <Button onClick={handleLogout} color="inherit">Cerrar sesión</Button>
        </div>
      </Toolbar>
    </AppBar>
  );
}
TSX

cat > "src/components/layout/Shell.tsx" <<'TSX'
'use client';
import { Box, Toolbar, Container, Paper } from '@mui/material';
import Topbar from './Topbar';
import Sidebar from './Sidebar';

export default function Shell({ children }: { children: React.ReactNode }) {
  return (
    <Box sx={{ display: 'flex' }}>
      <Topbar />
      <Sidebar />
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        <Container maxWidth="lg">
          <Paper className="p-4">{children}</Paper>
        </Container>
      </Box>
    </Box>
  );
}
TSX

# AuthGuard
cat > "src/components/auth/AuthGuard.tsx" <<'TSX'
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { token } = useAuthStore();
  const router = useRouter();
  useEffect(() => { if (!token) router.replace('/login'); }, [token, router]);
  return <>{children}</>;
}
TSX

# UI table
cat > "src/components/ui/DataTable.tsx" <<'TSX'
'use client';
import * as React from 'react';
type Col<T> = { key: keyof T; header: string; render?: (row: T) => React.ReactNode };
export default function DataTable<T extends { id: string }>({
  columns, data, emptyText = 'Sin datos',
}: { columns: Col<T>[]; data: T[]; emptyText?: string; }) {
  if (!data?.length) return <div className="text-sm text-gray-500">{emptyText}</div>;
  return (
    <div className="overflow-x-auto border rounded-md">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50">
          <tr>{columns.map(c => (<th key={String(c.key)} className="text-left px-4 py-2 font-semibold">{c.header}</th>))}</tr>
        </thead>
        <tbody>
          {data.map(row => (
            <tr key={row.id} className="odd:bg-white even:bg-gray-50">
              {columns.map(c => (<td key={String(c.key)} className="px-4 py-2">{c.render ? c.render(row) : String(row[c.key])}</td>))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
TSX

# Libs
cat > "src/lib/theme.ts" <<'TS'
'use client';
import { createTheme } from '@mui/material/styles';
const theme = createTheme({
  cssVariables: true,
  typography: { fontFamily: ['Inter','system-ui','-apple-system','Segoe UI','Roboto','Arial'].join(',') },
  shape: { borderRadius: 12 },
  components: { MuiButton: { defaultProps: { variant: 'contained' } } },
  palette: { mode: 'light', primary: { main: '#1976d2' }, secondary: { main: '#6d4aff' } },
});
export default theme;
TS

cat > "src/lib/axios.ts" <<'TS'
import axios from 'axios';
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000',
  withCredentials: true,
});
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token');
      document.cookie = 'auth=; Max-Age=0; path=/';
      window.location.replace('/login');
    }
    return Promise.reject(err);
  }
);
export default api;
TS

cat > "src/lib/auth-store.ts" <<'TS'
'use client';
import { create } from 'zustand';
type AuthState = { token: string | null; setToken: (t: string | null) => void; logout: () => void; };
export const useAuthStore = create<AuthState>((set) => ({
  token: typeof window !== 'undefined' ? localStorage.getItem('token') : null,
  setToken: (t) => {
    if (typeof window !== 'undefined') {
      if (t) localStorage.setItem('token', t); else localStorage.removeItem('token');
      document.cookie = t ? 'auth=1; path=/' : 'auth=; Max-Age=0; path=/';
    }
    set({ token: t });
  },
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      document.cookie = 'auth=; Max-Age=0; path=/';
      window.history.pushState(null, '', window.location.href);
      window.onpopstate = () => { window.history.go(1); };
    }
    set({ token: null });
  },
}));
TS

# Middleware
cat > "src/middleware.ts" <<'TS'
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
const PROTECTED_PREFIXES = ['/dashboard', '/pacientes', '/citas'];
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  const logged = Boolean(req.cookies.get('auth')?.value);
  const res = NextResponse.next();
  if (isProtected) {
    res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.headers.set('Pragma', 'no-cache'); res.headers.set('Expires', '0'); res.headers.set('Surrogate-Control', 'no-store');
  }
  if (isProtected && !logged) {
    const url = req.nextUrl.clone(); url.pathname = '/login'; url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }
  return res;
}
export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico|api/health).*)'] };
TS

# Tour
cat > "src/modules/tour/tour.store.ts" <<'TS'
'use client';
import { create } from 'zustand';
type TourState = { seen: boolean; setSeen: (v: boolean) => void; startRequested: boolean; requestStart: () => void; clearStart: () => void; };
export const useTourStore = create<TourState>((set) => ({
  seen: typeof window !== 'undefined' ? !!localStorage.getItem('tour_seen') : false,
  setSeen: (v) => { if (typeof window !== 'undefined') { v ? localStorage.setItem('tour_seen','1') : localStorage.removeItem('tour_seen'); } set({ seen: v }); },
  startRequested: false, requestStart: () => set({ startRequested: true }), clearStart: () => set({ startRequested: false }),
}));
TS

cat > "src/modules/tour/steps.ts" <<'TS'
import type { DriverStep } from 'driver.js';
export const baseSteps: DriverStep[] = [
  { element: '#app-topbar', popover: { title: 'Barra superior', description: 'Acciones globales como cerrar sesión y ayuda.', side: 'bottom', align: 'start' } },
  { element: '#app-sidebar', popover: { title: 'Menú lateral', description: 'Navega entre Inicio, Pacientes y Citas.', side: 'right', align: 'start' } },
  { element: '#dashboard-kpis', popover: { title: 'Dashboard', description: 'Aquí irán tus KPIs.', side: 'top', align: 'center' } },
  { element: '#pacientes-list', popover: { title: 'Pacientes', description: 'Listado y acciones básicas.', side: 'top', align: 'center' } },
  { element: '#citas-grid', popover: { title: 'Citas', description: 'Tarjetas por fecha y hora.', side: 'top', align: 'center' } },
];
TS

cat > "src/modules/tour/TourProvider.tsx" <<'TSX'
'use client';
import { useEffect, useMemo } from 'react';
import { driver } from 'driver.js';
import { usePathname } from 'next/navigation';
import { useTourStore } from './tour.store';
import { baseSteps } from './steps';

export default function TourProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { seen, setSeen, startRequested, clearStart } = useTourStore();

  const steps = useMemo(() => {
    if (!pathname.startsWith('/dashboard')) {
      return baseSteps.filter(s => (s.element as string) !== '#dashboard-kpis');
    }
    return baseSteps;
  }, [pathname]);

  useEffect(() => {
    const d = driver({
      showProgress: true, animate: true, overlayColor: 'rgba(0,0,0,0.5)',
      allowClose: true, nextBtnText: 'Siguiente', prevBtnText: 'Atrás', doneBtnText: 'Listo',
      onDestroyStarted: () => { setSeen(true); clearStart(); },
    });

    if (!seen) {
      const t = setTimeout(() => { d.setSteps(steps); d.drive(); }, 250);
      return () => clearTimeout(t);
    }
    if (startRequested) {
      const t = setTimeout(() => { d.setSteps(steps); d.drive(); }, 100);
      return () => clearTimeout(t);
    }
  }, [seen, startRequested, clearStart, setSeen, steps]);

  return <>{children}</>;
}
TSX

# Pacientes módulo
cat > "src/modules/pacientes/types/pacientes.ts" <<'TS'
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
TS

cat > "src/modules/pacientes/services/pacientes.service.ts" <<'TS'
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
TS

cat > "src/modules/pacientes/hooks/usePacientes.ts" <<'TS'
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
TS

cat > "src/modules/pacientes/pages/ListPage.tsx" <<'TSX'
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
TSX

# Hooks/Utils placeholders
cat > "src/hooks/useConfirm.ts" <<'TS'
export {};
TS
cat > "src/utils/format.ts" <<'TS'
export {};
TS

# next.config.ts (respeta si ya existe; solo lo creamos si no está)
if [ ! -f "next.config.ts" ]; then
cat > "next.config.ts" <<'TS'
import type { NextConfig } from 'next';
const nextConfig: NextConfig = {
  async rewrites() {
    return process.env.NEXT_PUBLIC_API_BASE_URL ? [] : [
      { source: '/api/:path*', destination: 'http://localhost:4000/:path*' },
    ];
  },
};
export default nextConfig;
TS
fi

# .env.local
if [ ! -f ".env.local" ]; then
cat > ".env.local" <<'ENV'
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
ENV
fi

echo "[4/6] Todo escrito."
echo "[5/6] Typecheck rápido…"
npm run -s type-check || true

echo "[6/6] Listo. Arranca con:  npm run dev"
