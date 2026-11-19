import { useState, useCallback } from 'react';
import * as Speech from 'expo-speech';

// Quita los símbolos Markdown para que la voz no lea "asterisco", "numeral", etc.
const stripMarkdown = (text: string): string =>
  text
    .replace(/```[\s\S]*?```/g, '')        // bloques de código
    .replace(/`([^`]*)`/g, '$1')           // código en línea
    .replace(/\*\*|__|\*|_|~~/g, '')       // negritas, cursivas, tachado
    .replace(/^#{1,6}\s*/gm, '')           // títulos
    .replace(/^\s*[-+]\s+/gm, '')          // viñetas
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1'); // enlaces

export const useSpeech = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);

  const speak = useCallback(async (text: string) => {
    await Speech.stop(); // corta la respuesta anterior si aún está hablando
    setIsSpeaking(true);
    Speech.speak(stripMarkdown(text), {
      language: 'es-ES',
      rate: 1.0,
      onDone: () => setIsSpeaking(false),
      onStopped: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  }, []);

  const stop = useCallback(async () => {
    await Speech.stop();
    setIsSpeaking(false);
  }, []);

  return { speak, stop, isSpeaking };
};
