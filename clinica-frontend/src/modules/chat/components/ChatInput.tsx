'use client';

import { useState } from 'react';
import { Box, Button, OutlinedInput } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';

export default function ChatInput({ onSend }: { onSend: (text: string) => void }) {
  const [text, setText] = useState('');

  function submit() {
    if (!text.trim()) return;
    onSend(text);
    setText('');
  }

  return (
    <Box className="flex items-center gap-2">
      <OutlinedInput
        placeholder="Escribe '1', '2', '3' o responde al asistente..."
        fullWidth
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
        }}
        sx={{
          borderRadius: 999,
          bgcolor: 'background.paper',
        }}
      />
      <Button
        onClick={submit}
        variant="contained"
        endIcon={<SendIcon />}
        sx={{
          borderRadius: 999,
          px: 2.5,
          textTransform: 'none',
          fontWeight: 600,
          bgcolor: '#5b21b6',
          '&:hover': { bgcolor: '#4c1d95' },
        }}
      >
        Enviar
      </Button>
    </Box>
  );
}