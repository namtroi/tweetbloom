/**
 * Mock AI Providers for Testing
 * Returns deterministic responses without calling real AI APIs
 */

export class MockGeminiProvider {
  async generateResponse(prompt: string, history: any[] = []): Promise<string> {
    // Simulate different responses based on prompt
    if (prompt.toLowerCase().includes('quantum')) {
      return 'Quantum computing uses quantum bits (qubits) that can exist in multiple states simultaneously, enabling parallel processing of information.';
    }
    
    if (prompt.toLowerCase().includes('typescript')) {
      return 'TypeScript is a strongly typed programming language that builds on JavaScript, giving you better tooling at any scale.';
    }
    
    if (prompt.toLowerCase().includes('machine learning')) {
      return 'Machine learning is a subset of artificial intelligence that enables systems to learn and improve from experience without being explicitly programmed.';
    }
    
    // Default response
    return `This is a mocked Gemini response to: "${prompt.substring(0, 50)}..."`;
  }
}

export class MockOpenAIProvider {
  async generateResponse(prompt: string, history: any[] = []): Promise<string> {
    return `This is a mocked ChatGPT response to: "${prompt.substring(0, 50)}..."`;
  }
}

export class MockGrokProvider {
  async generateResponse(prompt: string, history: any[] = []): Promise<string> {
    return `This is a mocked Grok response to: "${prompt.substring(0, 50)}..."`;
  }
}

export class MockAIProviderFactory {
  private static instance: MockAIProviderFactory;
  
  private providers = {
    gemini: new MockGeminiProvider(),
    openai: new MockOpenAIProvider(),
    grok: new MockGrokProvider(),
  };

  static getInstance(): MockAIProviderFactory {
    if (!MockAIProviderFactory.instance) {
      MockAIProviderFactory.instance = new MockAIProviderFactory();
    }
    return MockAIProviderFactory.instance;
  }

  getProvider(type: 'gemini' | 'openai' | 'grok') {
    return this.providers[type];
  }
}
