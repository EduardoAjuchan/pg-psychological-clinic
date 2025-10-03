'use client';

import { useState } from 'react';
import {
  Paper,
  Typography,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
} from '@mui/material';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';

export type SettingVar = {
  key: string;
  label: string;
  value: string;
  section?: 'afinacion' | 'general' | 'agenda' | string;
};

export default function VariableCard({
  variable,
  onSave,
}: {
  variable: SettingVar;
  onSave: (v: SettingVar) => void;
}) {
  const [open, setOpen] = useState(false);
  const [val, setVal] = useState(variable.value);

  return (
    <>
      <Paper
        variant="outlined"
        sx={(theme) => ({
          p: 2,
          borderRadius: 2,
          bgcolor: theme.palette.background.paper,
          transition: 'background-color .2s, box-shadow .2s',
          '&:hover': { bgcolor: theme.palette.action.hover },
        })}
      >
        <Box className="flex items-start justify-between gap-2">
          <Box>
            <Typography variant="body2" color="text.secondary">{variable.label}</Typography>
            <Typography variant="h6" sx={{ wordBreak: 'break-word' }}>{variable.value}</Typography>
          </Box>
          <IconButton
            aria-label="Editar"
            onClick={() => {
              setVal(variable.value);
              setOpen(true);
            }}
          >
            <EditOutlinedIcon />
          </IconButton>
        </Box>
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Editar {variable.label}</DialogTitle>
        <DialogContent dividers>
          <TextField
            fullWidth
            label={variable.label}
            value={val}
            onChange={(e) => setVal(e.target.value)}
            autoFocus
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={() => {
              onSave({ ...variable, value: val });
              setOpen(false);
            }}
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}