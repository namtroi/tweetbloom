/**
 * Rate limiting configuration for API endpoints
 * 
 * These limits are designed for development environment.
 * They are generous to allow for testing and development workflow.
 */

export const RATE_LIMITS = {
  // AI endpoints (expensive operations)
  chat: {
    max: 50,              // 50 requests
    timeWindow: '1 minute' // per minute
  },
  
  evaluate: {
    max: 60,
    timeWindow: '1 minute'
  },
  
  summarize: {
    max: 30,
    timeWindow: '1 minute'
  },
  
  combine: {
    max: 20,
    timeWindow: '1 minute'
  },
  
  // CRUD endpoints (cheap operations)
  read: {
    max: 100,
    timeWindow: '1 minute'
  },
  
  write: {
    max: 50,
    timeWindow: '1 minute'
  },
  
  // Global default (fallback)
  global: {
    max: 100,
    timeWindow: '1 minute'
  }
} as const;

/**
 * Error response builder for rate limit exceeded
 */
export function rateLimitErrorResponse(req: any, context: any) {
  return {
    error: 'Rate limit exceeded',
    message: `Too many requests. Try again in ${Math.ceil(context.after / 1000)} seconds`,
    retryAfter: context.after,
    limit: context.max,
    timeWindow: context.ttl
  };
}
