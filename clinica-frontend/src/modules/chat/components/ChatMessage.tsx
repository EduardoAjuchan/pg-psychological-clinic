'use client';

import { Avatar, Box, Paper, Typography } from '@mui/material';

export default function ChatMessage({
  from,
  text,
}: {
  from: 'assistant' | 'user';
  text: string;
}) {
  const isUser = from === 'user';

  return (
    <Box className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      {/* Avatar lado izquierdo para assistant, derecho para user */}
      {!isUser && (
        <Avatar sx={{ bgcolor: '#5b21b6', mr: 1 }}>B</Avatar>
      )}

      <Paper
        elevation={0}
        sx={{
          px: 2,
          py: 1.5,
          bgcolor: isUser ? '#5b21b6' : '#f3f4f6',
          color: isUser ? 'white' : 'inherit',
          borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
          maxWidth: '80%',
        }}
      >
        <Typography variant="body1">{text}</Typography>
      </Paper>

      {isUser && (
        <Avatar sx={{ bgcolor: '#111827', ml: 1 }}>Tú</Avatar>
      )}
    </Box>
  );
}