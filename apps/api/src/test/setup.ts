import { vi } from 'vitest';

/**
 * Global Test Setup
 * Mocks for Supabase and AI Providers to avoid real API calls during tests.
 */

// Mock Supabase Client
export const mockSupabaseClient = {
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
  })),
  auth: {
    getUser: vi.fn(),
    admin: {
      createUser: vi.fn(),
    },
  },
};

// Mock AI Providers
export const mockGeminiResponse = {
  response: {
    text: () => 'Mocked Gemini response',
  },
};

export const mockOpenAIResponse = {
  choices: [
    {
      message: {
        content: 'Mocked OpenAI response',
      },
    },
  ],
};

export const mockGrokResponse = {
  choices: [
    {
      message: {
        content: 'Mocked Grok response',
      },
    },
  ],
};

// Mock Bloom Buddy Service
export const mockBloomBuddyService = {
  evaluatePrompt: vi.fn(),
  suggestNextPrompt: vi.fn(),
  synthesizeConversation: vi.fn(),
};

// Helper to create mock user
export const createMockUser = () => ({
  id: 'test-user-id',
  email: 'test@example.com',
  created_at: new Date().toISOString(),
});

// Helper to create mock chat
export const createMockChat = (userId: string) => ({
  id: 'test-chat-id',
  user_id: userId,
  title: 'Test Chat',
  ai_tool: 'GEMINI' as const,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

// Helper to create mock message
export const createMockMessage = (chatId: string, role: 'user' | 'assistant') => ({
  id: 'test-message-id',
  chat_id: chatId,
  role,
  content: 'Test message content',
  created_at: new Date().toISOString(),
});
