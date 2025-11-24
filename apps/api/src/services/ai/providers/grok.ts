import OpenAI from "openai";
import { AIProvider } from "./types";
import { getEnv } from "../../../config/env";

export class GrokProvider implements AIProvider {
    private client: OpenAI;
    private modelName: string;

    constructor() {
        const env = getEnv();
        const apiKey = env.GROK_API_KEY;
        if (!apiKey) throw new Error("GROK_API_KEY is not set (optional provider)");
        // Grok uses OpenAI compatible API
        this.client = new OpenAI({
            apiKey,
            baseURL: "https://api.x.ai/v1"
        });
        this.modelName = env.GROK_AI;
    }

    async generateResponse(prompt: string, context?: any): Promise<string> {
        const completion = await this.client.chat.completions.create({
            messages: [
                { 
                    role: "system", 
                    content: `You are a helpful AI assistant for TweetBloom.

CRITICAL RESPONSE RULES (MUST FOLLOW):
- Keep ALL responses under 150 words
- Keep ALL responses under 1200 characters
- Be concise, clear, and direct
- Prioritize the most important information
- If the topic is complex, focus on key points only
- NEVER exceed these limits under any circumstances

These limits are strict requirements for mobile-first experience.`
                },
                { 
                    role: "user", 
                    content: prompt 
                }
            ],
            model: this.modelName,
        });
        return completion.choices[0].message.content || "";
    }
}
