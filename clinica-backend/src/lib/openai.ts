// src/lib/openai.ts
import 'dotenv/config';
import OpenAI from 'openai';

let cached: OpenAI | null = null;

export function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY no está configurada en .env');
  }
  if (!cached) {
    cached = new OpenAI({ apiKey });
  }
  return cached;
}