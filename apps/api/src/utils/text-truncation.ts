/**
 * Text truncation utilities for TweetBloom
 * Ensures all AI responses comply with word and character limits
 */

/**
 * Count words in text
 */
export function countWords(text: string): number {
    if (!text || text.trim().length === 0) return 0;
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

/**
 * Find the last sentence boundary in text
 * Returns the position after the sentence ender, or -1 if not found
 */
function findLastSentenceBoundary(text: string): number {
    const sentenceEnders = ['. ', '! ', '? ', '.\n', '!\n', '?\n'];
    let lastPosition = -1;

    for (const ender of sentenceEnders) {
        const pos = text.lastIndexOf(ender);
        if (pos > lastPosition) {
            lastPosition = pos + ender.length;
        }
    }

    return lastPosition;
}

/**
 * Truncate text to fit within word and character limits
 * Attempts to cut at sentence boundaries for better readability
 * 
 * @param text - The text to truncate
 * @param maxWords - Maximum number of words (default: 150)
 * @param maxChars - Maximum number of characters (default: 1200)
 * @returns Truncated text
 */
export function truncateToLimits(
    text: string,
    maxWords: number = 150,
    maxChars: number = 1200
): string {
    if (!text) return text;

    const wordCount = countWords(text);
    const charCount = text.length;

    // If within both limits, return as-is
    if (wordCount <= maxWords && charCount <= maxChars) {
        return text;
    }

    // Start with character limit truncation
    let truncated = text.substring(0, maxChars);

    // Try to find last complete sentence
    const lastSentenceEnd = findLastSentenceBoundary(truncated);
    
    if (lastSentenceEnd > 0 && lastSentenceEnd > maxChars * 0.7) {
        // Only use sentence boundary if it's not too far back (>70% of limit)
        truncated = truncated.substring(0, lastSentenceEnd).trim();
    } else {
        // No good sentence boundary, try to cut at last space
        const lastSpace = truncated.lastIndexOf(' ');
        if (lastSpace > 0) {
            truncated = truncated.substring(0, lastSpace).trim();
        }
    }

    // Check word count and further truncate if needed
    if (countWords(truncated) > maxWords) {
        const words = truncated.split(/\s+/);
        truncated = words.slice(0, maxWords).join(' ');

        // Try to end at a sentence boundary again
        const sentenceEnd = findLastSentenceBoundary(truncated);
        if (sentenceEnd > 0 && sentenceEnd > truncated.length * 0.7) {
            truncated = truncated.substring(0, sentenceEnd).trim();
        }
    }

    return truncated.trim();
}

/**
 * Check if text was truncated
 */
export function wasTruncated(
    originalText: string,
    truncatedText: string
): boolean {
    return originalText.length > truncatedText.length;
}

/**
 * Get truncation stats for logging
 */
export function getTruncationStats(
    originalText: string,
    truncatedText: string
) {
    return {
        originalWords: countWords(originalText),
        originalChars: originalText.length,
        truncatedWords: countWords(truncatedText),
        truncatedChars: truncatedText.length,
        wasTruncated: wasTruncated(originalText, truncatedText),
    };
}
