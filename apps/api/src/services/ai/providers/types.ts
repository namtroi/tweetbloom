export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

export interface AIProvider {
    generateResponse(prompt: string, history?: ChatMessage[]): Promise<string>;
}

export type AIProviderType = "gemini" | "openai" | "grok";
