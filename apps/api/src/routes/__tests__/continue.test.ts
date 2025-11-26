import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { build } from '../../test/build-app';
import { FastifyInstance } from 'fastify';
import { testStore } from '../../test/mocks/in-memory-store';
import { TEST_USER_ID } from '../../test/vitest.setup';

describe('Continue Chat Route', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await build();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/chat/continue/chat-to-prompt', () => {
    it('should synthesize conversation into a new prompt', async () => {
      // Create a chat with messages
      const chat = testStore.createChat({
        user_id: TEST_USER_ID,
        title: 'React Discussion',
        ai_tool: 'GEMINI'
      });

      testStore.createMessage({
        chat_id: chat.id,
        role: 'user',
        content: 'What are React hooks?',
        type: 'text'
      });

      testStore.createMessage({
        chat_id: chat.id,
        role: 'assistant',
        content: 'Hooks are functions that let you use state...',
        type: 'response'
      });

      const response = await app.inject({
        method: 'POST',
        url: '/api/chat/continue/chat-to-prompt',
        headers: {
          authorization: 'Bearer mock-jwt-token',
        },
        payload: {
          chatId: chat.id,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.new_prompt).toBeDefined();
      expect(body.new_prompt).toContain('React hooks');
    });

    it('should return 400 for invalid chatId', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/chat/continue/chat-to-prompt',
        headers: {
          authorization: 'Bearer mock-jwt-token',
        },
        payload: {
          chatId: 'invalid-uuid',
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 401 without authorization', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/chat/continue/chat-to-prompt',
        payload: {
          chatId: '00000000-0000-4000-8000-000000000001',
        },
      });

      expect(response.statusCode).toBe(401);
    });
  });
});
