import { GoogleGenerativeAI } from "@google/generative-ai";
import { AIProvider, ChatMessage } from "./types";
import { getEnv } from "../../../config/env";

export class GeminiProvider implements AIProvider {
    private client: GoogleGenerativeAI;
    private modelName: string;

    constructor() {
        const env = getEnv();
        this.client = new GoogleGenerativeAI(env.GEMINI_API_KEY);
        this.modelName = env.GEMINI_AI;
    }

    async generateResponse(prompt: string, history?: ChatMessage[]): Promise<string> {
        const model = this.client.getGenerativeModel({ 
            model: this.modelName,
            systemInstruction: `You are a helpful AI assistant for TweetBloom.

CRITICAL RESPONSE RULES (MUST FOLLOW):
- Keep ALL responses under 150 words
- Keep ALL responses under 1200 characters
- Be concise, clear, and direct
- Prioritize the most important information
- If the topic is complex, focus on key points only
- NEVER exceed these limits under any circumstances

These limits are strict requirements for mobile-first experience.`
        });
        
        // If history exists, use chat mode for context
        if (history && history.length > 0) {
            const chat = model.startChat({
                history: history.map(msg => ({
                    role: msg.role === 'assistant' ? 'model' : 'user',
                    parts: [{ text: msg.content }],
                })),
            });
            
            const result = await chat.sendMessage(prompt);
            const response = await result.response;
            return response.text();
        }
        
        // No history - single turn generation
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    }
}
