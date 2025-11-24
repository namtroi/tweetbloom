# 💬 Phase 4: Core UI Implementation - Detailed Plan

**Status**: Part 1 Complete ✅ | Part 2 Pending ⏳ | Part 3 Pending ⏳

**Last Updated**: 2025-11-23

**Objective**: Build the core Chat Interface and Sidebar History management, implementing Flows 1, 2, 3, and 6.

**Dependencies**: Phase 3 must be complete (Authentication, Layout, Base Components). ✅

**Tech Stack**: Next.js 15 (App Router), TailwindCSS, shadcn/ui (Green theme), TanStack Query, Zustand, Framer Motion.

---

## 📋 Overview

Phase 4 is the heart of TweetBloom. This is where users interact with **Bloom Buddy** to optimize their prompts and get brilliant responses. We'll build:

1. **Chat Interface** - The main interaction area (Flows 1, 2, 3)
2. **Sidebar History** - Chat management with folders (Flow 6)

---

## 🎯 Part 1: Chat Interface Foundation ✅ COMPLETE

### 1.1 Chat Store Enhancement (Zustand)

**File**: `src/store/use-chat-store.ts`

- [x] **Extend Chat State** ✅
  - Add `currentChatId: string | null`
  - Add `messages: Message[]` array
  - Add `isLoading: boolean` for API calls
  - Add `error: string | null` for error handling
  - Add `selectedAiTool: 'GEMINI' | 'CHATGPT' | 'GROK' | null`
  - Add `aiTool` field to Message interface
  
- [x] **Add Actions** ✅
  - `setCurrentChat(chatId: string | null)`
  - `addMessage(message: Message)`
  - `updateMessage(messageId: string, updates: Partial<Message>)`
  - `clearMessages()`
  - `setLoading(isLoading: boolean)`
  - `setError(error: string | null)`
  - `setSelectedAiTool(tool: AiTool)`
  - `reset()` for new chat sessions

**Types needed** (from `packages/types`):
```typescript
type Message = {
  id: string;
  role: 'user' | 'assistant' | 'suggestion';
  content: string;
  createdAt: string;
}
```

---

### 1.2 Chat Input Component

**File**: `src/components/chat/chat-input.tsx`

- [x] **Build Chat Input UI** ✅
  - Create `<Textarea>` with auto-resize (max 4 lines)
  - Add word counter display (150 words max)
  - Add character counter (1200 chars max)
  - Show counter in **green** when valid, **red** when exceeding limit
  - Add AI Tool selector dropdown (only shown for new chats)
  - Add "Submit" button (disabled when over limit or empty)
  - Add "What Next?" button (shown after first response)
  - Add "Continue Chat" button (shown at 7-message limit)

- [x] **Implement Word/Character Counting Logic** ✅
  - Create utility function `countWords(text: string): number`
  - Create utility function `countChars(text: string): number`
  - Real-time validation as user types
  - Prevent submission if limits exceeded

- [x] **Handle Input States** ✅
  - Disabled state when chat has 7 responses
  - Loading state during API calls
  - Pre-filled state for "What Next?" suggestions
  - Pre-filled state for "Continue Chat" flow

**Styling Notes**:
- Use Green theme for primary actions
- Add subtle border animation on focus
- Use Framer Motion for smooth transitions

---

### 1.3 Message Components

**File**: `src/components/chat/message-item.tsx`

- [x] **Create Message Item Component** ✅
  - Support 3 message types: `user`, `assistant`, `suggestion`
  - User messages: Right-aligned, subtle background
  - Assistant messages: Left-aligned, AI avatar, green accent
  - Suggestion messages: Special styling with "Accept" and "Edit" buttons
  - Display correct AI name (Gemini/ChatGPT/Grok) based on `aiTool` field

- [x] **User Message** ✅
  - Simple text display
  - Timestamp (relative: "2 mins ago")
  - User avatar ("You" label)

- [x] **Assistant Message** ✅
  - AI avatar/icon (Sparkles)
  - Dynamic AI label ("Gemini"/"ChatGPT"/"Grok")
  - Response text display
  - Timestamp
  - Action buttons:
    - Copy to clipboard ✅
    - "Save as Note" (Flow 4 - Phase 5) ⏳

- [x] **Suggestion Message** ✅
  - Special border/background (green accent)
  - "✨ Bloom Buddy suggests:" header
  - Suggested prompt text
  - Two action buttons:
    - "Accept" - Send suggestion as-is
    - "Edit" - Load into input for editing
  - Show reasoning in metadata

**File**: `src/components/chat/message-list.tsx`

- [x] **Create Message List Container** ✅
  - Use `ScrollArea` from shadcn/ui
  - Auto-scroll to bottom on new messages
  - Loading skeleton for initial load
  - Empty state: "Start a new conversation with Bloom Buddy!"
  - Group messages by date (optional enhancement) ⏳

- [x] **Add Animations** ✅
  - Framer Motion: Slide-in animation for new messages
  - Smooth scroll behavior
  - Typing indicator during API calls

---

### 1.4 Chat API Integration (TanStack Query)

**File**: `src/lib/api/chat.ts`

- [x] **Create API Client Functions** ✅
  - `sendMessage(prompt: string, chatId?: string, aiTool?: AiTool)`
  - `evaluateChat(chatId: string, messageId: string)` (What Next?)
  - `continueChat(chatId: string)` (Flow 3)
  - `fetchChat(chatId: string)` for loading chat history
  - `fetchChats()` for sidebar (pending Part 2)

- [x] **Error Handling** ✅
  - Handle 400 (validation errors, 7-message limit)
  - Handle 429 (rate limiting)
  - Handle 401 (auth errors)
  - Handle 500 (server errors)
  - Display user-friendly error messages via toast

**File**: `src/hooks/use-chat-mutations.ts`

- [x] **Create TanStack Query Mutations** ✅
  - `useSendMessage()` mutation
    - On success: Add message to store + Set currentChatId
    - On error: Show toast notification
    - Optimistic updates for user messages
    - Handle both suggestion and success responses
  
  - `useEvaluateChat()` mutation
    - Pre-fill input with suggested prompt
    - Show "What Next?" loading state
    - Return new_prompt and reasoning

  - `useContinueChat()` mutation
    - Create new chat session
    - Pre-fill with synthesized prompt
    - Navigate to new chat
    - Reset store state

---

### 1.5 Chat Page Implementation

**File**: `src/app/(dashboard)/chat/[id]/page.tsx`

- [x] **Create Dynamic Chat Page** ✅
  - Get `chatId` from URL params
  - Fetch chat history on mount
  - Display `MessageList` component
  - Display `ChatInput` component
  - Handle "new chat" state (no chatId)
  - Load messages into store from API

**File**: `src/app/(dashboard)/chat/page.tsx`

- [x] **Create New Chat Page** ✅
  - Route: `/chat` (no ID)
  - Show empty message list with welcome message
  - Show chat input with AI tool selector
  - Auto-create chat on first message
  - Reset state on mount

- [x] **Implement Chat Logic (Flow 1)** ✅
  1. User types prompt
  2. Validate word/char count (150 words / 1200 chars)
  3. Send to API with selected AI tool
  4. **If suggestion returned**:
     - Display suggestion message with reasoning
     - Show "Accept" and "Edit" buttons
     - On Accept: Send suggestion to API with override flag
     - On Edit: Load into input for modification
  5. **If response returned**:
     - Display assistant message with correct AI name
     - Show "What Next?" button
     - Enable "Save as Note" (Phase 5) ⏳

- [x] **Implement "What Next?" Logic (Flow 2)** ✅
  - Show button after first response (responseCount > 0)
  - On click: Call `/api/chat/evaluate` with chatId and messageId
  - Pre-fill input with `new_prompt` from response
  - User can edit before sending
  - AI tool locked after first message
  - Debug logging for troubleshooting

- [x] **Implement "Continue Chat" Logic (Flow 3)** ✅ (Frontend)
  - When chat reaches 7 responses:
    - Hide "Submit" and "What Next?" buttons
    - Show "Continue Chat" button
  - On click:
    - Call `/api/summarize/chat-to-prompt` (Backend pending)
    - Create new chat session
    - Pre-fill input with synthesized prompt
    - Reset store for new chat
  - Note: Backend endpoint `/api/summarize/chat-to-prompt` not yet implemented

---

---

## ✅ Part 1 Completion Summary

**Completed**: 2025-11-23

### Features Delivered:
- ✅ Full chat interface with message display
- ✅ Flow 1: Bloom Buddy prompting with suggestions
- ✅ Flow 2: "What Next?" feature fully functional
- ✅ Flow 3: "Continue Chat" frontend ready
- ✅ AI provider selection (Gemini/ChatGPT/Grok)
- ✅ Input validation (150 words / 1200 chars)
- ✅ Response length enforcement (backend)
- ✅ Correct AI name attribution
- ✅ Optimistic UI updates
- ✅ Error handling with toast notifications

### Bug Fixes Applied:
1. ✅ AI name display (shows correct AI, not always "Bloom Buddy")
2. ✅ Response length compliance (150 words/1200 chars enforced)
3. ✅ AI provider mapping (ChatGPT works correctly)
4. ✅ "What Next?" API alignment (request/response format)
5. ✅ "What Next?" auth error (SUPABASE_URL fixed)
6. ✅ "What Next?" missing currentChatId (critical fix)

### Technical Debt:
- Backend endpoint `/api/summarize/chat-to-prompt` pending
- "Save as Note" feature pending (Phase 5)
- Hydration warnings (Next.js SSR - low priority)

---

## 🗂️ Part 2: Sidebar History & Folders ⏳ PENDING

### 2.1 Folder Management

**File**: `src/components/sidebar/folder-list.tsx`

- [ ] **Create Folder List Component**
  - Fetch folders via TanStack Query
  - Display folder tree structure
  - Show chat count per folder
  - Collapsible/expandable folders
  - "Create Folder" button

**File**: `src/components/sidebar/folder-item.tsx`

- [ ] **Create Folder Item Component**
  - Folder icon + name
  - Expand/collapse icon
  - Right-click context menu:
    - Rename
    - Delete
  - Drag-and-drop target for chats

**File**: `src/components/sidebar/create-folder-dialog.tsx`

- [ ] **Create Folder Dialog**
  - Use `Dialog` from shadcn/ui
  - Input for folder name
  - "Create" and "Cancel" buttons
  - API integration: `POST /api/folders`

**File**: `src/components/sidebar/rename-folder-dialog.tsx`

- [ ] **Rename Folder Dialog**
  - Pre-filled input with current name
  - API integration: `PATCH /api/folders/:id`

---

### 2.2 Chat History List

**File**: `src/components/sidebar/chat-list.tsx`

- [ ] **Create Chat List Component**
  - Fetch chats via TanStack Query
  - Group by folders
  - Show "Unorganized" section for chats without folders
  - Sort by `updated_at` (most recent first)
  - Loading skeleton
  - Empty state: "No chats yet. Start a new conversation!"

**File**: `src/components/sidebar/chat-item.tsx`

- [ ] **Create Chat Item Component**
  - Chat title (truncated if long)
  - AI tool icon (Gemini/ChatGPT/Grok)
  - Last updated time (relative)
  - Active state (highlight current chat)
  - Right-click context menu:
    - Rename
    - Move to folder
    - Delete
  - Draggable (for folder organization)

**File**: `src/components/sidebar/chat-item-menu.tsx`

- [ ] **Create Context Menu**
  - Use `DropdownMenu` from shadcn/ui
  - "Rename" option
  - "Move to Folder" submenu (list all folders)
  - "Delete" option with confirmation
  - API integrations:
    - `PATCH /api/chats/:id` (rename, move)
    - `DELETE /api/chats/:id`

---

### 2.3 Drag & Drop Implementation

**Library**: `@dnd-kit/core`, `@dnd-kit/sortable`

**File**: `src/components/sidebar/sidebar-dnd.tsx`

- [ ] **Install dnd-kit**
  ```bash
  pnpm add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
  ```

- [ ] **Setup DnD Context**
  - Wrap sidebar content with `DndContext`
  - Define drag sensors (mouse, touch, keyboard)
  - Handle `onDragEnd` event

- [ ] **Make Chat Items Draggable**
  - Wrap `ChatItem` with `useDraggable` hook
  - Add drag handle icon
  - Show drag overlay/preview

- [ ] **Make Folders Droppable**
  - Wrap `FolderItem` with `useDroppable` hook
  - Highlight on drag over
  - On drop: Call `PATCH /api/chats/:id` with new `folderId`

- [ ] **Handle Edge Cases**
  - Cannot drop chat into same folder
  - Show loading state during API call
  - Optimistic updates for smooth UX
  - Rollback on error

---

### 2.4 Sidebar Enhancement

**File**: `src/components/sidebar.tsx` (Update existing)

- [ ] **Integrate New Components**
  - Replace skeleton history with `ChatList`
  - Add `FolderList` above chat list
  - Add "New Chat" button at top (primary action)
  - Add search/filter input (optional enhancement)

- [ ] **Add Sections**
  - **Top**: "New Chat" button
  - **Middle**: Folders + Chat History
  - **Bottom**: User profile + Settings link

- [ ] **Mobile Optimization**
  - Use `Sheet` component for mobile sidebar
  - Swipe to open/close
  - Auto-close on chat selection

---

## 🎨 Part 3: UI Polish & Animations

### 3.1 Framer Motion Animations

**File**: `src/components/chat/message-item.tsx`

- [ ] **Message Entrance Animation**
  ```tsx
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
  ```

**File**: `src/components/chat/chat-input.tsx`

- [ ] **Button Hover Effects**
  - Scale on hover
  - Color transition
  - Ripple effect on click

**File**: `src/components/sidebar/chat-item.tsx`

- [ ] **Drag Animation**
  - Lift effect when dragging
  - Smooth transition to new position

---

### 3.2 Loading States

- [ ] **Chat Loading**
  - Typing indicator (3 animated dots)
  - Skeleton for message list
  - Disabled input during API calls

- [ ] **Sidebar Loading**
  - Skeleton for chat items
  - Skeleton for folders

---

### 3.3 Error Handling & Feedback

**File**: `src/components/ui/toast.tsx` (shadcn/ui)

- [ ] **Install Toast Component**
  ```bash
  pnpm dlx shadcn@latest add toast
  ```

- [ ] **Error Notifications**
  - Show toast on API errors
  - Show toast on rate limit (with retry time)
  - Show toast on validation errors

- [ ] **Success Notifications**
  - "Chat saved to folder"
  - "Folder created"
  - "Chat deleted"

---

## 🧪 Part 4: Testing & Validation

### 4.1 Manual Testing Checklist

- [ ] **Flow 1: Bloom Buddy Prompting**
  - [ ] Send a "bad" prompt → Receive suggestion
  - [ ] Accept suggestion → Receive response
  - [ ] Edit suggestion → Send modified prompt
  - [ ] Send a "good" prompt → Receive response directly
  - [ ] Verify word/char counter works
  - [ ] Verify AI tool selection (new chat only)

- [ ] **Flow 2: "What Next?"**
  - [ ] Send first message → See "What Next?" button
  - [ ] Click "What Next?" → Input pre-filled with suggestion
  - [ ] Edit and send → Conversation continues
  - [ ] Verify AI tool is locked

- [ ] **Flow 3: Continue Chat**
  - [ ] Send 7 messages in a chat
  - [ ] Verify "Continue Chat" button appears
  - [ ] Verify Submit/What Next buttons are hidden
  - [ ] Click "Continue Chat" → New chat created
  - [ ] Verify input pre-filled with synthesized prompt
  - [ ] Verify soft link to old chat

- [ ] **Flow 6: Folders & History**
  - [ ] Create a new folder
  - [ ] Rename a folder
  - [ ] Delete a folder → Chats move to root
  - [ ] Drag chat into folder → Verify update
  - [ ] Rename a chat
  - [ ] Delete a chat
  - [ ] Verify chat list updates in real-time

### 4.2 Edge Cases

- [ ] **Network Errors**
  - [ ] Disconnect internet → Send message → Show error
  - [ ] Slow connection → Show loading state

- [ ] **Rate Limiting**
  - [ ] Trigger rate limit → Show 429 error with retry time

- [ ] **Empty States**
  - [ ] No chats → Show empty state
  - [ ] No folders → Show empty state

- [ ] **Mobile Responsiveness**
  - [ ] Test on mobile viewport
  - [ ] Verify sidebar sheet works
  - [ ] Verify touch drag-and-drop

---

## 📦 Part 5: Additional Components Needed

### 5.1 shadcn/ui Components to Install

```bash
pnpm dlx shadcn@latest add toast
pnpm dlx shadcn@latest add context-menu
pnpm dlx shadcn@latest add select
pnpm dlx shadcn@latest add separator
pnpm dlx shadcn@latest add badge
```

### 5.2 Utility Functions

**File**: `src/lib/utils/text.ts`

- [x] `countWords(text: string): number` ✅
- [x] `countChars(text: string): number` ✅
- [x] `truncateText(text: string, maxLength: number): string` ✅
- [x] `formatRelativeTime(date: string): string` ("2 mins ago") ✅

**File**: `src/lib/utils/validation.ts`

- [x] `validatePrompt(text: string): { valid: boolean; error?: string }` ✅
- [x] `canSendMessage(chatId: string, messageCount: number): boolean` ✅

**File**: `src/lib/api/text-truncation.ts` (Backend)

- [x] `truncateToLimits(text, maxWords, maxChars)` ✅
- [x] `countWords(text)` ✅
- [x] `getTruncationStats()` ✅

---

## 🎯 Success Criteria

**Part 1 Status**: ✅ COMPLETE

1. ✅ Users can send prompts and receive responses (Flow 1)
2. ✅ Bloom Buddy suggestions work with Accept/Edit (Flow 1)
3. ✅ "What Next?" generates follow-up prompts (Flow 2)
4. ✅ "Continue Chat" frontend ready (Flow 3) - Backend pending
5. ⏳ Chat history displays in sidebar (Part 2)
6. ⏳ Folders can be created, renamed, deleted (Flow 6 - Part 2)
7. ⏳ Chats can be dragged into folders (Flow 6 - Part 2)
8. ✅ Animations are smooth and polished
9. ⏳ Mobile responsiveness (Part 3)
10. ✅ Error handling is comprehensive

---

## 📝 Implementation Order (Recommended)

**Week 1: Chat Interface Core**
1. Chat Store (1.1)
2. Chat Input Component (1.2)
3. Message Components (1.3)
4. Chat API Integration (1.4)
5. Basic Chat Page (1.5 - Flow 1 only)

**Week 2: Advanced Chat Features**
6. "What Next?" Implementation (1.5 - Flow 2)
7. "Continue Chat" Implementation (1.5 - Flow 3)
8. Animations & Polish (3.1, 3.2)
9. Error Handling (3.3)

**Week 3: Sidebar & Folders**
10. Folder Management (2.1)
11. Chat History List (2.2)
12. Drag & Drop (2.3)
13. Sidebar Integration (2.4)

**Week 4: Testing & Refinement**
14. Manual Testing (4.1)
15. Edge Case Handling (4.2)
16. Mobile Optimization
17. Final Polish

---

## 🔗 Dependencies on Other Phases

**Blocked by**:
- Phase 3 (Complete ✅)

**Blocks**:
- Phase 5 (Note Management - needs chat interface for "Save as Note")

**Related**:
- API Backend (Phase 2) must be running and stable

---

## 📚 Reference Documentation

- **Flows**: `docs/00-overview.md` (Flows 1, 2, 3, 6)
- **API Specs**: `docs/02-api-specs.md`
- **Brand Guidelines**: `docs/90-brand-guidelines.md`
- **Phase 3 Plan**: `docs/11-phase-3-detailed-plan.md`
- **Action Plan**: `docs/10-action-plan.md`

---

**Ready to Bloom! 🌱**
