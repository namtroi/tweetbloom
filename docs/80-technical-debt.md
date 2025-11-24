# 🔧 Technical Debt & Fixes Plan

**Created**: 2025-11-23  
**Status**: Planning  
**Priority**: High  
**Phase**: Development

---

## 📋 OVERVIEW

This document tracks all technical debt and fixes needed for the TweetBloom project during the development phase.

---

## 🔴 CRITICAL FIXES (Phase 2 - Post Implementation)

### Issue #2: Supabase Type Inference (@ts-ignore)

**Problem**:
- Multiple `@ts-ignore` comments in route handlers
- Supabase `.insert()` returns `never` type for `id` field
- Runtime safety compromised

**Affected Files**:
- `apps/api/src/routes/chat/index.ts` (lines 38, 57, 96)
- `apps/api/src/routes/notes/summarize.ts` (line 43)
- `apps/api/src/routes/notes/combine.ts` (line 43)

**Root Cause**:
- Supabase type generation doesn't infer correctly for `.insert().select().single()`
- Generic type `Database` not passed through properly

**Proposed Solutions**:

**Option A: Custom Type Helpers**
```typescript
// packages/types/supabase-helpers.ts
export type InsertResult<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Row'];

// Usage:
const { data } = await supabase.from('chats').insert({...}).select().single();
const chat = data as InsertResult<'chats'>;
```

**Option B: Type Assertions with Runtime Validation (Recommended)**
```typescript
import { z } from 'zod';

const ChatRowSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  title: z.string(),
  ai_tool: z.enum(['GEMINI', 'CHATGPT', 'GROK']),
  created_at: z.string(),
  updated_at: z.string(),
});

const { data } = await supabase.from('chats').insert({...}).select().single();
const chat = ChatRowSchema.parse(data); // Runtime validation + type safety
```

**Option C: Update Supabase Types Generation**
- Re-generate types with latest Supabase CLI
- Check if newer version fixes inference

**Recommendation**: **Option B** (Type Assertions + Runtime Validation)
- Provides runtime safety
- Clear error messages
- Minimal code changes
- Can be refactored to Option A later
- Catches data inconsistencies early

**Implementation Steps**:
1. Create `packages/types/db-schemas.ts` with Zod schemas for all table rows
2. Replace `@ts-ignore` + `as any` with schema validation
3. Add error handling for validation failures
4. Update all affected route handlers
5. Add tests for schema validation

**Estimated Effort**: 2-3 hours

---

### Issue #3: Environment Variables Validation

**Problem**:
- No validation at startup
- Server starts successfully but fails at runtime when calling AI providers
- Hard to debug missing/invalid env vars
- No type safety for environment variables

**Current State**:
```typescript
// apps/api/src/services/ai/providers/gemini.ts
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
```

**Issues**:
- Validation happens lazily (when provider is first used)
- No validation for Supabase keys
- No type safety for env vars
- Inconsistent error messages

**Proposed Solution**:

**Create Env Validation Schema**:
```typescript
// apps/api/src/config/env.ts
import { z } from 'zod';

const envSchema = z.object({
  // Supabase
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  
  // AI Providers (at least one required)
  GEMINI_API_KEY: z.string().min(1),
  OPENAI_API_KEY: z.string().min(1).optional(),
  GROK_API_KEY: z.string().min(1).optional(),
  
  // AI Models (with defaults)
  GEMINI_AI: z.string().default('gemini-2.5-flash-lite'),
  OPENAI_AI: z.string().default('gpt-5-nano'),
  GROK_AI: z.string().default('grok-4-fast-reasoning'),
  
  // Server
  PORT: z.coerce.number().default(3001),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(): Env {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    console.error('❌ Invalid environment variables:');
    if (error instanceof z.ZodError) {
      error.errors.forEach(err => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
    }
    process.exit(1);
  }
}
```

**Usage**:
```typescript
// apps/api/src/index.ts
import { validateEnv } from './config/env';

const env = validateEnv(); // Validate at startup, fail fast

// Later in code:
const apiKey = env.GEMINI_API_KEY; // Type-safe access
```

**Benefits**:
- ✅ Fail fast at startup (before server starts)
- ✅ Type-safe env access throughout codebase
- ✅ Clear, structured error messages
- ✅ Default values support
- ✅ Self-documenting via schema

**Implementation Steps**:
1. Create `apps/api/src/config/env.ts`
2. Add validation call in `apps/api/src/index.ts` (before server start)
3. Update all env access to use validated env object:
   - `apps/api/src/services/ai/providers/*.ts`
   - `apps/api/src/lib/supabase.ts`
4. Create/update `.env.example` with all required vars
5. Add tests for env validation

**Estimated Effort**: 1-2 hours

---

### Issue #4: Rate Limiting

**Problem**:
- No rate limiting on any endpoints
- Risk of API abuse during development
- Excessive AI API costs
- No protection against accidental infinite loops in tests

**Proposed Solution**:

**Install & Configure @fastify/rate-limit**:
```typescript
// apps/api/src/index.ts
import rateLimit from '@fastify/rate-limit';

await app.register(rateLimit, {
  global: false, // Apply per-route for flexibility
  max: 100,
  timeWindow: '1 minute',
  cache: 10000,
  allowList: ['127.0.0.1'], // Allow localhost for local testing
});
```

**Per-Route Limits (Development-friendly)**:
```typescript
// Reasonable limits for development
app.post('/api/chat', {
  config: {
    rateLimit: {
      max: 50, // 50 requests per minute (generous for dev)
      timeWindow: '1 minute'
    }
  },
  preHandler: [authMiddleware],
  // ... rest of config
});

// Stricter for expensive operations
app.post('/api/notes/combine', {
  config: {
    rateLimit: {
      max: 20,
      timeWindow: '1 minute'
    }
  },
  // ...
});
```

**User-based Rate Limiting**:
```typescript
await app.register(rateLimit, {
  global: false,
  keyGenerator: (req) => {
    // Rate limit per user (or IP if not authenticated)
    return req.user?.id || req.ip;
  },
  errorResponseBuilder: (req, context) => {
    return {
      error: 'Rate limit exceeded',
      message: `Too many requests. Try again in ${Math.ceil(context.after / 1000)}s`,
      retryAfter: context.after
    };
  }
});
```

**Recommended Limits (Development)**:
```typescript
// apps/api/src/config/rate-limits.ts
export const RATE_LIMITS = {
  // AI endpoints (expensive)
  chat: { max: 50, timeWindow: '1 minute' },
  evaluate: { max: 60, timeWindow: '1 minute' },
  summarize: { max: 30, timeWindow: '1 minute' },
  combine: { max: 20, timeWindow: '1 minute' },
  
  // CRUD endpoints (cheap)
  read: { max: 100, timeWindow: '1 minute' },
  write: { max: 50, timeWindow: '1 minute' },
};
```

**Implementation Steps**:
1. Install: `pnpm add @fastify/rate-limit -w apps/api`
2. Create `apps/api/src/config/rate-limits.ts` with limit definitions
3. Register plugin in `apps/api/src/index.ts`
4. Apply per-route limits to AI endpoints
5. Add tests for rate limiting behavior
6. Update test scripts to handle rate limits

**Estimated Effort**: 2 hours

---

### Issue #5: Input Validation (Word Count)

**Problem**:
- Spec says "Max 150 words"
- Code validates "Max 150 characters" (`.max(150)`)
- Mismatch between spec and implementation
- No character limit as safety net

**Requirements**:
- Max 150 words
- Max 1200 characters (safety net)
- Clear error messages showing both counts

**Proposed Solution**:

**Custom Zod Validator**:
```typescript
// packages/types/validators.ts
import { z } from 'zod';

/**
 * Count words in text
 * Handles multiple spaces, newlines, and tabs
 */
export const wordCount = (text: string): number => {
  return text
    .trim()
    .split(/\s+/) // Split on any whitespace
    .filter(word => word.length > 0)
    .length;
};

/**
 * Content validator: 150 words max, 1200 chars max
 */
export const contentValidator = z
  .string()
  .min(1, 'Content is required')
  .max(1200, 'Content must be less than 1200 characters')
  .refine(
    (text) => wordCount(text) <= 150,
    (text) => ({
      message: `Content must be 150 words or less (currently ${wordCount(text)} words)`,
    })
  );

/**
 * Flexible content validator factory
 */
export const createContentValidator = (maxWords = 150, maxChars = 1200) => {
  return z
    .string()
    .min(1, 'Content is required')
    .max(maxChars, `Content must be less than ${maxChars} characters`)
    .refine(
      (text) => wordCount(text) <= maxWords,
      (text) => ({
        message: `Content must be ${maxWords} words or less (currently ${wordCount(text)} words)`,
      })
    );
};

/**
 * Real-time validation helper (for frontend)
 */
export const validateContent = (text: string) => {
  const words = wordCount(text);
  const chars = text.length;
  
  return {
    isValid: words <= 150 && chars <= 1200,
    words,
    chars,
    maxWords: 150,
    maxChars: 1200,
    wordsRemaining: Math.max(0, 150 - words),
    charsRemaining: Math.max(0, 1200 - chars),
    errors: [
      ...(words > 150 ? [`Exceeds word limit by ${words - 150} words`] : []),
      ...(chars > 1200 ? [`Exceeds character limit by ${chars - 1200} characters`] : []),
    ]
  };
};
```

**Update Schemas**:
```typescript
// packages/types/index.ts
import { contentValidator } from './validators';

export const ChatRequestSchema = z.object({
  prompt: contentValidator, // Replace .max(150)
  chatId: z.string().uuid().optional(),
  aiTool: z.enum(['GEMINI', 'CHATGPT', 'GROK']).optional(),
  override_ai_check: z.boolean().optional().default(false)
});

export const CreateNoteSchema = z.object({
  content: contentValidator,
  parentId: z.string().uuid().nullable().optional()
});

export const UpdateNoteSchema = z.object({
  content: contentValidator.optional(),
  parentId: z.string().uuid().nullable().optional(),
  tagIds: z.array(z.string().uuid()).optional()
});
```

**Error Response Format**:
```typescript
// When validation fails:
{
  "error": "Validation failed",
  "details": [
    {
      "field": "prompt",
      "message": "Content must be 150 words or less (currently 175 words)",
      "current": {
        "words": 175,
        "chars": 1050
      },
      "limits": {
        "maxWords": 150,
        "maxChars": 1200
      }
    }
  ]
}
```

**Implementation Steps**:
1. Create `packages/types/validators.ts`
2. Implement `wordCount()` and `contentValidator`
3. Update all schemas using `.max(150)`:
   - `ChatRequestSchema`
   - `CreateNoteSchema`
   - `UpdateNoteSchema`
4. Add comprehensive tests for word counting edge cases
5. Update API error responses to include word/char counts
6. Update docs with new validation rules

**Edge Cases to Test**:
- Multiple spaces between words
- Newlines and tabs
- Punctuation (e.g., "don't" counts as 1 word)
- Empty strings
- Unicode characters
- Very long single words
- Mixed content (code, URLs, etc.)

**Estimated Effort**: 2-3 hours

---

## 🧪 TESTING REQUIREMENTS

### Current State
- ✅ E2E test script: `scripts/test-chat.ts`
- ❌ No unit tests
- ❌ No integration tests
- ❌ No validation tests

### Required Tests

#### 1. Unit Tests for Validators
**File**: `packages/types/__tests__/validators.test.ts`

```typescript
describe('wordCount', () => {
  it('counts simple words correctly', () => {
    expect(wordCount('hello world')).toBe(2);
  });
  
  it('handles multiple spaces', () => {
    expect(wordCount('hello    world')).toBe(2);
  });
  
  it('handles newlines and tabs', () => {
    expect(wordCount('hello\n\tworld')).toBe(2);
  });
  
  it('handles empty string', () => {
    expect(wordCount('')).toBe(0);
  });
  
  it('handles punctuation', () => {
    expect(wordCount("don't worry, it's fine!")).toBe(4);
  });
});

describe('contentValidator', () => {
  it('accepts valid content', () => {
    const result = contentValidator.safeParse('This is valid content');
    expect(result.success).toBe(true);
  });
  
  it('rejects content over 150 words', () => {
    const longText = 'word '.repeat(151);
    const result = contentValidator.safeParse(longText);
    expect(result.success).toBe(false);
  });
  
  it('rejects content over 1200 characters', () => {
    const longText = 'a'.repeat(1201);
    const result = contentValidator.safeParse(longText);
    expect(result.success).toBe(false);
  });
});
```

#### 2. Unit Tests for Env Validation
**File**: `apps/api/src/config/__tests__/env.test.ts`

```typescript
describe('validateEnv', () => {
  it('validates correct env vars', () => {
    process.env.SUPABASE_URL = 'https://example.supabase.co';
    process.env.GEMINI_API_KEY = 'test-key';
    // ... set all required vars
    
    const env = validateEnv();
    expect(env.SUPABASE_URL).toBe('https://example.supabase.co');
  });
  
  it('fails on missing required vars', () => {
    delete process.env.GEMINI_API_KEY;
    expect(() => validateEnv()).toThrow();
  });
  
  it('applies default values', () => {
    const env = validateEnv();
    expect(env.PORT).toBe(3001);
  });
});
```

#### 3. Integration Tests for Rate Limiting
**File**: `apps/api/src/__tests__/rate-limit.test.ts`

```typescript
describe('Rate Limiting', () => {
  it('allows requests under limit', async () => {
    for (let i = 0; i < 10; i++) {
      const res = await app.inject({
        method: 'POST',
        url: '/api/chat',
        headers: { Authorization: `Bearer ${token}` },
        payload: { prompt: 'test' }
      });
      expect(res.statusCode).toBe(200);
    }
  });
  
  it('blocks requests over limit', async () => {
    // Make 51 requests (limit is 50)
    for (let i = 0; i < 51; i++) {
      await app.inject({
        method: 'POST',
        url: '/api/chat',
        headers: { Authorization: `Bearer ${token}` },
        payload: { prompt: 'test' }
      });
    }
    
    const res = await app.inject({
      method: 'POST',
      url: '/api/chat',
      headers: { Authorization: `Bearer ${token}` },
      payload: { prompt: 'test' }
    });
    
    expect(res.statusCode).toBe(429);
    expect(res.json()).toHaveProperty('error', 'Rate limit exceeded');
  });
});
```

#### 4. Integration Tests for Type Safety
**File**: `apps/api/src/routes/__tests__/chat.test.ts`

```typescript
describe('POST /api/chat', () => {
  it('returns properly typed chat object', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/chat',
      headers: { Authorization: `Bearer ${token}` },
      payload: { prompt: 'Explain quantum computing' }
    });
    
    const data = res.json();
    expect(data).toHaveProperty('chatId');
    expect(data).toHaveProperty('messageId');
    expect(data.chatId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  });
});
```

#### 5. Update E2E Test Script
**File**: `scripts/test-chat.ts`

Add tests for:
- Word count validation (send 151 words, expect error)
- Character limit validation (send 1201 chars, expect error)
- Rate limiting (make 51 requests, expect 429)
- Env validation (covered by startup)

### Testing Setup

**Install Testing Dependencies**:
```bash
pnpm add -D vitest @vitest/ui -w apps/api
pnpm add -D @types/node -w packages/types
```

**Add Test Scripts**:
```json
// apps/api/package.json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

**Create Vitest Config**:
```typescript
// apps/api/vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
});
```

**Estimated Effort for Testing**: 3-4 hours

---

## 📊 IMPLEMENTATION PRIORITY

| Issue | Priority | Effort | Impact | Testing | Order |
|-------|----------|--------|--------|---------|-------|
| #3 - Env Validation | High | 1-2h | High | 1h | 1️⃣ |
| #5 - Word Count | High | 2-3h | High | 1h | 2️⃣ |
| #2 - Type Safety | High | 2-3h | Medium | 1h | 3️⃣ |
| #4 - Rate Limiting | Medium | 2h | Medium | 1h | 4️⃣ |

**Total Estimated Effort**: 
- Implementation: 7-10 hours
- Testing: 4 hours
- **Total: 11-14 hours**

**Recommended Order**:
1. **Env Validation** (1-2h) + Tests (1h) - Quickest win, prevents runtime errors
2. **Word Count** (2-3h) + Tests (1h) - Fixes spec mismatch, affects UX
3. **Type Safety** (2-3h) + Tests (1h) - Improves code quality, prevents bugs
4. **Rate Limiting** (2h) + Tests (1h) - Security & cost control

---

## 🎯 SUCCESS CRITERIA

**Code Quality**:
- [ ] No `@ts-ignore` in production code (except documented exceptions)
- [ ] All env vars validated at startup
- [ ] Word count validation matches spec (150 words + 1200 chars)
- [ ] Rate limiting active on all AI endpoints

**Testing**:
- [ ] Unit tests for validators (>90% coverage)
- [ ] Unit tests for env validation
- [ ] Integration tests for rate limiting
- [ ] Integration tests for type safety
- [ ] E2E tests updated and passing
- [ ] All tests passing in CI

**Documentation**:
- [ ] API specs updated with new validation rules
- [ ] Changelog updated
- [ ] README updated with testing instructions

---

## 📝 IMPLEMENTATION NOTES

**Development Focus**:
- All changes are for development phase
- No production deployment concerns
- Focus on code quality and developer experience
- Generous rate limits for development workflow

**Testing Philosophy**:
- Write tests alongside implementation
- Aim for >80% coverage on new code
- E2E tests for critical paths
- Unit tests for utilities and validators

**Breaking Changes**:
- Word count validation will reject previously valid inputs
- Rate limiting may affect test scripts (update accordingly)
- Env validation will prevent server start if vars missing

**Migration Path**:
- Update `.env` files with all required variables
- Update test scripts to handle new validation errors
- Update frontend (when built) to show word/char counts
