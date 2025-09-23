'use client';

import { Box, Paper, Typography, TextField, Button, Stack } from '@mui/material';
import Link from 'next/link';
import { useAuthStore } from '@/lib/auth-store';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const setToken = useAuthStore((s) => s.setToken);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fakeJwt = 'demo.jwt.token';
    setToken(fakeJwt);
    router.replace('/dashboard');

    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', window.location.href);
      window.onpopstate = () => window.history.go(1);
    }
  };

  return (
    <Box
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-100 via-white to-pink-100 px-4"
    >
      <Paper
        elevation={3}
        className="w-full max-w-md rounded-2xl shadow-lg"
        sx={{ p: { xs: 3, sm: 4, md: 5 } }}
      >
        <Typography
          variant="h5"
          className="font-bold text-center mb-2 text-purple-900"
          sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem' } }}
        >
          Bienvenido
        </Typography>
        <Typography className="text-gray-600 text-center mb-6">
          Inicia sesión para continuar
        </Typography>

        {/* Formulario con espacios y responsive */}
        <form onSubmit={handleSubmit}>
          <Stack spacing={4}>
            <TextField
              label="Usuario"
              fullWidth
              variant="standard"
              margin="normal"
              autoComplete="username"
              required
            />

            <TextField
              label="Contraseña"
              type="password"
              fullWidth
              variant="standard"
              margin="normal"
              autoComplete="current-password"
              required
            />

            <Button
              type="submit"
              fullWidth
              size="large"
              className="bg-gradient-to-r from-blue-500 to-pink-500 text-white font-semibold rounded-md shadow-md hover:opacity-90"
              sx={{ py: 1.25, mt: 2 }}
              onClick={() => router.replace('/dashboard')}
            >
              INICIAR SESIÓN
            </Button>
          </Stack>
        </form>

        <Typography className="text-center text-sm text-gray-700" mt={8}>
          ¿No tienes una cuenta?{' '}
          <Link href="/register" className="text-purple-600 font-medium">
            Regístrate
          </Link>
        </Typography>
      </Paper>
    </Box>
  );
}