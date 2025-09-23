'use client';

import { useRef, useState } from 'react';
import { Box, Paper, Typography, Divider } from '@mui/material';
import QuickActions from '@/modules/chat/components/QuickActions';
import ChatMessage from '@/modules/chat/components/ChatMessage';
import ChatInput from '@/modules/chat/components/ChatInput';

type Msg = { id: string; from: 'assistant' | 'user'; text: string };

export default function ChatPage() {
  const [messages, setMessages] = useState<Msg[]>([
    {
      id: 'm1',
      from: 'assistant',
      text:
        'Hola, soy Brisa, tu asistente IA. Puedo crear pacientes, agendar citas y añadir notas de sesión. ¿Cómo te ayudo?',
    },
  ]);
  const endRef = useRef<HTMLDivElement | null>(null);

  function scrollToEnd() {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  function handleSend(text: string) {
    if (!text.trim()) return;
    const userMsg: Msg = { id: crypto.randomUUID(), from: 'user', text };
    setMessages((prev) => [...prev, userMsg]);
    scrollToEnd();

    // Simulación de respuesta IA
    setTimeout(() => {
      const botMsg: Msg = {
        id: crypto.randomUUID(),
        from: 'assistant',
        text:
          'Recibido. Cuando conectemos el backend te devolveré resultados reales. Por ahora soy un fantasma educado.',
      };
      setMessages((prev) => [...prev, botMsg]);
      scrollToEnd();
    }, 600);
  }

  function handleQuickAction(text: string) {
    // puedes enviar directo o prellenar; por ahora lo envío directo
    handleSend(text);
  }

  return (
    <Box className="space-y-4">
      <Typography variant="h5" className="font-semibold text-purple-900">
        Asistente IA
      </Typography>

      <Paper className="p-4">
        {/* Layout responsive: acciones a la izquierda, chat a la derecha */}
        <Box className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Acciones rápidas */}
          <Box className="lg:col-span-3">
            <Typography variant="subtitle1" className="font-medium mb-2">
              Acciones Rápidas
            </Typography>
            <QuickActions onPick={handleQuickAction} />
          </Box>

          {/* Conversación */}
          <Box className="lg:col-span-9 flex flex-col h-[70vh]">
            {/* Área de mensajes scrollable */}
            <Box className="flex-1 overflow-y-auto pr-1">
              <Box className="space-y-3">
                {messages.map((m) => (
                  <ChatMessage key={m.id} from={m.from} text={m.text} />
                ))}
                <div ref={endRef} />
              </Box>
            </Box>

            <Divider className="my-3" />

            {/* Input pegado abajo */}
            <ChatInput onSend={handleSend} />
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}