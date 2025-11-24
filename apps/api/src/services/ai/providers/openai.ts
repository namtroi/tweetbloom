import OpenAI from "openai";
import { AIProvider, ChatMessage } from "./types";
import { getEnv } from "../../../config/env";

export class OpenAIProvider implements AIProvider {
    private client: OpenAI;
    private modelName: string;

    constructor() {
        const env = getEnv();
        const apiKey = env.OPENAI_API_KEY;
        if (!apiKey) throw new Error("OPENAI_API_KEY is not set (optional provider)");
        this.client = new OpenAI({ apiKey });
        this.modelName = env.OPENAI_AI;
    }

    async generateResponse(prompt: string, history?: ChatMessage[]): Promise<string> {
        const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
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
            }
        ];

        // Add history if exists
        if (history && history.length > 0) {
            history.forEach(msg => {
                messages.push({
                    role: msg.role,
                    content: msg.content
                });
            });
        }

        // Add current prompt
        messages.push({ 
            role: "user", 
            content: prompt 
        });

        const completion = await this.client.chat.completions.create({
            messages,
            model: this.modelName,
        });
        return completion.choices[0].message.content || "";
    }
}
