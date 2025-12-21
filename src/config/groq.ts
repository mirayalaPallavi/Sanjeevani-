export const GROQ_API_KEY = (import.meta.env.VITE_GROQ_API_KEY as string) || '';
export const GROQ_SYMPTOM_API_KEY = (import.meta.env.VITE_GROQ_SYMPTOM_API_KEY as string) || '';

export const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export function getGroqHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${GROQ_API_KEY}`,
  } as const;
}

export function getSymptomGroqHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${GROQ_SYMPTOM_API_KEY || GROQ_API_KEY}`,
  } as const;
}

export function groqEnabled(): boolean {
  return Boolean(GROQ_API_KEY && GROQ_API_KEY.length > 0);
}

export function groqSymptomEnabled(): boolean {
  return Boolean((GROQ_SYMPTOM_API_KEY && GROQ_SYMPTOM_API_KEY.length > 0) || (GROQ_API_KEY && GROQ_API_KEY.length > 0));
}
