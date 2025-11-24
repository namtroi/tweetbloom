import OpenAI from "openai";
import { AIProvider } from "./types";
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

    async generateResponse(prompt: string, context?: any): Promise<string> {
        const completion = await this.client.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: this.modelName,
        });
        return completion.choices[0].message.content || "";
    }
}
