import { describe, it, expect } from 'vitest';
import { wordCount, contentValidator, createContentValidator, validateContent } from '../validators';

describe('Word Count Validator', () => {
  describe('wordCount', () => {
    it('should count simple words correctly', () => {
      expect(wordCount('hello world')).toBe(2);
      expect(wordCount('one')).toBe(1);
      expect(wordCount('one two three')).toBe(3);
    });

    it('should handle multiple spaces', () => {
      expect(wordCount('hello    world')).toBe(2);
      expect(wordCount('one  two   three')).toBe(3);
    });

    it('should handle newlines and tabs', () => {
      expect(wordCount('hello\nworld')).toBe(2);
      expect(wordCount('hello\tworld')).toBe(2);
      expect(wordCount('hello\n\tworld')).toBe(2);
      expect(wordCount('one\ntwo\nthree')).toBe(3);
    });

    it('should handle empty string', () => {
      expect(wordCount('')).toBe(0);
      expect(wordCount('   ')).toBe(0);
      expect(wordCount('\n\t')).toBe(0);
    });

    it('should handle punctuation correctly', () => {
      expect(wordCount("don't worry")).toBe(2);
      expect(wordCount("it's fine!")).toBe(2);
      expect(wordCount("hello, world!")).toBe(2);
      expect(wordCount("one-two-three")).toBe(1); // Hyphenated words count as one
    });

    it('should handle leading and trailing whitespace', () => {
      expect(wordCount('  hello world  ')).toBe(2);
      expect(wordCount('\n\thello world\n\t')).toBe(2);
    });

    it('should handle mixed whitespace', () => {
      expect(wordCount('hello \n world \t test')).toBe(3);
    });

    it('should handle unicode characters', () => {
      expect(wordCount('café résumé')).toBe(2);
      expect(wordCount('你好 世界')).toBe(2);
    });

    it('should handle very long text', () => {
      const longText = 'word '.repeat(200).trim();
      expect(wordCount(longText)).toBe(200);
    });
  });

  describe('contentValidator', () => {
    it('should accept valid content', () => {
      const result = contentValidator.safeParse('This is valid content');
      expect(result.success).toBe(true);
    });

    it('should accept content at word limit (150 words)', () => {
      const text = 'word '.repeat(150).trim();
      const result = contentValidator.safeParse(text);
      expect(result.success).toBe(true);
    });

    it('should accept content at character limit (1200 chars)', () => {
      const text = 'a'.repeat(1200);
      const result = contentValidator.safeParse(text);
      expect(result.success).toBe(true);
    });

    it('should reject empty content', () => {
      const result = contentValidator.safeParse('');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('required');
      }
    });

    it('should reject content over 150 words', () => {
      const text = 'word '.repeat(151);
      const result = contentValidator.safeParse(text);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('150 words');
      }
    });

    it('should reject content over 1200 characters', () => {
      const text = 'a'.repeat(1201);
      const result = contentValidator.safeParse(text);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('1200 characters');
      }
    });

    it('should reject content that exceeds both limits', () => {
      const text = 'word '.repeat(300); // Exceeds both word and char limits
      const result = contentValidator.safeParse(text);
      expect(result.success).toBe(false);
    });

    it('should handle content with newlines', () => {
      const text = 'Line 1\nLine 2\nLine 3';
      const result = contentValidator.safeParse(text);
      expect(result.success).toBe(true);
    });

    it('should handle content with special characters', () => {
      const text = 'Hello! How are you? I\'m fine, thanks.';
      const result = contentValidator.safeParse(text);
      expect(result.success).toBe(true);
    });
  });

  describe('createContentValidator', () => {
    it('should create validator with custom limits', () => {
      const validator = createContentValidator(50, 500);
      
      const validText = 'word '.repeat(50).trim();
      expect(validator.safeParse(validText).success).toBe(true);
      
      const invalidText = 'word '.repeat(51);
      expect(validator.safeParse(invalidText).success).toBe(false);
    });

    it('should use default limits when not specified', () => {
      const validator = createContentValidator();
      
      const validText = 'word '.repeat(150).trim();
      expect(validator.safeParse(validText).success).toBe(true);
      
      const invalidText = 'word '.repeat(151);
      expect(validator.safeParse(invalidText).success).toBe(false);
    });

    it('should enforce character limit', () => {
      const validator = createContentValidator(1000, 100);
      
      const text = 'a'.repeat(101);
      const result = validator.safeParse(text);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('100 characters');
      }
    });

    it('should enforce word limit', () => {
      const validator = createContentValidator(10, 1000);
      
      const text = 'word '.repeat(11);
      const result = validator.safeParse(text);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('10 words');
      }
    });
  });

  describe('validateContent', () => {
    it('should return valid result for valid content', () => {
      const result = validateContent('Hello world');
      
      expect(result.isValid).toBe(true);
      expect(result.words).toBe(2);
      expect(result.chars).toBe(11);
      expect(result.maxWords).toBe(150);
      expect(result.maxChars).toBe(1200);
      expect(result.wordsRemaining).toBe(148);
      expect(result.charsRemaining).toBe(1189);
      expect(result.errors).toEqual([]);
    });

    it('should return invalid result for too many words', () => {
      const text = 'word '.repeat(151);
      const result = validateContent(text);
      
      expect(result.isValid).toBe(false);
      expect(result.words).toBe(151);
      expect(result.wordsRemaining).toBe(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Exceeds word limit by 1 words');
    });

    it('should return invalid result for too many characters', () => {
      const text = 'a'.repeat(1201);
      const result = validateContent(text);
      
      expect(result.isValid).toBe(false);
      expect(result.chars).toBe(1201);
      expect(result.charsRemaining).toBe(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Exceeds character limit by 1 characters');
    });

    it('should return multiple errors when exceeding both limits', () => {
      const text = 'word '.repeat(300);
      const result = validateContent(text);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(2);
      expect(result.errors[0]).toContain('word limit');
      expect(result.errors[1]).toContain('character limit');
    });

    it('should handle empty content', () => {
      const result = validateContent('');
      
      expect(result.isValid).toBe(true);
      expect(result.words).toBe(0);
      expect(result.chars).toBe(0);
      expect(result.wordsRemaining).toBe(150);
      expect(result.charsRemaining).toBe(1200);
    });

    it('should handle content at exact limits', () => {
      const text = 'word '.repeat(150).trim();
      const result = validateContent(text);
      
      expect(result.isValid).toBe(true);
      expect(result.words).toBe(150);
      expect(result.wordsRemaining).toBe(0);
    });

    it('should not show negative remaining counts', () => {
      const text = 'word '.repeat(200).trim();
      const result = validateContent(text);
      
      expect(result.words).toBe(200);
      expect(result.wordsRemaining).toBe(0); // Not negative (clamped to 0)
      expect(result.charsRemaining).toBeGreaterThanOrEqual(0); // Not negative
    });
  });

  describe('Edge Cases', () => {
    it('should handle only whitespace', () => {
      expect(wordCount('     ')).toBe(0);
      expect(wordCount('\n\n\n')).toBe(0);
      expect(wordCount('\t\t\t')).toBe(0);
    });

    it('should handle single character', () => {
      expect(wordCount('a')).toBe(1);
    });

    it('should handle very long single word', () => {
      const longWord = 'a'.repeat(1500);
      expect(wordCount(longWord)).toBe(1);
    });

    it('should handle numbers as words', () => {
      expect(wordCount('123 456 789')).toBe(3);
    });

    it('should handle mixed content', () => {
      const text = 'Hello123 world456 test789';
      expect(wordCount(text)).toBe(3);
    });

    it('should handle URLs', () => {
      const text = 'Check out https://example.com for more info';
      expect(wordCount(text)).toBe(6);
    });

    it('should handle code snippets', () => {
      const text = 'const x = 10;';
      expect(wordCount(text)).toBe(4);
    });
  });
});
