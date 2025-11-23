import { AIProvider, AIProviderType } from "./types";
import { GeminiProvider } from "./gemini";
import { OpenAIProvider } from "./openai";
import { GrokProvider } from "./grok";

export * from "./types";
export * from "./gemini";
export * from "./openai";
export * from "./grok";

export class AIProviderFactory {
    private static instance: AIProviderFactory;

    private constructor() { }

    public static getInstance(): AIProviderFactory {
        if (!AIProviderFactory.instance) {
            AIProviderFactory.instance = new AIProviderFactory();
        }
        return AIProviderFactory.instance;
    }

    public getProvider(type: AIProviderType): AIProvider {
        switch (type) {
            case "gemini":
                return new GeminiProvider();
            case "openai":
                return new OpenAIProvider();
            case "grok":
                return new GrokProvider();
            default:
                throw new Error(`Unsupported AI provider: ${type}`);
        }
    }
}
