'use client';

import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import api from '@/lib/axios';

// Helpers
const roleToId = (r: 'Admin' | 'Empleado'): 1 | 2 => (r === 'Admin' ? 1 : 2);
const passOk = (p: string) => /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{10,}$/.test(p);

export function RegisterForm({ onSuccess }: { onSuccess?: () => void }) {
  const router = useRouter();

  const [nombreCompleto, setNombreCompleto] = useState('');
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState<'Admin' | 'Empleado'>('Empleado');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 2FA setup state
  const [twoFAOpen, setTwoFAOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [tempSecret, setTempSecret] = useState<string>('');
  const [newUserId, setNewUserId] = useState<number | null>(null);
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'scan' | 'verify'>('scan');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!nombreCompleto || !usuario || !password || !rol) return;
    if (!passOk(password)) {
      setError('La contraseña debe tener al menos 10 caracteres, una mayúscula, un símbolo y números.');
      return;
    }

    try {
      setLoading(true);
      // 1) Crear usuario
      const body = {
        nombre: nombreCompleto,
        usuario,
        password,
        rol_id: roleToId(rol),
      };
      const createRes = await api.post('/usuarios', body);
      const created = createRes?.data;
      if (!created?.ok || !created?.user?.id) {
        throw new Error('Respuesta inesperada al crear usuario');
      }

      const uid = Number(created.user.id);
      setNewUserId(uid);

      // 2) Iniciar setup 2FA y abrir diálogo con QR
      const setupRes = await api.get(`/auth/2fa/setup/${uid}`);
      const { ok, qr_data_url, base32 } = setupRes.data || {};
      if (!ok || !qr_data_url || !base32) {
        throw new Error('No se pudo iniciar 2FA');
      }

      setQrDataUrl(qr_data_url as string);
      setTempSecret(base32 as string);
      setStep('scan');
      setTwoFAOpen(true);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'No se pudo crear el usuario';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify2FA() {
    if (!newUserId || !tempSecret) return;
    if (!/^\d{6}$/.test(otp)) {
      setError('Ingresa el código de 6 dígitos de tu app de autenticación.');
      return;
    }
    try {
      setLoading(true);
      const verifyRes = await api.post('/auth/2fa/verify-setup', {
        userId: newUserId,
        tempSecretBase32: tempSecret,
        token: otp,
      });
      if (verifyRes?.data?.ok) {
        setSuccessMsg('Usuario creado y 2FA habilitado correctamente.');
        setTwoFAOpen(false);
        if (onSuccess) onSuccess();
        else router.replace('/login');
      } else {
        setError('El código no es válido. Intenta nuevamente.');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'No se pudo verificar el 2FA';
      setError(msg);
    } finally {
      setLoading(false);
      setOtp('');
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit}>
        <Stack spacing={4}>
          <TextField
            label="Nombre Completo"
            fullWidth
            variant="standard"
            value={nombreCompleto}
            onChange={(e) => setNombreCompleto(e.target.value)}
            margin="normal"
            required
          />

          <TextField
            label="Nombre de Usuario"
            fullWidth
            variant="standard"
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            margin="normal"
            required
          />

          <TextField
            label="Contraseña"
            type="password"
            fullWidth
            variant="standard"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            margin="normal"
            required
            sx={{ mb: 1 }}
            helperText="Mín. 10 caracteres, una mayúscula, un símbolo y números"
            error={!!error && !passOk(password)}
          />

          <FormControl variant="standard" fullWidth required>
            <InputLabel id="rol-label">Rol</InputLabel>
            <Select
              labelId="rol-label"
              value={rol}
              onChange={(e) => setRol(e.target.value as 'Admin' | 'Empleado')}
              label="Rol"
            >
              <MenuItem value="Admin">Admin</MenuItem>
              <MenuItem value="Empleado">Empleado</MenuItem>
            </Select>
          </FormControl>

          {error && (
            <Alert severity="error" variant="outlined">
              {error}
            </Alert>
          )}
          {successMsg && (
            <Alert severity="success" variant="outlined">
              {successMsg}
            </Alert>
          )}

          <Button
            type="submit"
            disabled={loading}
            fullWidth
            size="large"
            className="bg-gradient-to-r from-blue-500 to-pink-500 text-white font-semibold rounded-md shadow-md hover:opacity-90 disabled:opacity-60"
            sx={{ mt: 2, py: 1.25 }}
          >
            {loading ? 'Guardando…' : 'CREAR CUENTA'}
          </Button>
        </Stack>
      </form>

      {/* Dialogo 2FA */}
      <Dialog open={twoFAOpen} onClose={() => !loading && setTwoFAOpen(false)} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>Configurar 2FA</DialogTitle>
        <DialogContent dividers sx={{ p: { xs: 2.5, sm: 3 } }}>
          {step === 'scan' ? (
            <Box className="space-y-3">
              <Typography variant="body2" color="text.secondary">
                Escanea este código QR con tu app de autenticación (Google Authenticator, Authy, etc.).
              </Typography>
              {qrDataUrl ? (
                <Box className="w-full flex justify-center py-2">
                  {/* Usamos next/image para performance; fallback a img si falla */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrDataUrl} alt="QR 2FA" style={{ width: 220, height: 220 }} />
                </Box>
              ) : (
                <Typography variant="body2">Cargando QR…</Typography>
              )}
              <Alert severity="info" variant="outlined">
                Cuando termines, presiona "Ya lo escaneé" para ingresar el código.
              </Alert>
            </Box>
          ) : (
            <Box className="space-y-2">
              <Typography variant="body2" color="text.secondary">
                Ingresa el código de 6 dígitos generado por tu app.
              </Typography>
              <TextField
                label="Código 2FA"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                inputProps={{ inputMode: 'numeric', pattern: '\\d{6}', maxLength: 6 }}
                fullWidth
                variant="standard"
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setTwoFAOpen(false)} disabled={loading}>Cerrar</Button>
          {step === 'scan' ? (
            <Button variant="contained" onClick={() => setStep('verify')}>
              Ya lo escaneé
            </Button>
          ) : (
            <Button variant="contained" disabled={loading || !/^\d{6}$/.test(otp)} onClick={handleVerify2FA}>
              Verificar 2FA
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  return (
    <Box className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-100 via-white to-pink-100 px-4">
      <Paper elevation={3} className="w-full max-w-md rounded-2xl shadow-lg" sx={{ p: { xs: 3, sm: 4, md: 5 } }}>
        <Typography variant="h5" className="font-bold text-center mb-2 text-purple-900">
          Crear Cuenta
        </Typography>
        <Typography className="text-gray-600 text-center mb-6">Completa tus datos</Typography>
        <RegisterForm onSuccess={() => router.replace('/login')} />
      </Paper>
    </Box>
  );
}