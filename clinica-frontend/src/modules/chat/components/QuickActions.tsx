'use client';
import { Paper, List, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import PsychologyAltOutlinedIcon from '@mui/icons-material/PsychologyAltOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';

export default function QuickActions({ onPick }: { onPick: (text: string) => void }) {
  const items = [
    {
      icon: <PsychologyAltOutlinedIcon sx={{ color: '#e11d48' }} />, // rosa
      label: 'Posible Diagnóstico',
      payload: 'Genera un posible diagnóstico para el paciente...',
    },
    {
      icon: <DescriptionOutlinedIcon sx={{ color: '#059669' }} />, // verde
      label: 'Técnicas Recomendadas',
      payload: 'Sugiere técnicas de intervención apropiadas para el caso del paciente...',
    },
    {
      icon: <FavoriteBorderIcon sx={{ color: '#7c3aed' }} />, // morado
      label: 'Crear Nota de Sesión',
      payload: 'Crea una nota de sesión para el paciente... con los siguientes datos...',
    },
  ];

  return (
    <Paper variant="outlined" className="rounded-xl">
      <List disablePadding>
        {items.map((it, idx) => (
          <ListItemButton
            key={it.label}
            onClick={() => onPick(it.payload)}
            sx={{
              py: 2,
              px: 2,
              ...(idx !== items.length - 1 ? { borderBottom: '1px solid rgba(0,0,0,0.08)' } : {}),
              borderRadius: idx === 0 ? '12px 12px 0 0' : idx === items.length - 1 ? '0 0 12px 12px' : 0,
            }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>{it.icon}</ListItemIcon>
            <ListItemText primary={it.label} />
          </ListItemButton>
        ))}
      </List>
    </Paper>
  );
}