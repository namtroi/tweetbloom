import { GoogleGenerativeAI } from "@google/generative-ai";
import { AIProvider } from "./types";

export class GeminiProvider implements AIProvider {
    private client: GoogleGenerativeAI;
    private modelName: string;

    constructor() {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
        this.client = new GoogleGenerativeAI(apiKey);
        this.modelName = process.env.GEMINI_AI || "gemini-2.5-flash-lite";
    }

    async generateResponse(prompt: string, context?: any): Promise<string> {
        const model = this.client.getGenerativeModel({ model: this.modelName });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    }
}
