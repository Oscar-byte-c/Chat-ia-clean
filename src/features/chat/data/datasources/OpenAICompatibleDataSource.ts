import { Message } from '../../domain/entities/Message';
import { AIDataSource } from './AIDataSource';

// OpenRouter y Groq usan el mismo formato de API (compatible con OpenAI),
// así que comparten esta implementación y solo cambian URL, llave y modelo.
export class OpenAICompatibleDataSource implements AIDataSource {
  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string,
    private readonly model: string,
    private readonly extraBody: Record<string, unknown> = {},
  ) {}

  async generateResponse(userMessage: string, history: Message[]): Promise<string> {
    // Nuestras entidades ya usan 'user' / 'assistant', igual que esta API
    const messages = [
      ...history.map(msg => ({ role: msg.role, content: msg.content })),
      { role: 'user', content: userMessage },
    ];

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        max_tokens: 1000,
        ...this.extraBody,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.error?.message ?? `Error ${response.status}`);
    }
    return data.choices?.[0]?.message?.content ?? '';
  }
}
