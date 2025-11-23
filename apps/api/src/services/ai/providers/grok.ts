import OpenAI from "openai";
import { AIProvider } from "./types";

export class GrokProvider implements AIProvider {
    private client: OpenAI;
    private modelName: string;

    constructor() {
        const apiKey = process.env.GROK_API_KEY;
        if (!apiKey) throw new Error("GROK_API_KEY is not set");
        // Grok uses OpenAI compatible API
        this.client = new OpenAI({
            apiKey,
            baseURL: "https://api.x.ai/v1"
        });
        this.modelName = process.env.GROK_AI || "grok-4-fast-reasoning";
    }

    async generateResponse(prompt: string, context?: any): Promise<string> {
        const completion = await this.client.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: this.modelName,
        });
        return completion.choices[0].message.content || "";
    }
}
