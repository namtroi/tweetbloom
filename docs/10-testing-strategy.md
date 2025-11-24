# Testing Strategy & Status

**Last Updated**: 2025-11-23  
**Project**: TweetBloom API  
**Phase**: Development (Post Phase 2 Technical Debt Fixes)

---

## 📊 TESTING OVERVIEW

### Current Test Coverage

| Category | Status | Tests | Coverage | Notes |
|----------|--------|-------|----------|-------|
| **Unit Tests** | ✅ Partial | 45 | ~60% | env.test.ts, validators.test.ts |
| **Integration Tests** | ❌ Missing | 0 | 0% | Planned |
| **E2E Tests** | ✅ Manual | 1 script | N/A | test-chat.ts (manual) |
| **Rate Limit Tests** | ❌ Missing | 0 | 0% | Planned |

**Overall Status**: 🟡 **In Progress** - Core unit tests complete, integration/E2E automation needed

---

## ✅ COMPLETED TESTS

### 1. Environment Validation Tests
**File**: `apps/api/src/config/__tests__/env.test.ts`  
**Status**: ✅ **Complete** (9 tests passing)

**Coverage**:
- ✅ Valid environment configuration
- ✅ Missing required variables (SUPABASE_URL, GEMINI_API_KEY)
- ✅ Invalid URL format
- ✅ Default values application
- ✅ Optional variables (OPENAI_API_KEY, GROK_API_KEY)
- ✅ PORT parsing as number
- ✅ NODE_ENV enum validation

**How to Run**:
```bash
cd apps/api
pnpm test
```

**Expected Result**: All 9 tests pass

---

### 2. Word Count Validator Tests
**File**: `packages/types/__tests__/validators.test.ts`  
**Status**: ✅ **Complete** (36 tests passing)

**Coverage**:
- ✅ Word counting (9 tests)
  - Simple words, multiple spaces, newlines/tabs
  - Empty strings, punctuation, unicode
  - Very long text
- ✅ Content validator (9 tests)
  - Valid content, word/char limits
  - Empty content, over limits
  - Special characters, newlines
- ✅ Custom validator factory (4 tests)
- ✅ Frontend validation helper (6 tests)
- ✅ Edge cases (8 tests)

**How to Run**:
```bash
cd packages/types
pnpm test
```

**Expected Result**: All 36 tests pass

---

### 3. Manual E2E Tests
**File**: `scripts/test-chat.ts`  
**Status**: ✅ **Available** (Manual execution required)

**Test Cases**:
1. ✅ Bad Prompt (Bloom Buddy suggestion)
2. ✅ Good Prompt (AI response)
3. ✅ Override AI Check
4. ✅ Evaluate Chat (next prompt suggestion)
5. ✅ Summarize Chat to Note
6. ✅ Combine Notes
7. ✅ Word Count Validation - Too Many Words (151 words)
8. ✅ Word Count Validation - Too Many Characters (1201 chars)

**How to Run**:
```bash
# 1. Start server
cd apps/api
pnpm dev

# 2. In another terminal, run tests
cd ../..
pnpm test:chat
```

**Expected Result**: All tests should complete without errors

**Current Status**: ⚠️ Server needs to be running manually

---

## ❌ MISSING TESTS (To Be Implemented)

### 1. Integration Tests - Route Handlers
**Priority**: 🔴 **High**  
**Estimated Effort**: 3-4 hours

**Planned Tests**:
- [ ] `apps/api/src/routes/__tests__/chat.test.ts`
  - POST /api/chat - success flow
  - POST /api/chat - validation errors
  - POST /api/chat - Bloom Buddy suggestion
  - POST /api/chat - override AI check
  - POST /api/chat/evaluate - success flow
  
- [ ] `apps/api/src/routes/__tests__/notes.test.ts`
  - POST /api/notes/summarize - success flow
  - POST /api/notes/summarize - empty chat
  - POST /api/notes/combine - success flow
  - POST /api/notes/combine - insufficient notes

**Dependencies**: 
- Need to mock Supabase client
- Need to mock AI providers
- Need to mock BloomBuddyService

**Approach**:
```typescript
// Example structure
describe('POST /api/chat', () => {
  it('should create chat and return AI response', async () => {
    // Mock Supabase
    // Mock AI provider
    // Call endpoint
    // Assert response
  });
});
```

---

### 2. Integration Tests - Rate Limiting
**Priority**: 🟡 **Medium**  
**Estimated Effort**: 2 hours

**Planned Tests**:
- [ ] `apps/api/src/__tests__/rate-limit.test.ts`
  - Requests under limit should pass
  - Requests over limit should return 429
  - Rate limit headers present
  - Per-route limits work correctly
  - Global limit works as fallback

**Test Approach**:
```typescript
describe('Rate Limiting', () => {
  it('should allow requests under limit', async () => {
    for (let i = 0; i < 50; i++) {
      const response = await app.inject({
        method: 'POST',
        url: '/api/chat',
        // ...
      });
      expect(response.statusCode).toBe(200);
    }
  });

  it('should block 51st request', async () => {
    // Make 50 requests
    // 51st should return 429
  });
});
```

---

### 3. Integration Tests - Type Safety
**Priority**: 🟡 **Medium**  
**Estimated Effort**: 2 hours

**Planned Tests**:
- [ ] Database row validation
  - ChatRowSchema validates correctly
  - MessageRowSchema validates correctly
  - NoteRowSchema validates correctly
  - Invalid data throws ZodError

**Test Approach**:
```typescript
describe('Database Row Schemas', () => {
  it('should validate valid chat row', () => {
    const validChat = {
      id: uuid(),
      user_id: uuid(),
      title: 'Test',
      ai_tool: 'GEMINI',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    expect(() => ChatRowSchema.parse(validChat)).not.toThrow();
  });

  it('should reject invalid chat row', () => {
    const invalidChat = { id: 'not-a-uuid' };
    expect(() => ChatRowSchema.parse(invalidChat)).toThrow(ZodError);
  });
});
```

---

### 4. E2E Tests - Automated
**Priority**: 🟢 **Low** (Manual tests work for now)  
**Estimated Effort**: 4-5 hours

**Planned Improvements**:
- [ ] Convert `test-chat.ts` to automated test suite
- [ ] Use Vitest or Jest for E2E
- [ ] Auto-start/stop server
- [ ] Cleanup test data after each run
- [ ] CI/CD integration

**Framework Options**:
- Vitest (already installed)
- Supertest (for HTTP testing)
- Test containers (for isolated DB)

---

## 📋 TESTING CHECKLIST

### Before Merging to Main
- [x] Unit tests for env validation
- [x] Unit tests for word count validation
- [ ] Integration tests for route handlers
- [ ] Integration tests for rate limiting
- [ ] Integration tests for type safety
- [ ] E2E tests automated
- [ ] All tests passing in CI/CD
- [ ] Test coverage > 80%

### Current Blockers
1. ❌ **No test infrastructure for integration tests**
   - Need to setup mocking for Supabase
   - Need to setup mocking for AI providers
   
2. ❌ **No automated E2E tests**
   - Manual script works but not automated
   - Need to auto-start server for tests

3. ❌ **No CI/CD pipeline**
   - Tests not running automatically
   - No coverage reports

---

## 🎯 RECOMMENDED NEXT STEPS

### Phase 1: Integration Tests (Priority)
**Time**: 5-6 hours

1. **Setup Test Infrastructure** (1-2h)
   - Install testing utilities (supertest, etc.)
   - Create mock factories for Supabase
   - Create mock factories for AI providers

2. **Write Route Handler Tests** (3-4h)
   - Chat routes
   - Notes routes
   - Rate limiting tests

### Phase 2: E2E Automation (Optional)
**Time**: 4-5 hours

1. **Convert Manual Tests** (2-3h)
   - Automate test-chat.ts
   - Add cleanup logic

2. **CI/CD Integration** (2h)
   - GitHub Actions workflow
   - Coverage reporting

### Phase 3: Documentation (Low Priority)
**Time**: 1-2 hours

1. **Update API Specs** (1h)
   - Document rate limits
   - Document validation rules

2. **Update README** (1h)
   - Testing instructions
   - Coverage badges

---

## 📚 TESTING RESOURCES

### Documentation
- [Vitest Docs](https://vitest.dev/)
- [Fastify Testing](https://www.fastify.io/docs/latest/Guides/Testing/)
- [Zod Testing](https://zod.dev/)

### Tools Installed
- ✅ Vitest (unit/integration testing)
- ✅ @vitest/ui (test UI)
- ❌ Supertest (HTTP testing) - **Not installed yet**
- ❌ @faker-js/faker (test data generation) - **Not installed yet**

### Useful Commands
```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test --watch

# Run tests with UI
pnpm test:ui

# Run tests with coverage
pnpm test:coverage

# Run specific test file
pnpm test env.test.ts
```

---

## 📈 PROGRESS TRACKING

| Week | Goal | Status |
|------|------|--------|
| Week 1 | Unit tests (env, validators) | ✅ Complete |
| Week 2 | Integration tests (routes) | ⏳ Planned |
| Week 3 | Rate limit tests | ⏳ Planned |
| Week 4 | E2E automation | ⏳ Planned |

**Last Updated**: 2025-11-23  
**Next Review**: After integration tests complete
