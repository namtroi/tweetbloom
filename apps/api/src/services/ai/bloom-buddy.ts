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

    async suggestNextPrompt(history: { role: string; content: string }[]): Promise<{ new_prompt: string; reasoning?: string }> {
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
        "new_prompt": "The suggested next prompt for the user",
        "reasoning": "Why this is a good next step"
      }

      Do not include markdown formatting like \`\`\`json. Just the raw JSON string.
    `;

        try {
            const response = await provider.generateResponse(systemPrompt);
            const cleanResponse = response.replace(/```json/g, "").replace(/```/g, "").trim();
            return JSON.parse(cleanResponse) as { new_prompt: string; reasoning?: string };
        } catch (error) {
            console.error("Bloom Buddy suggestion failed:", error);
            return {
                new_prompt: "Tell me more about that.",
                reasoning: "Fallback suggestion due to error."
            };
        }
    }

    async summarizeChat(history: { role: string; content: string }[]): Promise<string> {
        const provider = this.providerFactory.getProvider("gemini");

        const historyText = history.map((msg) => `${msg.role}: ${msg.content}`).join("\n");

        const systemPrompt = `
      You are Bloom Buddy, an expert summarizer.
      Summarize the following chat conversation into a concise note.
      The summary should capture the key takeaways, decisions, or information exchanged.
      Format it as a short paragraph or bullet points.

      Chat History:
      ${historyText}

      Return ONLY the summary text. Do not include any JSON or other formatting.
    `;

        try {
            const response = await provider.generateResponse(systemPrompt);
            return response.trim();
        } catch (error) {
            console.error("Bloom Buddy summarization failed:", error);
            return "Failed to summarize chat.";
        }
    }

    async combineNotes(notes: string[]): Promise<string> {
        const provider = this.providerFactory.getProvider("gemini");

        const notesText = notes.map((note, index) => `Note ${index + 1}:\n${note}`).join("\n\n");

        const systemPrompt = `
      You are Bloom Buddy, an expert synthesizer.
      Combine the following notes into a single, coherent master note.
      Identify common themes, merge related information, and create a structured summary.
      
      Notes:
      ${notesText}

      Return ONLY the combined note text. Do not include any JSON or other formatting.
    `;

        try {
            const response = await provider.generateResponse(systemPrompt);
            return response.trim();
        } catch (error) {
            console.error("Bloom Buddy note combination failed:", error);
            return "Failed to combine notes.";
        }
    }
}
