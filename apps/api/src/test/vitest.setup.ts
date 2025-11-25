import { vi, beforeEach, afterEach } from 'vitest';
import { testStore } from './mocks/in-memory-store';
import { createMockSupabaseClient } from './mocks/supabase';
import { MockAIProviderFactory } from './mocks/ai-providers';
import { MockBloomBuddyService } from './mocks/bloom-buddy';

/**
 * Vitest Setup File
 * Global mocks and setup for all tests
 */

// Mock environment variables
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
process.env.GEMINI_API_KEY = 'test-gemini-key';
process.env.NODE_ENV = 'test';

// Default test user ID (valid UUID v4)
export const TEST_USER_ID = '00000000-0000-4000-8000-000000000001';

// Mock Supabase client
vi.mock('../lib/supabase', () => ({
  createUserClient: vi.fn((jwt?: string) => {
    return createMockSupabaseClient(TEST_USER_ID);
  }),
  createAdminClient: vi.fn(() => {
    return createMockSupabaseClient(TEST_USER_ID);
  }),
}));

// Mock AI Providers - Mock the actual classes that get instantiated
vi.mock('../services/ai/providers/gemini', () => {
  return {
    GeminiProvider: class {
      async generateResponse(prompt: string, history: any[] = []): Promise<string> {
        // Check if this is a Bloom Buddy evaluation prompt
        if (prompt.includes('You are Bloom Buddy') && prompt.includes('evaluate')) {
          // Extract the actual user prompt from the system prompt
          const match = prompt.match(/"([^"]+)"/);
          const userPrompt = match ? match[1] : '';
          
          // Simple heuristic: short prompts are bad
          if (userPrompt.trim().length < 10 || userPrompt.trim().split(/\s+/).length === 1) {
            return JSON.stringify({
              status: 'bad',
              suggestion: 'Please provide more context and detail in your prompt.',
              reasoning: 'Your prompt is too vague and lacks specific context.',
            });
          }
          
          return JSON.stringify({
            status: 'good',
            reasoning: 'Prompt is clear and specific.',
          });
        }
        
        // Check if this is a "suggest next prompt" request
        if (prompt.includes('suggest the single best next prompt')) {
          return JSON.stringify({
            new_prompt: 'What would you like to explore next about this topic?',
            reasoning: 'This helps continue the conversation naturally.',
          });
        }
        
        // Check if this is a conversation synthesis request
        if (prompt.includes('synthesize') || prompt.includes('comprehensive prompt')) {
          return 'Continue our discussion about the topics we covered.';
        }
        
        // Regular prompts
        if (prompt.toLowerCase().includes('quantum')) {
          return 'Quantum computing uses quantum bits (qubits) that can exist in multiple states simultaneously.';
        }
        if (prompt.toLowerCase().includes('typescript')) {
          return 'TypeScript is a strongly typed programming language that builds on JavaScript.';
        }
        if (prompt.toLowerCase().includes('machine learning')) {
          return 'Machine learning is a subset of artificial intelligence that enables systems to learn from experience.';
        }
        
        return `This is a mocked Gemini response to: "${prompt.substring(0, 50)}..."`;
      }
    },
  };
});

vi.mock('../services/ai/providers/openai', () => {
  return {
    OpenAIProvider: class {
      async generateResponse(prompt: string, history: any[] = []): Promise<string> {
        return `This is a mocked ChatGPT response to: "${prompt.substring(0, 50)}..."`;
      }
    },
  };
});

vi.mock('../services/ai/providers/grok', () => {
  return {
    GrokProvider: class {
      async generateResponse(prompt: string, history: any[] = []): Promise<string> {
        return `This is a mocked Grok response to: "${prompt.substring(0, 50)}..."`;
      }
    },
  };
});

// Mock Bloom Buddy Service
vi.mock('../services/ai/bloom-buddy', () => ({
  BloomBuddyService: {
    getInstance: vi.fn(() => MockBloomBuddyService.getInstance()),
  },
}));

// Mock auth middleware to inject test user
vi.mock('../middleware/auth', () => ({
  authMiddleware: vi.fn(async (req: any, reply: any) => {
    // Check if authorization header exists
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      reply.code(401).send({ error: 'Unauthorized' });
      return;
    }
    
    // Inject test user into request
    req.user = {
      id: TEST_USER_ID,
      email: 'test@example.com',
    };
    req.jwt = authHeader.replace('Bearer ', '');
  }),
}));

// Reset store before each test
beforeEach(() => {
  testStore.reset();
  // Create default test user with fixed UUID
  testStore.createUser('test@example.com', TEST_USER_ID);
});

// Clear all mocks after each test
afterEach(() => {
  vi.clearAllMocks();
});
