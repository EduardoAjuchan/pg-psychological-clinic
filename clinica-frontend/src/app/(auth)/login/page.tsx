'use client';

import { useRef, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import api from '@/lib/axios';

export default function LoginPage() {
  const router = useRouter();
  const setToken = useAuthStore((s) => s.setToken);

  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 2FA state (OTP de 6 dígitos en cajitas)
  const [open2FA, setOpen2FA] = useState(false);
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [codeError, setCodeError] = useState<string | null>(null);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const preventBack = () => {
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', window.location.href);
      window.onpopstate = () => window.history.go(1);
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { usuario, password });
      if (data?.ok && data?.requires2FA) {
        setOpen2FA(true);
        // Foco al primer dígito
        setTimeout(() => inputRefs.current[0]?.focus(), 50);
      } else {
        setError('Respuesta inesperada del servidor.');
      }
    } catch (err: any) {
      const status = err?.response?.status;
      const msg = err?.response?.data?.message || 'Error al iniciar sesión.';
      if (status === 429) setError(msg);
      else setError(msg);
    } finally {
      setLoading(false);
    }
  }

  const joinedCode = () => otp.join('');
  const isValidCode = () => /^\d{6}$/.test(joinedCode());

  function handleOtpChange(index: number, value: string) {
    const v = value.replace(/\D/g, '').slice(0, 1);
    const next = [...otp];
    next[index] = v;
    setOtp(next);

    if (v && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) {
    if (e.key === 'Backspace') {
      if (otp[index]) {
        const next = [...otp];
        next[index] = '';
        setOtp(next);
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    }
    if (e.key === 'ArrowLeft' && index > 0) inputRefs.current[index - 1]?.focus();
    if (e.key === 'ArrowRight' && index < 5) inputRefs.current[index + 1]?.focus();
  }

  function handleOtpPaste(e: React.ClipboardEvent<HTMLInputElement | HTMLTextAreaElement>) {
    e.preventDefault();
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!text) return;
    const next = text.split('');
    while (next.length < 6) next.push('');
    setOtp(next);
    // Enfocar el último no vacío o el final
    const last = Math.min(text.length, 6) - 1;
    setTimeout(() => inputRefs.current[last >= 0 ? last : 0]?.focus(), 0);
  }

  async function handleVerify2FA(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setCodeError(null);
    if (!isValidCode()) {
      setCodeError('Ingresa el código de 6 dígitos');
      return;
    }
    try {
      setLoading(true);
      const { data } = await api.post('/auth/login/2fa/verify', { token: joinedCode() });
      if (data?.ok && data?.token && data?.user) {
        const token: string = data.token;
        const permisos: string[] = data.user?.permisos || [];
        setToken(token);
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth:token', token);
          localStorage.setItem('auth:permissions', JSON.stringify(permisos));
          localStorage.setItem('auth:user', JSON.stringify(data.user));
        }
        setOpen2FA(false);
        // Forzar navegación para evitar condiciones de carrera con guards/hidratación
        if (typeof window !== 'undefined') {
          window.location.replace('/dashboard');
          setTimeout(() => preventBack(), 0);
        }
      } else {
        setCodeError('Código incorrecto, intenta de nuevo.');
        setOtp(['', '', '', '', '', '']);
        setTimeout(() => inputRefs.current[0]?.focus(), 0);
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Código 2FA incorrecto.';
      setCodeError(msg);
      setOtp(['', '', '', '', '', '']);
      setTimeout(() => inputRefs.current[0]?.focus(), 0);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-100 via-white to-pink-100 px-4">
      <Paper elevation={3} className="w-full max-w-md rounded-2xl shadow-lg" sx={{ p: { xs: 3, sm: 4, md: 5 } }}>
        <Typography
          variant="h5"
          className="font-bold text-center mb-2 text-purple-900"
          sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem' } }}
        >
          Bienvenido
        </Typography>
        <Typography className="text-gray-600 text-center mb-6">Inicia sesión para continuar</Typography>

        <form onSubmit={handleSubmit}>
          <Stack spacing={4}>
            <TextField
              label="Usuario"
              fullWidth
              variant="standard"
              margin="normal"
              autoComplete="username"
              required
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
            />

            <TextField
              label="Contraseña"
              type={showPassword ? 'text' : 'password'}
              fullWidth
              variant="standard"
              margin="normal"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword((prev) => !prev)}>
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            {error ? <Typography color="error" variant="body2">{error}</Typography> : null}

            <Button
              type="submit"
              fullWidth
              size="large"
              disabled={loading}
              className="bg-gradient-to-r from-blue-500 to-pink-500 text-white font-semibold rounded-md shadow-md hover:opacity-90 disabled:opacity-60"
              sx={{ py: 1.25, mt: 2 }}
            >
              {loading ? 'Procesando…' : 'INICIAR SESIÓN'}
            </Button>
          </Stack>
        </form>
      </Paper>

      {/* Dialogo 2FA con OTP boxes */}
      <Dialog
        open={open2FA}
        onClose={() => !loading && setOpen2FA(false)}
        fullWidth
        maxWidth="xs"
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>Verificación 2FA</DialogTitle>
        <DialogContent dividers sx={{ pt: 2 }}>
          <Typography variant="body2" color="text.secondary" className="mb-3">
            Ingresa el código de 6 dígitos generado por tu app de autenticación.
          </Typography>

          <Box className="flex items-center justify-between gap-2" sx={{ mt: 1 }}>
            {otp.map((val, idx) => (
              <TextField
                key={idx}
                value={val}
                onChange={(e) => handleOtpChange(idx, e.target.value)}
                inputRef={(el) => (inputRefs.current[idx] = el)}
                inputProps={{
                  inputMode: 'numeric',
                  pattern: '\\d*',
                  maxLength: 1,
                  style: { textAlign: 'center', fontSize: '1.25rem', letterSpacing: '0.1em' },
                  onKeyDown: (e) => handleOtpKeyDown(idx, e),
                  onPaste: idx === 0 ? handleOtpPaste : undefined,
                }}
                variant="outlined"
                sx={{
                  width: { xs: 44, sm: 48 },
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    bgcolor: 'background.paper',
                  },
                }}
              />
            ))}
          </Box>

          {codeError ? (
            <Typography color="error" variant="caption" className="block mt-2">{codeError}</Typography>
          ) : (
            <Typography variant="caption" color="text.secondary" className="block mt-2">&nbsp;</Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpen2FA(false)} disabled={loading}>Cancelar</Button>
          <Button onClick={handleVerify2FA} variant="contained" disabled={loading || !isValidCode()}>
            Verificar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}