import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { validateEnv } from '../env';

describe('Environment Validation', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment and clear module cache before each test
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('validateEnv', () => {
    it('should validate correct environment variables', () => {
      process.env.SUPABASE_URL = 'https://example.supabase.co';
      process.env.SUPABASE_ANON_KEY = 'test-anon-key';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
      process.env.GEMINI_API_KEY = 'test-gemini-key';

      const env = validateEnv();

      expect(env.SUPABASE_URL).toBe('https://example.supabase.co');
      expect(env.SUPABASE_ANON_KEY).toBe('test-anon-key');
      expect(env.SUPABASE_SERVICE_ROLE_KEY).toBe('test-service-key');
      expect(env.GEMINI_API_KEY).toBe('test-gemini-key');
    });

    it('should apply default values', () => {
      process.env.SUPABASE_URL = 'https://example.supabase.co';
      process.env.SUPABASE_ANON_KEY = 'test-anon-key';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
      process.env.GEMINI_API_KEY = 'test-gemini-key';
      delete process.env.NODE_ENV; // Remove to test default

      const env = validateEnv();

      expect(env.PORT).toBe(3001);
      expect(env.NODE_ENV).toBe('development'); // Default when not set
      expect(env.GEMINI_AI).toBe('gemini-2.0-flash-exp');
      expect(env.OPENAI_AI).toBe('gpt-4o-mini');
      expect(env.GROK_AI).toBe('grok-beta');
    });

    it('should allow optional AI provider keys', () => {
      process.env.SUPABASE_URL = 'https://example.supabase.co';
      process.env.SUPABASE_ANON_KEY = 'test-anon-key';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
      process.env.GEMINI_API_KEY = 'test-gemini-key';
      // OPENAI_API_KEY and GROK_API_KEY are optional

      const env = validateEnv();

      expect(env.GEMINI_API_KEY).toBe('test-gemini-key');
      expect(env.OPENAI_API_KEY).toBeUndefined();
      expect(env.GROK_API_KEY).toBeUndefined();
    });

    it('should fail on missing SUPABASE_URL', () => {
      delete process.env.SUPABASE_URL;
      process.env.SUPABASE_ANON_KEY = 'test-anon-key';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
      process.env.GEMINI_API_KEY = 'test-gemini-key';

      // Mock process.exit to prevent test from exiting
      const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      validateEnv();

      expect(mockExit).toHaveBeenCalledWith(1);
      mockExit.mockRestore();
    });

    it('should fail on missing GEMINI_API_KEY', () => {
      process.env.SUPABASE_URL = 'https://example.supabase.co';
      process.env.SUPABASE_ANON_KEY = 'test-anon-key';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
      delete process.env.GEMINI_API_KEY;

      const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      validateEnv();

      expect(mockExit).toHaveBeenCalledWith(1);
      mockExit.mockRestore();
    });

    it('should fail on invalid SUPABASE_URL format', () => {
      process.env.SUPABASE_URL = 'not-a-valid-url';
      process.env.SUPABASE_ANON_KEY = 'test-anon-key';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
      process.env.GEMINI_API_KEY = 'test-gemini-key';

      const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      validateEnv();

      expect(mockExit).toHaveBeenCalledWith(1);
      mockExit.mockRestore();
    });

    it('should parse PORT as number', () => {
      process.env.SUPABASE_URL = 'https://example.supabase.co';
      process.env.SUPABASE_ANON_KEY = 'test-anon-key';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
      process.env.GEMINI_API_KEY = 'test-gemini-key';
      process.env.PORT = '4000';

      const env = validateEnv();

      expect(env.PORT).toBe(4000);
      expect(typeof env.PORT).toBe('number');
    });

    it('should validate NODE_ENV enum', () => {
      process.env.SUPABASE_URL = 'https://example.supabase.co';
      process.env.SUPABASE_ANON_KEY = 'test-anon-key';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
      process.env.GEMINI_API_KEY = 'test-gemini-key';
      process.env.NODE_ENV = 'production';

      const env = validateEnv();

      expect(env.NODE_ENV).toBe('production');
    });

    it('should fail on invalid NODE_ENV', () => {
      process.env.SUPABASE_URL = 'https://example.supabase.co';
      process.env.SUPABASE_ANON_KEY = 'test-anon-key';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
      process.env.GEMINI_API_KEY = 'test-gemini-key';
      process.env.NODE_ENV = 'invalid-env';

      const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      validateEnv();

      expect(mockExit).toHaveBeenCalledWith(1);
      mockExit.mockRestore();
    });
  });
});
