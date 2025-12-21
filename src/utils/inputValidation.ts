import { z } from 'zod';

// Sanitize text input to prevent XSS
export function sanitizeText(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim();
}

// Validate email
export const emailSchema = z.string().email('Invalid email address').max(255);

// Validate symptoms
export const symptomSchema = z.string()
  .min(1, 'Symptom cannot be empty')
  .max(200, 'Symptom too long')
  .transform(sanitizeText);

// Validate chat message
export const chatMessageSchema = z.string()
  .min(1, 'Message cannot be empty')
  .max(2000, 'Message too long (max 2000 characters)')
  .transform(sanitizeText);

// Validate appointment reason
export const appointmentReasonSchema = z.string()
  .max(500, 'Reason too long')
  .optional()
  .transform((val) => val ? sanitizeText(val) : val);

// Validate notes
export const notesSchema = z.string()
  .max(5000, 'Notes too long')
  .optional()
  .transform((val) => val ? sanitizeText(val) : val);

// Check for emergency keywords
export const EMERGENCY_KEYWORDS = [
  'heart attack',
  'stroke',
  'suicide',
  'kill myself',
  'cant breathe',
  'cannot breathe',
  'unconscious',
  'severe bleeding',
  'choking',
  'overdose',
  'poisoning',
  'chest pain',
  'seizure',
  'anaphylaxis',
];

export function detectEmergency(text: string): boolean {
  const lowerText = text.toLowerCase();
  return EMERGENCY_KEYWORDS.some((keyword) => lowerText.includes(keyword));
}

export function getSeverityFromText(text: string): 'low' | 'medium' | 'high' | 'emergency' {
  const lower = text.toLowerCase();
  
  if (detectEmergency(text)) return 'emergency';
  
  const highKeywords = ['severe', 'intense', 'unbearable', 'worst', 'excruciating'];
  if (highKeywords.some((k) => lower.includes(k))) return 'high';
  
  const mediumKeywords = ['moderate', 'constant', 'persistent', 'worsening', 'painful'];
  if (mediumKeywords.some((k) => lower.includes(k))) return 'medium';
  
  return 'low';
}
