# 📋 Automation Tests Inventory

**Last Updated**: 2024-11-25  
**Total Test Files**: 9  
**Total Tests**: 58+

---

## ✅ Production Tests (Keep)

### 1. Backend - Unit Tests

#### `apps/api/src/config/__tests__/env.test.ts`
**Status**: ✅ Production  
**Tests**: 9  
**Purpose**: Environment variable validation

**Test Cases**:
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
pnpm test env.test.ts
```

---

#### `packages/types/__tests__/validators.test.ts`
**Status**: ✅ Production  
**Tests**: 36  
**Purpose**: Word count and content validation

**Test Cases**:
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
pnpm test validators.test.ts
```

---

### 2. Backend - Integration Tests

#### `apps/api/src/routes/__tests__/chat.test.ts`
**Status**: ✅ Production  
**Tests**: 13  
**Purpose**: Chat routes integration testing

**Test Suites**:

1. **POST /api/chat** (8 tests)
   - ✅ Create chat with good prompt → AI response
   - ✅ Bad prompt → Bloom Buddy suggestion
   - ✅ Override AI check
   - ✅ Word count validation (>150 words)
   - ✅ Character limit validation (>1200 chars)
   - ✅ Use specified AI tool (CHATGPT)
   - ✅ Return 401 without authorization
   - ✅ Include chat history in context

2. **POST /api/chat/evaluate** (2 tests)
   - ✅ Return next prompt suggestion
   - ✅ Return 400 for invalid chatId

3. **GET /api/chat** (1 test)
   - ✅ Return list of chats

4. **GET /api/chat/:id** (2 tests)
   - ✅ Return chat with messages
   - ✅ Return 400 for invalid UUID

**How to Run**:
```bash
cd apps/api
pnpm test chat.test.ts
```

---

## 🗑️ Debug/Temporary Tests (Can Delete)

These were created during development for debugging purposes:

### `apps/api/src/routes/__tests__/debug.test.ts`
**Status**: 🗑️ Debug  
**Tests**: 1  
**Purpose**: Simple debug test to check basic functionality  
**Action**: Can be deleted

---

### `apps/api/src/routes/__tests__/debug-fail.test.ts`
**Status**: 🗑️ Debug  
**Tests**: 2  
**Purpose**: Debug failing tests (AI tool selection, auth)  
**Action**: Can be deleted (functionality covered in chat.test.ts)

---

### `apps/api/src/routes/__tests__/debug-evaluate.test.ts`
**Status**: 🗑️ Debug  
**Tests**: 1  
**Purpose**: Debug evaluate endpoint with invalid UUID  
**Action**: Can be deleted (covered in chat.test.ts)

---

### `apps/api/src/routes/__tests__/debug-evaluate-success.test.ts`
**Status**: 🗑️ Debug  
**Tests**: 1  
**Purpose**: Debug evaluate endpoint success case  
**Action**: Can be deleted (covered in chat.test.ts)

---

### `apps/api/src/routes/__tests__/debug-evaluate-manual.test.ts`
**Status**: 🗑️ Debug  
**Tests**: 1  
**Purpose**: Test evaluate with manually created data  
**Action**: Can be deleted

---

### `apps/api/src/routes/__tests__/isolated-evaluate.test.ts`
**Status**: 🗑️ Debug  
**Tests**: 1  
**Purpose**: Isolated test with full logging  
**Action**: Can be deleted (covered in chat.test.ts)

---

## 📊 Summary

| Category | Files | Tests | Status |
|----------|-------|-------|--------|
| **Production Tests** | 3 | 58 | ✅ Keep |
| **Debug Tests** | 6 | 7 | 🗑️ Delete |
| **Total** | 9 | 65 | - |

---

## 🎯 Recommended Actions

### 1. Clean Up (Immediate)
Delete debug test files:
```bash
cd apps/api/src/routes/__tests__
rm debug.test.ts
rm debug-fail.test.ts
rm debug-evaluate.test.ts
rm debug-evaluate-success.test.ts
rm debug-evaluate-manual.test.ts
rm isolated-evaluate.test.ts
```

### 2. Run All Production Tests
```bash
# From root
pnpm test

# Or individually
cd apps/api && pnpm test
cd packages/types && pnpm test
```

### 3. Next Steps
- Add integration tests for Notes routes
- Add integration tests for Folders routes
- Add integration tests for Tags routes
- Setup frontend testing
- Setup E2E testing with Playwright

---

## 📝 Test Commands Reference

```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test <filename>

# Run tests in watch mode
pnpm test --watch

# Run tests with coverage
pnpm test:coverage

# Run tests with UI
pnpm test:ui
```

---

**Note**: All production tests are passing ✅
