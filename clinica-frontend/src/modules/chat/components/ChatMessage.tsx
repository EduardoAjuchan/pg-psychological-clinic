'use client';

import { Avatar, Box, Paper, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function ChatMessage({
  from,
  text,
}: {
  from: 'assistant' | 'user';
  text: string;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;
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
          // Add minimal prose styles for Markdown rendering
          '& h1, & h2, & h3, & h4, & h5, & h6': {
            marginTop: 1,
            marginBottom: 1,
            fontWeight: 'bold',
          },
          '& ul, & ol': {
            paddingLeft: 3,
            marginTop: 1,
            marginBottom: 1,
          },
          '& strong': {
            fontWeight: 'bold',
          },
          '& p': {
            marginTop: 1,
            marginBottom: 1,
          },
        }}
      >
        {isUser ? (
          <Typography variant="body1">{text}</Typography>
        ) : (
          <Box>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {text}
            </ReactMarkdown>
          </Box>
        )}
      </Paper>

      {isUser && (
        <Avatar sx={{ bgcolor: '#111827', ml: 1 }}>Tú</Avatar>
      )}
    </Box>
  );
}