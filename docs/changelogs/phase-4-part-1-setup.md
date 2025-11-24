# Phase 4 - Part 1: Chat Interface Setup Guide

## Prerequisites

Before running the chat interface, ensure you have:

1. ✅ Completed Phase 3 (Authentication & Layout)
2. ✅ Backend API running at `http://localhost:3001`
3. ✅ Supabase project configured
4. ✅ All dependencies installed (`pnpm install`)

---

## Environment Variables

Add the following to your `apps/web/.env` file:

```env
# Supabase (already configured in Phase 3)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# API URL (NEW - required for Phase 4)
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

## Running the Application

### 1. Start the Backend API

```bash
# In the root directory
cd apps/api
pnpm dev
```

The API should be running at `http://localhost:3001`

### 2. Start the Web App

```bash
# In the root directory
cd apps/web
pnpm dev
```

The web app should be running at `http://localhost:3000`

### 3. Access the Chat Interface

1. Navigate to `http://localhost:3000`
2. Log in with your email (Magic Link)
3. Click "New Chat" or navigate to `/chat`

---

## Testing the Chat Interface

### Flow 1: Bloom Buddy Prompting

1. **Test Bad Prompt**:
   - Type: "write an email"
   - Expected: Bloom Buddy suggests a better prompt
   - Actions: Accept or Edit the suggestion

2. **Test Good Prompt**:
   - Type: "Write a professional email to my team asking for their availability for a meeting next Tuesday at 2 PM. Keep it friendly and concise."
   - Expected: Direct response from AI

3. **Test Validation**:
   - Type a very long prompt (>150 words or >1200 characters)
   - Expected: Red counter and error message

### Flow 2: "What Next?"

1. Send a message and get a response
2. Click "What Next?" button
3. Expected: Input pre-filled with suggested follow-up
4. Edit if needed and send

### Flow 3: Continue Chat

1. Send 7 messages in a chat (user + assistant pairs)
2. Expected: "Continue Chat" button appears
3. Click "Continue Chat"
4. Expected: New chat created with synthesized prompt

---

## Troubleshooting

### Issue: "Cannot get auth token on server side"
**Solution**: Make sure you're logged in. The chat interface requires authentication.

### Issue: "No active session. Please log in."
**Solution**: Your session expired. Log out and log in again.

### Issue: API errors (500, 404, etc.)
**Solution**: 
- Check if backend API is running at `http://localhost:3001`
- Check API logs for errors
- Verify database migrations are applied

### Issue: TypeScript errors in IDE
**Solution**: 
- Run `pnpm build` to rebuild types
- Restart TypeScript server in your IDE
- Check that `@tweetbloom/types` package is properly linked

### Issue: Components not found
**Solution**:
- Run `pnpm install` in `apps/web`
- Check that all shadcn/ui components are installed
- Verify import paths are correct

---

## Features Implemented

### ✅ Chat Input
- Word counter (150 max)
- Character counter (1200 max)
- AI tool selector (new chats only)
- "What Next?" button
- "Continue Chat" button
- Real-time validation

### ✅ Message Display
- User messages (right-aligned)
- Assistant messages (left-aligned with Bloom Buddy avatar)
- Suggestion messages (with Accept/Edit buttons)
- Animations (Framer Motion)
- Copy to clipboard
- Relative timestamps

### ✅ Chat Pages
- New chat page (`/chat`)
- Existing chat page (`/chat/[id]`)
- Auto-scroll to bottom
- Loading states
- Empty states
- Error handling

---

## Next Steps

After verifying Part 1 works correctly:

1. Test all three flows thoroughly
2. Check mobile responsiveness
3. Verify error handling
4. Proceed to **Part 2: Sidebar History & Folders**

---

## File Structure

```
apps/web/src/
├── app/
│   └── (dashboard)/
│       └── chat/
│           ├── page.tsx          # New chat
│           └── [id]/
│               └── page.tsx      # Existing chat
├── components/
│   ├── chat/
│   │   ├── chat-input.tsx       # Input component
│   │   ├── message-item.tsx     # Message display
│   │   └── message-list.tsx     # Message container
│   └── ui/
│       ├── select.tsx           # AI tool selector
│       ├── textarea.tsx         # Chat input
│       └── skeleton.tsx         # Loading states
├── hooks/
│   └── use-chat-mutations.ts    # TanStack Query hooks
├── lib/
│   ├── api/
│   │   └── chat.ts              # API client
│   └── utils/
│       ├── text.ts              # Text utilities
│       └── validation.ts        # Validation
└── store/
    └── use-chat-store.ts        # Zustand store
```

---

## Support

If you encounter any issues:

1. Check the console for errors
2. Check the network tab for API calls
3. Review the implementation summary in `docs/changelogs/phase-4-part-1-summary.md`
4. Refer to the detailed plan in `docs/12-phase-4-detailed-plan.md`

---

**Happy Chatting with Bloom Buddy! 🌱✨**
