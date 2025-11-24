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
            messages: [{ role: "user", content: prompt }],
            model: this.modelName,
        });
        return completion.choices[0].message.content || "";
    }
}
