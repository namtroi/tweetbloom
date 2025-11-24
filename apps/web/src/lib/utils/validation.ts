/**
 * Validation utility functions for TweetBloom
 * Handles prompt validation and chat constraints
 */

import { countWords, countChars } from './text'

export interface ValidationResult {
  valid: boolean
  error?: string
  wordCount?: number
  charCount?: number
}

/**
 * Validates a prompt against TweetBloom constraints
 * - Max 150 words
 * - Max 1200 characters
 */
export function validatePrompt(
  text: string,
  maxWords: number = 150,
  maxChars: number = 1200
): ValidationResult {
  if (!text || text.trim().length === 0) {
    return {
      valid: false,
      error: 'Prompt cannot be empty',
    }
  }

  const wordCount = countWords(text)
  const charCount = countChars(text)

  if (wordCount > maxWords) {
    return {
      valid: false,
      error: `Prompt must be ${maxWords} words or less (currently ${wordCount} words)`,
      wordCount,
      charCount,
    }
  }

  if (charCount > maxChars) {
    return {
      valid: false,
      error: `Prompt must be ${maxChars} characters or less (currently ${charCount} characters)`,
      wordCount,
      charCount,
    }
  }

  return {
    valid: true,
    wordCount,
    charCount,
  }
}

/**
 * Checks if a user can send a message in a chat
 * - Chat must not have reached 7 response limit
 */
export function canSendMessage(messageCount: number, maxResponses: number = 7): boolean {
  // Count only assistant messages (responses)
  return messageCount < maxResponses
}

/**
 * Checks if a chat has reached the response limit
 */
export function hasReachedLimit(responseCount: number, maxResponses: number = 7): boolean {
  return responseCount >= maxResponses
}
