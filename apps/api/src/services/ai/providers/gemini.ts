import { GoogleGenerativeAI } from "@google/generative-ai";
import { AIProvider } from "./types";
import { getEnv } from "../../../config/env";

export class GeminiProvider implements AIProvider {
    private client: GoogleGenerativeAI;
    private modelName: string;

    constructor() {
        const env = getEnv();
        this.client = new GoogleGenerativeAI(env.GEMINI_API_KEY);
        this.modelName = env.GEMINI_AI;
    }

    async generateResponse(prompt: string, context?: any): Promise<string> {
        const model = this.client.getGenerativeModel({ model: this.modelName });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    }
}
