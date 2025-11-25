import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { build } from '../../test/build-app';
import { FastifyInstance } from 'fastify';
import { TEST_USER_ID } from '../../test/vitest.setup';

/**
 * Integration Tests for Chat Routes
 * Tests the complete flow from HTTP request to response, with mocked external dependencies.
 */

describe('Chat Routes - POST /api/chat', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await build();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create a new chat and return AI response for good prompt', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/chat',
      headers: {
        authorization: 'Bearer mock-jwt-token',
      },
      payload: {
        prompt: 'Explain quantum computing in simple terms.',
      },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.status).toBe('success');
    expect(body.content).toBeDefined();
    expect(body.content).toContain('quantum');
    expect(body.chatId).toBeDefined();
    expect(body.messageId).toBeDefined();
  });

  it('should return Bloom Buddy suggestion for bad prompt', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/chat',
      headers: {
        authorization: 'Bearer mock-jwt-token',
      },
      payload: {
        prompt: 'help',
      },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.status).toBe('suggestion');
    expect(body.content).toBeDefined();
    expect(body.reasoning).toBeDefined();
    expect(body.chatId).toBeDefined();
  });

  it('should bypass Bloom Buddy when override_ai_check is true', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/chat',
      headers: {
        authorization: 'Bearer mock-jwt-token',
      },
      payload: {
        prompt: 'help',
        override_ai_check: true,
      },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.status).toBe('success');
    expect(body.content).toBeDefined();
  });

  it('should reject prompt with too many words (>150)', async () => {
    const tooManyWords = 'word '.repeat(151);
    const response = await app.inject({
      method: 'POST',
      url: '/api/chat',
      headers: {
        authorization: 'Bearer mock-jwt-token',
      },
      payload: {
        prompt: tooManyWords,
      },
    });

    expect(response.statusCode).toBe(400);
  });

  it('should reject prompt with too many characters (>1200)', async () => {
    const tooManyChars = 'a'.repeat(1201);
    const response = await app.inject({
      method: 'POST',
      url: '/api/chat',
      headers: {
        authorization: 'Bearer mock-jwt-token',
      },
      payload: {
        prompt: tooManyChars,
      },
    });

    expect(response.statusCode).toBe(400);
  });

  it('should use specified AI tool when provided', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/chat',
      headers: {
        authorization: 'Bearer mock-jwt-token',
      },
      payload: {
        prompt: 'What is TypeScript?',
        aiTool: 'CHATGPT',
      },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.status).toBe('success');
    expect(body.content).toContain('ChatGPT');
  });

  it('should return 401 when no authorization header', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/chat',
      payload: {
        prompt: 'Test prompt',
      },
    });

    expect(response.statusCode).toBe(401);
  });

  it('should include chat history in AI context for existing chat', async () => {
    // First message
    const firstResponse = await app.inject({
      method: 'POST',
      url: '/api/chat',
      headers: {
        authorization: 'Bearer mock-jwt-token',
      },
      payload: {
        prompt: 'Tell me about machine learning.',
      },
    });

    const { chatId } = JSON.parse(firstResponse.body);

    // Second message in same chat
    const secondResponse = await app.inject({
      method: 'POST',
      url: '/api/chat',
      headers: {
        authorization: 'Bearer mock-jwt-token',
      },
      payload: {
        prompt: 'What are the main types?',
        chatId,
      },
    });

    expect(secondResponse.statusCode).toBe(200);
    const body = JSON.parse(secondResponse.body);
    expect(body.status).toBe('success');
    expect(body.chatId).toBe(chatId);
  });
});

describe('Chat Routes - POST /api/chat/evaluate', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await build();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return next prompt suggestion based on chat history', async () => {
    // First create a chat
    const chatResponse = await app.inject({
      method: 'POST',
      url: '/api/chat',
      headers: {
        authorization: 'Bearer mock-jwt-token',
      },
      payload: {
        prompt: 'Explain machine learning.',
      },
    });

    const { chatId } = JSON.parse(chatResponse.body);

    // Then evaluate it
    const evaluateResponse = await app.inject({
      method: 'POST',
      url: '/api/chat/evaluate',
      headers: {
        authorization: 'Bearer mock-jwt-token',
      },
      payload: {
        chatId,
      },
    });

    expect(evaluateResponse.statusCode).toBe(200);
    const body = JSON.parse(evaluateResponse.body);
    expect(body.new_prompt).toBeDefined();
    expect(typeof body.new_prompt).toBe('string');
  });

  it('should return 400 for invalid chatId', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/chat/evaluate',
      headers: {
        authorization: 'Bearer mock-jwt-token',
      },
      payload: {
        chatId: 'invalid-uuid',
      },
    });

    expect(response.statusCode).toBe(400);
  });
});

describe('Chat Routes - GET /api/chat', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await build();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return list of chats', async () => {
    // Create a chat first
    await app.inject({
      method: 'POST',
      url: '/api/chat',
      headers: {
        authorization: 'Bearer mock-jwt-token',
      },
      payload: {
        prompt: 'Test prompt for list',
      },
    });

    const response = await app.inject({
      method: 'GET',
      url: '/api/chat',
      headers: {
        authorization: 'Bearer mock-jwt-token',
      },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
  });
});

describe('Chat Routes - GET /api/chat/:id', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await build();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return chat with messages', async () => {
    // Create a chat first
    const createResponse = await app.inject({
      method: 'POST',
      url: '/api/chat',
      headers: {
        authorization: 'Bearer mock-jwt-token',
      },
      payload: {
        prompt: 'Test prompt for retrieval',
      },
    });

    const { chatId } = JSON.parse(createResponse.body);

    // Get the chat
    const response = await app.inject({
      method: 'GET',
      url: `/api/chat/${chatId}`,
      headers: {
        authorization: 'Bearer mock-jwt-token',
      },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.id).toBe(chatId);
    expect(body.messages).toBeDefined();
    expect(Array.isArray(body.messages)).toBe(true);
    expect(body.messages.length).toBeGreaterThan(0);
  });

  it('should return 400 for invalid UUID', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/chat/invalid-uuid',
      headers: {
        authorization: 'Bearer mock-jwt-token',
      },
    });

    expect(response.statusCode).toBe(400);
  });
});
