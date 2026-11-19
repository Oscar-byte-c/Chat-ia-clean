// Proveedores de IA con los que el usuario puede chatear
export type AIProvider = 'gemini' | 'openrouter' | 'groq';

export const AI_PROVIDERS: { id: AIProvider; name: string }[] = [
  { id: 'gemini', name: 'Gemini' },
  { id: 'openrouter', name: 'OpenRouter' },
  { id: 'groq', name: 'Groq' },
];
