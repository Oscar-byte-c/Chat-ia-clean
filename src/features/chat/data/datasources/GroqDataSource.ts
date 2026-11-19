import { OpenAICompatibleDataSource } from './OpenAICompatibleDataSource';

export class GroqDataSource extends OpenAICompatibleDataSource {
  constructor() {
    super(
      'https://api.groq.com/openai/v1',
      process.env.EXPO_PUBLIC_GROQ_API_KEY!,
      'openai/gpt-oss-20b',
      { reasoning_effort: 'low' }, // responde más rápido y no gasta tokens pensando
    );
  }
}
