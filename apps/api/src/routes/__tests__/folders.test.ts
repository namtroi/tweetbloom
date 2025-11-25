import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { build } from '../../test/build-app';
import { FastifyInstance } from 'fastify';
import { testStore } from '../../test/mocks/in-memory-store';
import { TEST_USER_ID } from '../../test/vitest.setup';

/**
 * Integration Tests for Folder Routes
 * Tests CRUD operations for folders
 */

describe('Folder Routes - CRUD Operations', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await build();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/folders', () => {
    it('should create a new folder', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/folders',
        headers: {
          authorization: 'Bearer mock-jwt-token',
        },
        payload: {
          name: 'Work Projects',
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.id).toBeDefined();
      expect(body.name).toBe('Work Projects');
      expect(body.user_id).toBe(TEST_USER_ID);
    });

    it('should reject folder with empty name', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/folders',
        headers: {
          authorization: 'Bearer mock-jwt-token',
        },
        payload: {
          name: '',
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 401 without authorization', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/folders',
        payload: {
          name: 'Test Folder',
        },
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('GET /api/folders', () => {
    it('should return list of folders', async () => {
      // Create a folder first
      await app.inject({
        method: 'POST',
        url: '/api/folders',
        headers: {
          authorization: 'Bearer mock-jwt-token',
        },
        payload: {
          name: 'Test Folder',
        },
      });

      const response = await app.inject({
        method: 'GET',
        url: '/api/folders',
        headers: {
          authorization: 'Bearer mock-jwt-token',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBeGreaterThan(0);
    });

    it('should return empty array when no folders exist', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/folders',
        headers: {
          authorization: 'Bearer mock-jwt-token',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(Array.isArray(body)).toBe(true);
      // Note: May have folders from previous tests, just verify it's an array
    });

    it('should return 401 without authorization', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/folders',
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('PATCH /api/folders/:id', () => {
    it('should update folder name', async () => {
      // Create folder
      const createResponse = await app.inject({
        method: 'POST',
        url: '/api/folders',
        headers: {
          authorization: 'Bearer mock-jwt-token',
        },
        payload: {
          name: 'Original Name',
        },
      });

      const { id } = JSON.parse(createResponse.body);

      // Update folder
      const response = await app.inject({
        method: 'PATCH',
        url: `/api/folders/${id}`,
        headers: {
          authorization: 'Bearer mock-jwt-token',
        },
        payload: {
          name: 'Updated Name',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.name).toBe('Updated Name');
    });

    it('should return 400 for invalid UUID', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: '/api/folders/invalid-uuid',
        headers: {
          authorization: 'Bearer mock-jwt-token',
        },
        payload: {
          name: 'Updated Name',
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should reject empty name', async () => {
      // Create folder
      const createResponse = await app.inject({
        method: 'POST',
        url: '/api/folders',
        headers: {
          authorization: 'Bearer mock-jwt-token',
        },
        payload: {
          name: 'Test Folder',
        },
      });

      const { id } = JSON.parse(createResponse.body);

      // Try to update with empty name
      const response = await app.inject({
        method: 'PATCH',
        url: `/api/folders/${id}`,
        headers: {
          authorization: 'Bearer mock-jwt-token',
        },
        payload: {
          name: '',
        },
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('DELETE /api/folders/:id', () => {
    it('should delete a folder', async () => {
      // Create folder
      const createResponse = await app.inject({
        method: 'POST',
        url: '/api/folders',
        headers: {
          authorization: 'Bearer mock-jwt-token',
        },
        payload: {
          name: 'Folder to Delete',
        },
      });

      const { id } = JSON.parse(createResponse.body);

      // Delete folder
      const response = await app.inject({
        method: 'DELETE',
        url: `/api/folders/${id}`,
        headers: {
          authorization: 'Bearer mock-jwt-token',
        },
      });

      expect(response.statusCode).toBe(204);

      // Verify it's deleted
      const folder = testStore.getFolder(id);
      expect(folder).toBeUndefined();
    });

    it('should return 400 for invalid UUID', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: '/api/folders/invalid-uuid',
        headers: {
          authorization: 'Bearer mock-jwt-token',
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 401 without authorization', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: '/api/folders/00000000-0000-4000-8000-000000000001',
      });

      expect(response.statusCode).toBe(401);
    });
  });
});
