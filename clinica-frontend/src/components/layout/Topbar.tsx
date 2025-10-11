'use client';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useAuthStore } from '@/lib/auth-store';
import { useRouter } from 'next/navigation';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';

export default function Topbar() {
  const logout = useAuthStore((s) => s.logout);
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  return (
    <AppBar
      id="app-topbar"
      position="fixed"
      elevation={0}
      color="default"
      sx={{
        bgcolor: 'background.paper',
        color: 'text.primary',
        boxShadow: (theme) => theme.shadows[1],
        borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
      }}
    >
      {/* Agregamos padding-left en móviles para que el título no quede debajo del botón flotante del sidebar */}
      <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', minHeight: { xs: 56, sm: 64 } }}>
        <Typography
          variant="h6"
          noWrap
          sx={{ fontWeight: 600, fontSize: { xs: '1rem', sm: '1.125rem' }, pl: { xs: 6, sm: 3 }, color: 'text.primary', flexShrink: 0 }}
        >
          Clínica
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Cerrar sesión con color de paleta de error */}
          <Button
            onClick={handleLogout}
            startIcon={<LogoutOutlinedIcon />}
            disableRipple
            sx={(theme) => ({
              textTransform: 'none',
              fontWeight: 500,
              px: 1,
              py: 0.75,
              borderRadius: 1,
              bgcolor: 'background.paper',
              boxShadow: 'none',
              color: theme.palette.error.main,
              '&:hover': { bgcolor: theme.palette.grey[200] },
              gap: 0.5,
              minWidth: 0,
              justifyContent: { xs: 'center', sm: 'flex-start' },
            })}
          >
            <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Cerrar sesión</Box>
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
