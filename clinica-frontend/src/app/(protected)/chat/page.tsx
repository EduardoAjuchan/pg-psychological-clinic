'use client';

import { useEffect, useRef, useState } from 'react';
import { Box, Paper, Typography, Divider, CircularProgress, Alert } from '@mui/material';
import QuickActions from '@/modules/chat/components/QuickActions';
import ChatMessage from '@/modules/chat/components/ChatMessage';
import ChatInput from '@/modules/chat/components/ChatInput';
import api from '@/lib/axios';

export type Msg = { id: string; from: 'assistant' | 'user'; text: string };

const STORAGE_KEY = 'chat:history:v1';

function saveHistory(msgs: Msg[]) {
  try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(msgs)); } catch {}
}
function loadHistory(): Msg[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: Msg[] = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Msg[]>(() => {
    const restored = loadHistory();
    if (restored.length) return restored;
    return [
      { id: 'm1', from: 'assistant', text: 'Hola, soy Brisa. Puedo crear pacientes, agendar y cancelar citas, y añadir notas de sesión. ¿Qué hacemos hoy?' },
    ];
  });
  const [typing, setTyping] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Input controlado para quick actions
  const [inputText, setInputText] = useState('');

  // Scroll refs
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => { saveHistory(messages); }, [messages]);

  // Scroll al fondo garantizado
  function scrollToBottom(smooth = true) {
    const el = scrollRef.current;
    if (!el) return;
    const behavior: ScrollBehavior = smooth ? 'smooth' : 'auto';
    // Esperar a que el layout pinte (doble rAF)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.scrollTo({ top: el.scrollHeight, behavior });
      });
    });
  }

  useEffect(() => {
    scrollToBottom();
  }, [messages, typing]);

  async function callChatApi(input: string) {
    const { data } = await api.post('/chat', { message: input });
    return data;
  }

  function normalizeBotReply(payload: any): string {
    if (payload == null || typeof payload !== 'object') {
      return 'No entendí la respuesta del servidor.';
    }
    const { ok, message, error, code } = payload as { ok?: boolean; message?: string; error?: string; code?: string };
    if (ok) {
      return message || 'Listo.';
    }
    if (error || message) {
      const head = code ? `Error (${code})` : 'Error';
      return `${head}: ${error || message}`;
    }
    return 'Ocurrió un error desconocido.';
  }

  async function handleSend(text: string) {
    if (!text.trim()) return;
    setErr(null);

    const userMsg: Msg = { id: crypto.randomUUID(), from: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setTyping(true);
    scrollToBottom();

    try {
      const data = await callChatApi(text);
      const reply = normalizeBotReply(data);
      const botMsg: Msg = { id: crypto.randomUUID(), from: 'assistant', text: reply };
      setMessages(prev => [...prev, botMsg]);
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'No se pudo contactar al asistente.';
      setErr(msg);
      const botMsg: Msg = { id: crypto.randomUUID(), from: 'assistant', text: `Error: ${msg}` };
      setMessages(prev => [...prev, botMsg]);
    } finally {
      setTyping(false);
      scrollToBottom();
    }
  }

  function handleQuickAction(text: string) {
    // Ahora todos los quick actions se colocan en el input
    setInputText(text);
  }

  return (
    <Box className="space-y-4">
      <Typography variant="h5" className="font-semibold text-purple-900">Asistente IA</Typography>

      <Paper className="p-4">
        {/* Layout responsive: acciones a la izquierda, chat a la derecha */}
        <Box className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Acciones rápidas */}
          <Box className="lg:col-span-3" id="chat-quick-actions">
            <Typography variant="subtitle1" className="font-medium mb-2">Acciones Rápidas</Typography>
            <QuickActions onPick={handleQuickAction} />
          </Box>

          {/* Conversación */}
          <Box className="lg:col-span-9 flex flex-col h-[70vh]" id="chat-assistant">
            {/* Errores globales */}
            {err && (
              <Alert severity="error" sx={{ mb: 1 }}>{err}</Alert>
            )}
            {/* Área de mensajes scrollable */}
            <Box ref={scrollRef} className="flex-1 overflow-y-auto pr-1">
              <Box className="space-y-3">
                {messages.map((m) => (
                  <ChatMessage key={m.id} from={m.from} text={m.text} />
                ))}
                {typing && (
                  <Box className="flex items-center gap-2 text-gray-600">
                    <Box className="rounded-lg px-3 py-2 bg-gray-100 inline-flex items-center gap-2">
                      <CircularProgress size={14} thickness={5} />
                      <span>Pensando…</span>
                    </Box>
                  </Box>
                )}
              </Box>
            </Box>

            {/* Borde separador entre mensajes e input */}
            <Box sx={{ borderTop: '1px solid #e0e0e0', mt: 2, pt: 2 }}>
              <ChatInput 
                onSend={(t: string) => { void handleSend(t); }}
                value={inputText}
                onChange={setInputText}
              />
            </Box>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}