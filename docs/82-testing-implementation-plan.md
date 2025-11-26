# 🧪 Testing Implementation Plan - DETAILED

This document outlines the detailed steps to implement a comprehensive testing strategy for TweetBloom, covering Backend, Frontend, and E2E automation.

**Goal**: Achieve high confidence in code stability through automated testing.

---

## 📊 Current State Analysis

### ✅ What We Have
1. **Unit Tests** (Working):
   - `apps/api/src/config/__tests__/env.test.ts` - Environment validation (9 tests ✅)
   - `packages/types/__tests__/validators.test.ts` - Word count validation (36 tests ✅)

2. **Integration Tests** (Working): ✅ **NEW!**
   - `apps/api/src/routes/__tests__/chat.test.ts` - Chat routes (13 tests ✅)
   - All tests passing!

3. **Manual E2E Script**:
   - `scripts/test-chat.ts` - Manual integration tests (requires running server)
   - **Status**: Can be deprecated in favor of automated tests

### ❌ What's Missing
1. **More Integration Tests**: Notes, Folders, Tags routes
2. **Frontend Tests**: No tests at all
3. **E2E Automation**: No automated browser tests

---

## ✅ Phase 1.2: Fix Mock Infrastructure - COMPLETE!

### What Was Fixed

1. **In-Memory Data Store** (`src/test/mocks/in-memory-store.ts`):
   - ✅ Created store to simulate Supabase database
   - ✅ Supports CRUD for: Users, Chats, Messages, Notes, Folders, Tags
   - ✅ Fixed nullable fields (`folder_id: null`)
   - ✅ Fixed UUID generation for test user

2. **Mock Supabase Client** (`src/test/mocks/supabase.ts`):
   - ✅ Simulates Supabase query builder API
   - ✅ Supports chain methods: `.insert().select().single()`
   - ✅ Returns correct format `{ data, error }`
   - ✅ Fixed insert+select pattern handling

3. **Mock AI Providers** (in `vitest.setup.ts`):
   - ✅ Mock Gemini Provider with Bloom Buddy detection
   - ✅ Returns JSON for evaluation requests
   - ✅ Returns text for regular prompts
   - ✅ Mock OpenAI and Grok providers

4. **Mock Auth Middleware**:
   - ✅ Properly checks authorization header
   - ✅ Returns 401 when no auth header
   - ✅ Injects test user when auth is valid

5. **Schema Fixes**:
   - ✅ Made `messageId` optional in `ChatEvaluateRequestSchema`

### Test Results

**Chat Routes**: 13/13 tests PASS ✅
- ✅ Create chat with good prompt
- ✅ Bloom Buddy suggestion for bad prompt
- ✅ Override AI check
- ✅ Word count validation (>150)
- ✅ Character limit validation (>1200)
- ✅ Use specified AI tool
- ✅ Return 401 without auth
- ✅ Include chat history
- ✅ Evaluate chat (What Next?)
- ✅ Invalid chatId returns 400
- ✅ GET list of chats
- ✅ GET single chat with messages
- ✅ Invalid UUID returns 400

---

## 📦 Phase 1.3: More Integration Tests (Next)

### Routes to Test

- [x] **Note Routes** (`notes.test.ts`) ✅
  - CRUD operations
  - POST /api/notes/summarize
  - POST /api/notes/combine

- [x] **Folder Routes** (`folders.test.ts`) ✅
  - CRUD operations

- [x] **Tag Routes** (`tags.test.ts`) ✅
  - CRUD operations
  - Color validation

- [x] **Continue Chat Route** (`continue.test.ts`) ✅
  - POST /api/chat/continue

### Estimated Time
- 3-4 hours

---

## 🖥️ Phase 2: Frontend Testing (Web)

### Setup
- [ ] Install dependencies:
  ```bash
  cd apps/web
  pnpm add -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/dom @testing-library/user-event @testing-library/jest-dom
  ```
- [ ] Create `apps/web/vitest.config.ts`
- [ ] Create `apps/web/src/test/setup.ts`

### Unit Tests
- [ ] **Hooks** (`src/hooks/__tests__/`)
  - `useChatController.test.ts`
  - `useChatMutations.test.ts`

- [ ] **Stores** (`src/store/__tests__/`)
  - `useNoteStore.test.ts`
  - `useTagStore.test.ts`

### Component Tests
- [ ] **Chat Components**
  - `ChatInput.test.tsx`
  - `MessageList.test.tsx`

- [ ] **Search**
  - `CommandPalette.test.tsx`

### Estimated Time
- 4-5 hours

---

## 🤖 Phase 3: E2E Automation

### Setup
- [ ] Install Playwright:
  ```bash
  pnpm create playwright
  ```

### Test Scenarios
- [ ] **Authentication** (`e2e/auth.spec.ts`)
  - Magic link login

- [ ] **Chat Flow** (`e2e/chat.spec.ts`)
  - Create chat
  - Send message
  - "What Next?" button
  - Continue chat

- [ ] **Knowledge Management** (`e2e/knowledge.spec.ts`)
  - Save chat as note
  - Organize notes
  - Tag notes
  - Search notes

### Estimated Time
- 5-6 hours

---

## 📝 Files Created/Modified

### Created
- `apps/api/src/test/mocks/in-memory-store.ts`
- `apps/api/src/test/mocks/supabase.ts`
- `apps/api/src/test/build-app.ts`
- `apps/api/src/test/vitest.setup.ts`
- `apps/api/vitest.config.ts`
- `apps/api/src/routes/__tests__/chat.test.ts`

### Modified
- `packages/types/index.ts` - Made messageId optional
- `apps/api/src/test/setup.ts` - Initial mock helpers

---

## 🎯 Next Steps

1. ✅ **Phase 1.2 Complete** - Mock infrastructure working
2. **Phase 1.3** - Write integration tests for Notes, Folders, Tags
3. **Phase 2** - Frontend testing setup
4. **Phase 3** - E2E automation with Playwright

---

**Last Updated**: 2024-11-25
**Status**: Phase 1 Complete ✅ - All Backend Integration Tests Passing (72/72). Ready for Phase 2 (Frontend).
