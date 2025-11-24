import { z } from 'zod';

/**
 * Count words in text
 * Handles multiple spaces, newlines, tabs, and other whitespace
 * 
 * @param text - The text to count words in
 * @returns Number of words
 * 
 * @example
 * wordCount('hello world') // 2
 * wordCount('hello    world') // 2 (multiple spaces)
 * wordCount('hello\n\tworld') // 2 (newlines and tabs)
 * wordCount("don't worry") // 2 (contractions count as 1 word)
 */
export const wordCount = (text: string): number => {
  return text
    .trim()
    .split(/\s+/) // Split on any whitespace (spaces, tabs, newlines)
    .filter(word => word.length > 0)
    .length;
};

/**
 * Content validator: 150 words max, 1200 chars max
 * 
 * This validator ensures content meets both word and character limits:
 * - Max 150 words (spec requirement)
 * - Max 1200 characters (safety net)
 * 
 * @example
 * contentValidator.parse('Valid content') // OK
 * contentValidator.parse('word '.repeat(151)) // Error: too many words
 * contentValidator.parse('a'.repeat(1201)) // Error: too many chars
 */
export const contentValidator = z
  .string()
  .min(1, 'Content is required')
  .max(1200, 'Content must be less than 1200 characters')
  .refine(
    (text) => wordCount(text) <= 150,
    {
      message: 'Content must be 150 words or less',
    }
  );

/**
 * Flexible content validator factory
 * 
 * @param maxWords - Maximum number of words allowed (default: 150)
 * @param maxChars - Maximum number of characters allowed (default: 1200)
 * @returns Zod validator with custom limits
 * 
 * @example
 * const shortValidator = createContentValidator(50, 500);
 * shortValidator.parse('Short content'); // OK
 */
export const createContentValidator = (maxWords = 150, maxChars = 1200) => {
  return z
    .string()
    .min(1, 'Content is required')
    .max(maxChars, `Content must be less than ${maxChars} characters`)
    .refine(
      (text) => wordCount(text) <= maxWords,
      {
        message: `Content must be ${maxWords} words or less`,
      }
    );
};

/**
 * Validation result for content
 */
export interface ContentValidationResult {
  isValid: boolean;
  words: number;
  chars: number;
  maxWords: number;
  maxChars: number;
  wordsRemaining: number;
  charsRemaining: number;
  errors: string[];
}

/**
 * Real-time validation helper (for frontend)
 * 
 * Provides detailed validation information without throwing errors.
 * Useful for showing real-time feedback to users as they type.
 * 
 * @param text - The text to validate
 * @returns Detailed validation result
 * 
 * @example
 * const result = validateContent('Hello world');
 * console.log(result.words); // 2
 * console.log(result.wordsRemaining); // 148
 * console.log(result.isValid); // true
 */
export const validateContent = (text: string): ContentValidationResult => {
  const words = wordCount(text);
  const chars = text.length;
  
  const errors: string[] = [];
  if (words > 150) {
    errors.push(`Exceeds word limit by ${words - 150} words`);
  }
  if (chars > 1200) {
    errors.push(`Exceeds character limit by ${chars - 1200} characters`);
  }
  
  return {
    isValid: words <= 150 && chars <= 1200,
    words,
    chars,
    maxWords: 150,
    maxChars: 1200,
    wordsRemaining: Math.max(0, 150 - words),
    charsRemaining: Math.max(0, 1200 - chars),
    errors,
  };
};
