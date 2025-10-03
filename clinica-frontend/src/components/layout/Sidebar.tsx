'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  Drawer,
  Toolbar,
  List,
  ListItemButton,
  Divider,
  IconButton,
  Box,
  Typography,
  Tooltip,
} from '@mui/material';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import DiamondOutlinedIcon from '@mui/icons-material/DiamondOutlined';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import EventNoteOutlinedIcon from '@mui/icons-material/EventNoteOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import { hasPermission } from '@/lib/permissions';

const drawerWidth = 200;

type Item = {
  label: string;
  href: string;
  icon: React.ReactNode;
  match: (path: string) => boolean;
};

const items: Item[] = [
  { label: 'Inicio', href: '/dashboard', icon: <HomeOutlinedIcon fontSize="large" />, match: p => p.startsWith('/dashboard') },
  { label: 'Asistente', href: '/chat', icon: <DiamondOutlinedIcon fontSize="large" />, match: p => p.startsWith('/chat') },
  { label: 'Pacientes', href: '/pacientes', icon: <PeopleAltOutlinedIcon fontSize="large" />, match: p => p.startsWith('/pacientes') },
  // Ruta real existente: /citas. Mostramos etiqueta "Agenda".
  { label: 'Agenda', href: '/citas', icon: <EventNoteOutlinedIcon fontSize="large" />, match: p => p.startsWith('/citas') },
  { label: 'Ajustes', href: '/ajustes', icon: <SettingsOutlinedIcon fontSize="large" />, match: p => p.startsWith('/ajustes') },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // permisos
  const canConfig = hasPermission('config:write');

  const activeMap = useMemo(
    () =>
      items.reduce<Record<string, boolean>>((acc, it) => {
        acc[it.href] = it.match(pathname);
        return acc;
      }, {}),
    [pathname]
  );

  const content = (
    <Box
      id="app-sidebar"
      sx={{
        width: drawerWidth,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
      role="navigation"
      aria-label="Menú lateral"
    >
      <Toolbar sx={{ justifyContent: 'center', mt: 2, mb: { xs: 2.5, md: 0 } }}>
        {/* Logo desde /public/logo.webp */}
        <Link href="/dashboard" aria-label="Inicio">
          <Image src="/logo.webp" alt="Logo" width={80} height={80} priority />
        </Link>
      </Toolbar>
      <List sx={{ py: 0 }}>
        {items.map(it => {
          const selected = activeMap[it.href];
          const isSettings = it.href === '/ajustes';
          const disabled = isSettings && !canConfig;

          const button = (
            <ListItemButton
              component={disabled ? 'button' : Link}
              href={disabled ? undefined : it.href}
              selected={selected && !disabled}
              disabled={disabled}
              sx={{
                width: '100%',
                py: 2.5,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 1,
                color: selected && !disabled ? '#5b21b6' : 'text.primary',
                '& .sidebar-icon': {
                  color: selected && !disabled ? '#5b21b6' : 'text.secondary',
                },
                '&.Mui-selected': {
                  bgcolor: '#67e8f9', // cian suave como en el mock
                },
                '&:hover': {
                  bgcolor: selected && !disabled ? '#67e8f9' : 'action.hover',
                },
                '&.Mui-disabled': {
                  opacity: 0.5,
                  pointerEvents: 'none',
                },
              }}
              onClick={() => {
                if (!disabled) setMobileOpen(false);
              }}
            >
              <Box className="sidebar-icon" sx={{ fontSize: { xs: '1.25rem', md: '1.75rem' } }}>
                {it.icon}
              </Box>
              <Typography variant="body1" sx={{ fontWeight: 500, fontSize: { xs: '0.72rem', md: '1rem' } }}>
                {it.label}
              </Typography>
            </ListItemButton>
          );

          // Tooltip sólo cuando está deshabilitado
          if (disabled) {
            return (
              <Box key={it.href} sx={{ my: 1.5, mx: 1.5 }}>
                <Tooltip title="Sin permisos para configurar" placement="right">
                  {/* span para permitir tooltip sobre elemento deshabilitado */}
                  <span style={{ display: 'block', width: '100%' }}>{button}</span>
                </Tooltip>
              </Box>
            );
          }

          return (
            <Box key={it.href} sx={{ my: 1.5, mx: 1.5 }}>
              {button}
            </Box>
          );
        })}
      </List>
      <Box sx={{ flexGrow: 1 }} />
      <Divider />
      <Box sx={{ p: 2, fontSize: 12, color: 'text.secondary' }}>v0.1</Box>
    </Box>
  );

  return (
    <>
      {/* Toggle solo visible en móvil. */}
      <IconButton
        aria-label="Abrir menú"
        onClick={() => setMobileOpen(true)}
        sx={{
          display: { xs: 'inline-flex', md: 'none' },
          position: 'fixed',
          top: 12,
          left: 12,
          zIndex: theme => theme.zIndex.appBar + 1,
          bgcolor: 'background.paper',
          boxShadow: 1,
        }}
      >
        <MenuIcon />
      </IconButton>

      {/* Drawer móvil (temporal) */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { width: drawerWidth, overflowX: 'hidden' },
        }}
      >
        <Toolbar sx={{ justifyContent: 'flex-end', pr: 1 }}>
          <IconButton aria-label="Cerrar menú" onClick={() => setMobileOpen(false)}>
            <CloseIcon />
          </IconButton>
        </Toolbar>
        {content}
      </Drawer>

      {/* Drawer desktop (permanente) */}
      <Drawer
        variant="permanent"
        open
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box', overflowX: 'hidden' },
        }}
      >
        {content}
      </Drawer>
    </>
  );
}