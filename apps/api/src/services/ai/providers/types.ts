export interface AIProvider {
    generateResponse(prompt: string, context?: any): Promise<string>;
}

export type AIProviderType = "gemini" | "openai" | "grok";
