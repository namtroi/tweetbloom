/**
 * Mock Bloom Buddy Service for Testing
 * Provides deterministic prompt evaluation without calling real AI
 */

export class MockBloomBuddyService {
  private static instance: MockBloomBuddyService;

  static getInstance(): MockBloomBuddyService {
    if (!MockBloomBuddyService.instance) {
      MockBloomBuddyService.instance = new MockBloomBuddyService();
    }
    return MockBloomBuddyService.instance;
  }

  async evaluatePrompt(prompt: string): Promise<{
    status: 'good' | 'bad';
    suggestion?: string;
    reasoning?: string;
  }> {
    // Simple heuristic: prompts shorter than 10 chars are "bad"
    if (prompt.trim().length < 10) {
      return {
        status: 'bad',
        suggestion: 'Please provide more context and detail in your prompt. Instead of just "help", try asking a specific question like "How do I implement authentication in Next.js?"',
        reasoning: 'Your prompt is too vague and lacks specific context.',
      };
    }

    // Prompts with just one word are bad
    if (prompt.trim().split(/\s+/).length === 1) {
      return {
        status: 'bad',
        suggestion: 'Try to be more specific. What exactly would you like to know about this topic?',
        reasoning: 'Single-word prompts are too broad.',
      };
    }

    // Otherwise, it's good
    return {
      status: 'good',
    };
  }

  async suggestNextPrompt(chatHistory: any[]): Promise<{ new_prompt: string }> {
    // Analyze the last message to suggest next step
    if (chatHistory.length === 0) {
      return {
        new_prompt: 'What would you like to explore next?',
      };
    }

    const lastMessage = chatHistory[chatHistory.length - 1];
    const content = lastMessage.content.toLowerCase();

    if (content.includes('quantum')) {
      return {
        new_prompt: 'Can you explain quantum entanglement and its applications?',
      };
    }

    if (content.includes('typescript')) {
      return {
        new_prompt: 'What are the best practices for using TypeScript in a large-scale project?',
      };
    }

    if (content.includes('machine learning')) {
      return {
        new_prompt: 'What are the differences between supervised and unsupervised learning?',
      };
    }

    return {
      new_prompt: 'Based on our conversation, what specific aspect would you like to dive deeper into?',
    };
  }

  async synthesizeConversation(chatHistory: any[]): Promise<{ new_prompt: string }> {
    if (chatHistory.length === 0) {
      return {
        new_prompt: 'Start a new conversation',
      };
    }

    // Extract topics from conversation
    const topics = chatHistory
      .filter(msg => msg.role === 'user')
      .map(msg => msg.content)
      .join(', ');

    return {
      new_prompt: `Continue our discussion about: ${topics.substring(0, 100)}...`,
    };
  }
}
