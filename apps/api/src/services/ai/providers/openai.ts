import OpenAI from "openai";
import { AIProvider } from "./types";

export class OpenAIProvider implements AIProvider {
    private client: OpenAI;
    private modelName: string;

    constructor() {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) throw new Error("OPENAI_API_KEY is not set");
        this.client = new OpenAI({ apiKey });
        this.modelName = process.env.OPENAI_AI || "gpt-5-nano";
    }

    async generateResponse(prompt: string, context?: any): Promise<string> {
        const completion = await this.client.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: this.modelName,
        });
        return completion.choices[0].message.content || "";
    }
}
