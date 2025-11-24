/**
 * Text utility functions for TweetBloom
 * Handles word counting, character counting, and text validation
 */

/**
 * Counts the number of words in a text string
 * Words are separated by whitespace
 */
export function countWords(text: string): number {
  if (!text || text.trim().length === 0) return 0
  
  // Split by whitespace and filter out empty strings
  const words = text.trim().split(/\s+/).filter(word => word.length > 0)
  return words.length
}

/**
 * Counts the number of characters in a text string
 * Includes all characters including spaces
 */
export function countChars(text: string): number {
  return text.length
}

/**
 * Truncates text to a maximum length
 * Adds ellipsis (...) if truncated
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 3) + '...'
}

/**
 * Formats a date string to relative time
 * Examples: "just now", "2 mins ago", "3 hours ago", "2 days ago"
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (diffInSeconds < 10) return 'just now'
  if (diffInSeconds < 60) return `${diffInSeconds} secs ago`
  
  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) return `${diffInMinutes} min${diffInMinutes > 1 ? 's' : ''} ago`
  
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`
  
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`
  
  const diffInWeeks = Math.floor(diffInDays / 7)
  if (diffInWeeks < 4) return `${diffInWeeks} week${diffInWeeks > 1 ? 's' : ''} ago`
  
  const diffInMonths = Math.floor(diffInDays / 30)
  return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''} ago`
}

/**
 * Formats a date to a readable string
 * Example: "Nov 23, 2025"
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
