import { OpenAICompatibleDataSource } from './OpenAICompatibleDataSource';

export class OpenRouterDataSource extends OpenAICompatibleDataSource {
  constructor() {
    super(
      'https://openrouter.ai/api/v1',
      process.env.EXPO_PUBLIC_OPENROUTER_API_KEY!,
      'openrouter/free', // elige automáticamente un modelo gratuito disponible
    );
  }
}
