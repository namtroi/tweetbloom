import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { build } from '../../test/build-app';
import { FastifyInstance } from 'fastify';
import { testStore } from '../../test/mocks/in-memory-store';
import { TEST_USER_ID } from '../../test/vitest.setup';

/**
 * Integration Tests for Notes Routes
 * Tests CRUD operations, summarize, and combine functionality
 */

describe('Notes Routes - CRUD Operations', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await build();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/notes', () => {
    it('should create a new note', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/notes',
        headers: {
          authorization: 'Bearer mock-jwt-token',
        },
        payload: {
          content: 'This is a test note about React hooks.',
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.id).toBeDefined();
      expect(body.content).toBe('This is a test note about React hooks.');
      expect(body.user_id).toBe(TEST_USER_ID);
    });

    it('should create a note with parent (nested note)', async () => {
      // Create parent note first
      const parentResponse = await app.inject({
        method: 'POST',
        url: '/api/notes',
        headers: {
          authorization: 'Bearer mock-jwt-token',
        },
        payload: {
          content: 'Parent note',
        },
      });

      const parent = JSON.parse(parentResponse.body);

      // Create child note
      const response = await app.inject({
        method: 'POST',
        url: '/api/notes',
        headers: {
          authorization: 'Bearer mock-jwt-token',
        },
        payload: {
          content: 'Child note',
          parentId: parent.id,
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.parent_id).toBe(parent.id);
    });

    it('should reject note with empty content', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/notes',
        headers: {
          authorization: 'Bearer mock-jwt-token',
        },
        payload: {
          content: '',
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should reject note with content > 1200 chars', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/notes',
        headers: {
          authorization: 'Bearer mock-jwt-token',
        },
        payload: {
          content: 'a'.repeat(1201),
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 401 without authorization', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/notes',
        payload: {
          content: 'Test note',
        },
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('GET /api/notes', () => {
    it('should return list of notes', async () => {
      // Create a note first
      await app.inject({
        method: 'POST',
        url: '/api/notes',
        headers: {
          authorization: 'Bearer mock-jwt-token',
        },
        payload: {
          content: 'Test note for list',
        },
      });

      const response = await app.inject({
        method: 'GET',
        url: '/api/notes',
        headers: {
          authorization: 'Bearer mock-jwt-token',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBeGreaterThan(0);
    });

    it('should return 401 without authorization', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/notes',
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('PATCH /api/notes/:id', () => {
    it('should update note content', async () => {
      // Create note
      const createResponse = await app.inject({
        method: 'POST',
        url: '/api/notes',
        headers: {
          authorization: 'Bearer mock-jwt-token',
        },
        payload: {
          content: 'Original content',
        },
      });

      const { id } = JSON.parse(createResponse.body);

      // Update note
      const response = await app.inject({
        method: 'PATCH',
        url: `/api/notes/${id}`,
        headers: {
          authorization: 'Bearer mock-jwt-token',
        },
        payload: {
          content: 'Updated content',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.content).toBe('Updated content');
    });

    it('should return 400 for invalid UUID', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: '/api/notes/invalid-uuid',
        headers: {
          authorization: 'Bearer mock-jwt-token',
        },
        payload: {
          content: 'Updated content',
        },
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('DELETE /api/notes/:id', () => {
    it('should delete a note', async () => {
      // Create note
      const createResponse = await app.inject({
        method: 'POST',
        url: '/api/notes',
        headers: {
          authorization: 'Bearer mock-jwt-token',
        },
        payload: {
          content: 'Note to delete',
        },
      });

      const { id } = JSON.parse(createResponse.body);

      // Delete note
      const response = await app.inject({
        method: 'DELETE',
        url: `/api/notes/${id}`,
        headers: {
          authorization: 'Bearer mock-jwt-token',
        },
      });

      expect(response.statusCode).toBe(204);

      // Verify it's deleted
      const note = testStore.getNote(id);
      expect(note).toBeUndefined();
    });

    it('should return 400 for invalid UUID', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: '/api/notes/invalid-uuid',
        headers: {
          authorization: 'Bearer mock-jwt-token',
        },
      });

      expect(response.statusCode).toBe(400);
    });
  });
});

describe('Notes Routes - Summarize & Combine', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await build();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/notes/summarize', () => {
    it('should summarize chat to note', async () => {
      // Create a chat first
      const chatResponse = await app.inject({
        method: 'POST',
        url: '/api/chat',
        headers: {
          authorization: 'Bearer mock-jwt-token',
        },
        payload: {
          prompt: 'Explain React hooks.',
        },
      });

      const { chatId } = JSON.parse(chatResponse.body);

      // Summarize chat
      const response = await app.inject({
        method: 'POST',
        url: '/api/notes/summarize',
        headers: {
          authorization: 'Bearer mock-jwt-token',
        },
        payload: {
          chatId,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.noteId).toBeDefined();
      expect(body.content).toBeDefined();
    });

    it('should return 400 for invalid chatId', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/notes/summarize',
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

  describe('POST /api/notes/combine', () => {
    it('should combine multiple notes', async () => {
      // Create 2 notes
      const note1Response = await app.inject({
        method: 'POST',
        url: '/api/notes',
        headers: {
          authorization: 'Bearer mock-jwt-token',
        },
        payload: {
          content: 'Note 1: React is a UI library.',
        },
      });

      const note2Response = await app.inject({
        method: 'POST',
        url: '/api/notes',
        headers: {
          authorization: 'Bearer mock-jwt-token',
        },
        payload: {
          content: 'Note 2: Vue is a progressive framework.',
        },
      });

      const note1 = JSON.parse(note1Response.body);
      const note2 = JSON.parse(note2Response.body);

      // Combine notes
      const response = await app.inject({
        method: 'POST',
        url: '/api/notes/combine',
        headers: {
          authorization: 'Bearer mock-jwt-token',
        },
        payload: {
          noteIds: [note1.id, note2.id],
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.noteId).toBeDefined();
      expect(body.content).toBeDefined();
    });

    it('should reject combining less than 2 notes', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/notes/combine',
        headers: {
          authorization: 'Bearer mock-jwt-token',
        },
        payload: {
          noteIds: ['some-uuid'],
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should reject combining more than 7 notes', async () => {
      const noteIds = Array(8).fill('00000000-0000-4000-8000-000000000001');
      
      const response = await app.inject({
        method: 'POST',
        url: '/api/notes/combine',
        headers: {
          authorization: 'Bearer mock-jwt-token',
        },
        payload: {
          noteIds,
        },
      });

      expect(response.statusCode).toBe(400);
    });
  });
});
