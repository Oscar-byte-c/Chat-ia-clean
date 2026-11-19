import { Message } from '../../domain/entities/Message';

// Contrato común que cumplen todos los DataSources de IA (Gemini, OpenRouter, Groq)
export interface AIDataSource {
  generateResponse(userMessage: string, history: Message[]): Promise<string>;
}
