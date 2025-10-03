'use client';

import { useState } from 'react';
import { Box, Paper, Typography, TextField, Button, Stack } from '@mui/material';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
// Cuando el backend esté listo, importaremos el servicio real:
// import api from '@/lib/axios';

export default function RegisterPage() {
  const router = useRouter();

  const [nombreCompleto, setNombreCompleto] = useState('');
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nombreCompleto || !usuario || !password) return;

    try {
      setLoading(true);
      // TODO: reemplazar por llamada real
      // await api.post('/auth/register', { nombreCompleto, usuario, password });
      // Por ahora, enviamos al login
      router.replace('/login');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-100 via-white to-pink-100 px-4">
      <Paper elevation={3} className="w-full max-w-md rounded-2xl shadow-lg" sx={{ p: { xs: 3, sm: 4, md: 5 } }}>
        <Typography variant="h5" className="font-bold text-center mb-2 text-purple-900">
          Crear Cuenta
        </Typography>
        <Typography className="text-gray-600 text-center mb-6">
          Completa tus datos
        </Typography>

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
              sx={{ mb: 3 }}
            />

            <Button
              type="submit"
              disabled={loading}
              fullWidth
              size="large"
              className="bg-gradient-to-r from-blue-500 to-pink-500 text-white font-semibold rounded-md shadow-md hover:opacity-90 disabled:opacity-60"
              sx={{ mt: 4, py: 1.25 }}
            >
              CREAR CUENTA
            </Button>
          </Stack>
        </form>

        <Typography className="text-center text-sm text-gray-700" sx={{ mt: 8 }}>
          ¿Ya tienes una cuenta?{' '}
          <Link href="/login" className="text-blue-600 font-medium">
            Inicia sesión
          </Link>
        </Typography>
      </Paper>
    </Box>
  );
}