'use client';

import { useEffect, useRef, useState } from 'react';
import { Suspense, type Dispatch, type SetStateAction } from 'react';
import Image from 'next/image';
import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
} from '@mui/material';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import SettingsSuggestOutlinedIcon from '@mui/icons-material/SettingsSuggestOutlined';
import PersonAddAlt1OutlinedIcon from '@mui/icons-material/PersonAddAlt1Outlined';
import { RegisterForm } from '@/app/(auth)/register/page';
import { useSearchParams } from 'next/navigation';
import PermissionGate from '@/components/(auth)/PermissionGate';

export const dynamic = 'force-dynamic';
type ToastState = { open: boolean; msg: string; type?: 'success' | 'error' };

function ParamsWatcher({
  setGConnected,
  setToast,
}: {
  setGConnected: Dispatch<SetStateAction<boolean>>;
  setToast: Dispatch<SetStateAction<ToastState>>;
}) {
  const searchParams = useSearchParams();

  useEffect(() => {
    const google = searchParams.get('google');
    const status = searchParams.get('status');
    if ((google === 'connected' || status === 'success') && typeof window !== 'undefined') {
      localStorage.setItem('calendar:connected', '1');
      setGConnected(true);
      setToast({ open: true, msg: 'Google Calendar conectado', type: 'success' });
      // Optional: clean URL params if desired
      // history.replaceState(null, '', window.location.pathname);
    }
  }, [searchParams, setGConnected, setToast]);

  return null;
}

export default function SettingsPage() {
  
  const [toast, setToast] = useState<ToastState>({
    open: false,
    msg: '',
  });
  const [openRegister, setOpenRegister] = useState(false);

  // Persistimos el estado de conexión con Google Calendar
  const [gConnected, setGConnected] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('calendar:connected') === '1';
  });

  const popupRef = useRef<Window | null>(null);

  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, '') || '';
    let backendOrigin: string | undefined;
    try {
      backendOrigin = new URL(base).origin;
    } catch {}

    function onMsg(e: MessageEvent) {
      // Validar que el mensaje venga del backend autorizado
      if (backendOrigin && e.origin !== backendOrigin) return;
      if (e.data === 'google-connected') {
        localStorage.setItem('calendar:connected', '1');
        setGConnected(true);
        setToast({ open: true, msg: 'Google Calendar conectado', type: 'success' });
        try {
          popupRef.current?.close();
        } catch {}
      }
    }

    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, []);

  function handleConnectClick() {
    const base = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, '') || '';
    if (typeof window === 'undefined') return;

    const w = 520,
      h = 640;
    const left = window.screenX + (window.outerWidth - w) / 2;
    const top = window.screenY + (window.outerHeight - h) / 2;
    const url = `${base}/google/connect?origin=${encodeURIComponent(window.location.origin)}`;
    popupRef.current = window.open(
      url,
      'google_oauth',
      `width=${w},height=${h},left=${left},top=${top},resizable=yes,scrollbars=yes,status=no`
    );
  }

  return (
    <PermissionGate required="config:write" fallbackHref="/dashboard">
      <Suspense fallback={null}>
        <ParamsWatcher setGConnected={setGConnected} setToast={setToast} />
      </Suspense>
      <Box className="space-y-4">
        {/* Encabezado */}
        <Box className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <Typography variant="h5" className="font-semibold text-purple-900">
            Configuración
          </Typography>
          <Chip icon={<SettingsSuggestOutlinedIcon />} label="Ajustes" variant="outlined" />
        </Box>

        {/* Tarjetas: Google Calendar + Crear usuario */}
        <Box className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card: Conectar Google Calendar */}
          <Paper className="p-6" sx={{ minHeight: { xs: 220, md: 260 } }}>
            <Box className="h-full flex flex-col justify-between">
              <Box className="flex items-start gap-3">
                <Image src="/calendar.webp" alt="Google Calendar" width={40} height={40} />
                <Box>
                  <Typography variant="h6" className="font-semibold mb-1">
                    Conectar Google Calendar
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Vincula tu cuenta para que Google envíe recordatorios y notificaciones de citas.
                  </Typography>
                </Box>
              </Box>

              <Box className="flex items-center gap-2 mt-6">
                {gConnected && <Chip size="small" color="success" label="Conectado" />}
                <Button
                  onClick={handleConnectClick}
                  variant={gConnected ? 'outlined' : 'contained'}
                  startIcon={<CalendarMonthOutlinedIcon />}
                  disabled={gConnected}
                  sx={(theme) => ({
                    borderRadius: 999,
                    textTransform: 'none',
                    px: 2.5,
                    py: 1.25,
                    fontWeight: 600,
                    boxShadow: 'none',
                    bgcolor: gConnected ? 'background.paper' : undefined,
                    '&:hover': gConnected ? { bgcolor: theme.palette.grey[100] } : undefined,
                  })}
                >
                  {gConnected ? 'Conectado' : 'Conectar con Google Calendar'}
                </Button>
              </Box>
            </Box>
          </Paper>

          {/* Card: Crear usuario */}
          <Paper className="p-6" sx={{ minHeight: { xs: 220, md: 260 } }}>
            <Box className="h-full flex flex-col justify-between">
              <Box className="flex items-start gap-3">
                <PersonAddAlt1OutlinedIcon color="primary" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h6" className="font-semibold mb-1">
                    Crear usuario
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Agrega miembros del equipo con su rol. El acceso a menús y acciones se controla por permisos.
                  </Typography>
                </Box>
              </Box>

              <Box className="mt-6">
                <Button
                  onClick={() => setOpenRegister(true)}
                  variant="contained"
                  startIcon={<PersonAddAlt1OutlinedIcon />}
                  sx={{ borderRadius: 999, textTransform: 'none', px: 2.5, py: 1.25, fontWeight: 600, boxShadow: 'none' }}
                  className="bg-gradient-to-r from-blue-500 to-pink-500 hover:opacity-90"
                >
                  Nuevo usuario
                </Button>
              </Box>
            </Box>
          </Paper>
        </Box>

        {/* Modal: Registro */}
        <Dialog
          open={openRegister}
          onClose={() => setOpenRegister(false)}
          fullWidth
          maxWidth="sm"
          PaperProps={{ sx: { borderRadius: 3 } }}
        >
          <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>Crear usuario</DialogTitle>
          <DialogContent dividers sx={{ p: { xs: 2.5, sm: 3 } }}>
            <RegisterForm
              onSuccess={() => {
                setOpenRegister(false);
                setToast({ open: true, msg: 'Usuario creado', type: 'success' });
              }}
            />
          </DialogContent>
        </Dialog>

        <Snackbar
          open={toast.open}
          autoHideDuration={2500}
          onClose={() => setToast({ open: false, msg: '' })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert severity={toast.type || 'success'} variant="filled" sx={{ borderRadius: 2 }}>
            {toast.msg}
          </Alert>
        </Snackbar>
      </Box>
    </PermissionGate>
  );
}