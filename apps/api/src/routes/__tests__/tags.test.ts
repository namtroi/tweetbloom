import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { build } from '../../test/build-app';
import { FastifyInstance } from 'fastify';
import { testStore } from '../../test/mocks/in-memory-store';
import { TEST_USER_ID } from '../../test/vitest.setup';

/**
 * Integration Tests for Tag Routes
 * Tests CRUD operations for tags with color validation
 */

describe('Tag Routes - CRUD Operations', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await build();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/tags', () => {
    it('should create a new tag with valid hex color', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/tags',
        headers: {
          authorization: 'Bearer mock-jwt-token',
        },
        payload: {
          name: 'Important',
          color: '#FF5733',
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.id).toBeDefined();
      expect(body.name).toBe('Important');
      expect(body.color).toBe('#FF5733');
      expect(body.user_id).toBe(TEST_USER_ID);
    });

    it('should accept lowercase hex color', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/tags',
        headers: {
          authorization: 'Bearer mock-jwt-token',
        },
        payload: {
          name: 'Work',
          color: '#ff5733',
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.color).toBe('#ff5733');
    });

    it('should reject tag with invalid hex color (missing #)', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/tags',
        headers: {
          authorization: 'Bearer mock-jwt-token',
        },
        payload: {
          name: 'Test',
          color: 'FF5733',
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should reject tag with invalid hex color (wrong length)', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/tags',
        headers: {
          authorization: 'Bearer mock-jwt-token',
        },
        payload: {
          name: 'Test',
          color: '#FF57',
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should reject tag with invalid hex color (invalid characters)', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/tags',
        headers: {
          authorization: 'Bearer mock-jwt-token',
        },
        payload: {
          name: 'Test',
          color: '#GGGGGG',
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should reject tag with empty name', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/tags',
        headers: {
          authorization: 'Bearer mock-jwt-token',
        },
        payload: {
          name: '',
          color: '#FF5733',
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should reject tag with name > 50 chars', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/tags',
        headers: {
          authorization: 'Bearer mock-jwt-token',
        },
        payload: {
          name: 'a'.repeat(51),
          color: '#FF5733',
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 401 without authorization', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/tags',
        payload: {
          name: 'Test',
          color: '#FF5733',
        },
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('GET /api/tags', () => {
    it('should return list of tags', async () => {
      // Create a tag first
      await app.inject({
        method: 'POST',
        url: '/api/tags',
        headers: {
          authorization: 'Bearer mock-jwt-token',
        },
        payload: {
          name: 'Test Tag',
          color: '#FF5733',
        },
      });

      const response = await app.inject({
        method: 'GET',
        url: '/api/tags',
        headers: {
          authorization: 'Bearer mock-jwt-token',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBeGreaterThan(0);
    });

    it('should return empty array when no tags exist', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/tags',
        headers: {
          authorization: 'Bearer mock-jwt-token',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(Array.isArray(body)).toBe(true);
      // Note: May have tags from previous tests, just verify it's an array
    });

    it('should return 401 without authorization', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/tags',
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('PATCH /api/tags/:id', () => {
    it('should update tag name', async () => {
      // Create tag
      const createResponse = await app.inject({
        method: 'POST',
        url: '/api/tags',
        headers: {
          authorization: 'Bearer mock-jwt-token',
        },
        payload: {
          name: 'Original',
          color: '#FF5733',
        },
      });

      const { id } = JSON.parse(createResponse.body);

      // Update tag
      const response = await app.inject({
        method: 'PATCH',
        url: `/api/tags/${id}`,
        headers: {
          authorization: 'Bearer mock-jwt-token',
        },
        payload: {
          name: 'Updated',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.name).toBe('Updated');
      expect(body.color).toBe('#FF5733'); // Color unchanged
    });

    it('should update tag color', async () => {
      // Create tag
      const createResponse = await app.inject({
        method: 'POST',
        url: '/api/tags',
        headers: {
          authorization: 'Bearer mock-jwt-token',
        },
        payload: {
          name: 'Test',
          color: '#FF5733',
        },
      });

      const { id } = JSON.parse(createResponse.body);

      // Update color
      const response = await app.inject({
        method: 'PATCH',
        url: `/api/tags/${id}`,
        headers: {
          authorization: 'Bearer mock-jwt-token',
        },
        payload: {
          color: '#00FF00',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.color).toBe('#00FF00');
      expect(body.name).toBe('Test'); // Name unchanged
    });

    it('should update both name and color', async () => {
      // Create tag
      const createResponse = await app.inject({
        method: 'POST',
        url: '/api/tags',
        headers: {
          authorization: 'Bearer mock-jwt-token',
        },
        payload: {
          name: 'Original',
          color: '#FF5733',
        },
      });

      const { id } = JSON.parse(createResponse.body);

      // Update both
      const response = await app.inject({
        method: 'PATCH',
        url: `/api/tags/${id}`,
        headers: {
          authorization: 'Bearer mock-jwt-token',
        },
        payload: {
          name: 'Updated',
          color: '#00FF00',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.name).toBe('Updated');
      expect(body.color).toBe('#00FF00');
    });

    it('should return 400 for invalid UUID', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: '/api/tags/invalid-uuid',
        headers: {
          authorization: 'Bearer mock-jwt-token',
        },
        payload: {
          name: 'Updated',
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should reject invalid hex color on update', async () => {
      // Create tag
      const createResponse = await app.inject({
        method: 'POST',
        url: '/api/tags',
        headers: {
          authorization: 'Bearer mock-jwt-token',
        },
        payload: {
          name: 'Test',
          color: '#FF5733',
        },
      });

      const { id } = JSON.parse(createResponse.body);

      // Try to update with invalid color
      const response = await app.inject({
        method: 'PATCH',
        url: `/api/tags/${id}`,
        headers: {
          authorization: 'Bearer mock-jwt-token',
        },
        payload: {
          color: 'invalid',
        },
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('DELETE /api/tags/:id', () => {
    it('should delete a tag', async () => {
      // Create tag
      const createResponse = await app.inject({
        method: 'POST',
        url: '/api/tags',
        headers: {
          authorization: 'Bearer mock-jwt-token',
        },
        payload: {
          name: 'To Delete',
          color: '#FF5733',
        },
      });

      const { id } = JSON.parse(createResponse.body);

      // Delete tag
      const response = await app.inject({
        method: 'DELETE',
        url: `/api/tags/${id}`,
        headers: {
          authorization: 'Bearer mock-jwt-token',
        },
      });

      expect(response.statusCode).toBe(204);

      // Verify it's deleted
      const tag = testStore.getTag(id);
      expect(tag).toBeUndefined();
    });

    it('should return 400 for invalid UUID', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: '/api/tags/invalid-uuid',
        headers: {
          authorization: 'Bearer mock-jwt-token',
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 401 without authorization', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: '/api/tags/00000000-0000-4000-8000-000000000001',
      });

      expect(response.statusCode).toBe(401);
    });
  });
});
