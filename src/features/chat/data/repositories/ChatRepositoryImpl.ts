import { Message } from '../../domain/entities/Message';
import { AIProvider } from '../../domain/entities/AIProvider';
import { ChatRepository } from '../../domain/repositories/ChatRepository';
import { AIDataSource } from '../datasources/AIDataSource';
import { GeminiDataSource } from '../datasources/GeminiDataSource';
import { OpenRouterDataSource } from '../datasources/OpenRouterDataSource';
import { GroqDataSource } from '../datasources/GroqDataSource';

// Elige el DataSource concreto según el proveedor seleccionado
const createDataSource = (provider: AIProvider): AIDataSource => {
    switch (provider) {
        case 'openrouter': return new OpenRouterDataSource();
        case 'groq':       return new GroqDataSource();
        case 'gemini':
        default:           return new GeminiDataSource();
    }
};

export class ChatRepositoryImpl implements ChatRepository {
    private dataSource: AIDataSource;

    constructor(provider: AIProvider = 'gemini') {
        this.dataSource = createDataSource(provider);
    }

    async sendMessage(userMessage: string, history: Message[]): Promise<string> {
        return this.dataSource.generateResponse(userMessage, history);
    }
}
