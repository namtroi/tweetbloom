import { AIProviderFactory } from "./providers";

export interface BloomBuddyEvaluation {
    status: "good" | "bad";
    suggestion?: string;
    reasoning?: string;
}

export class BloomBuddyService {
    private static instance: BloomBuddyService;
    private providerFactory: AIProviderFactory;

    private constructor() {
        this.providerFactory = AIProviderFactory.getInstance();
    }

    public static getInstance(): BloomBuddyService {
        if (!BloomBuddyService.instance) {
            BloomBuddyService.instance = new BloomBuddyService();
        }
        return BloomBuddyService.instance;
    }

    async evaluatePrompt(prompt: string): Promise<BloomBuddyEvaluation> {
        // Bloom Buddy always uses Gemini as per requirements
        const provider = this.providerFactory.getProvider("gemini");

        const systemPrompt = `
      You are Bloom Buddy, an expert AI prompt engineer.
      Your goal is to evaluate the user's prompt.
      
      Analyze the following prompt:
      "${prompt}"

      If the prompt is vague, too short (under 5 words), or unclear, mark it as "bad".
      If the prompt is clear, specific, or creative enough, mark it as "good".

      Return a JSON object with the following structure:
      {
        "status": "good" | "bad",
        "suggestion": "Better version of the prompt (only if status is bad)",
        "reasoning": "Why it is good or bad"
      }
      
      Do not include markdown formatting like \`\`\`json. Just the raw JSON string.
    `;

        try {
            const response = await provider.generateResponse(systemPrompt);
            // Clean up response if it contains markdown code blocks
            const cleanResponse = response.replace(/```json/g, "").replace(/```/g, "").trim();
            return JSON.parse(cleanResponse) as BloomBuddyEvaluation;
        } catch (error) {
            console.error("Bloom Buddy evaluation failed:", error);
            // Fallback to assuming it's good if AI fails, to not block the user
            return { status: "good", reasoning: "Evaluation failed, proceeding." };
        }
    }

    async suggestNextPrompt(history: { role: string; content: string }[]): Promise<{ suggestion: string; reasoning: string }> {
        const provider = this.providerFactory.getProvider("gemini");

        const historyText = history.map((msg) => `${msg.role}: ${msg.content}`).join("\n");

        const systemPrompt = `
      You are Bloom Buddy, a conversation strategist.
      Analyze the following chat history and suggest the single best next prompt for the USER to ask.
      The suggestion should deepen the conversation or explore a logical next step.

      Chat History:
      ${historyText}

      Return a JSON object with the following structure:
      {
        "suggestion": "The suggested next prompt for the user",
        "reasoning": "Why this is a good next step"
      }

      Do not include markdown formatting like \`\`\`json. Just the raw JSON string.
    `;

        try {
            const response = await provider.generateResponse(systemPrompt);
            const cleanResponse = response.replace(/```json/g, "").replace(/```/g, "").trim();
            return JSON.parse(cleanResponse) as { suggestion: string; reasoning: string };
        } catch (error) {
            console.error("Bloom Buddy suggestion failed:", error);
            return {
                suggestion: "Tell me more about that.",
                reasoning: "Fallback suggestion due to error."
            };
        }
    }
}
