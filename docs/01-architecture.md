# 01 - Architecture & System Design

## 1. Overview & Goals

- **Mission (USP):** `TweetBloom` is a "Mobile First, Fast, Simple" AI application. It is designed to actively **optimize** user-submitted `prompts`, rewriting them to be more effective and deliver the best possible results from AI tools.
- **Target Audience:** US-based users (ages 25-45) who are less experienced with `prompt engineering` and require assistance.
- **Core Constraints:**
  - **150-Word Limit:** Max for all prompts, notes, and AI responses.
  - **7-Response Limit:** Max responses per chat session.
  - **7-Note Limit:** Max notes for the "Notes -> Prompt" synthesis feature.
  - **3-Level Depth Limit:** Note organization tree is limited to 3 levels.
  - **Configurable:** All constraints (150, 7, 7, 3) are configurable via server-side `.env` files.

## 2. Core Architecture & Tech Stack

- **Architecture:** 3-Tier Monorepo (Client -> API -> Database).
- **Monorepo:** `pnpm` + `Turborepo`.
- **Frontend (`apps/web`):** `Next.js` (App Router).
- **UI:** `TailwindCSS`.
- **Backend (`apps/api`):** `Fastify`.
- **Database & Auth:** `Supabase` (PostgreSQL, Supabase Auth, RLS).
- **Schema Management:** `Supabase CLI` (SQL Migrations).
- **API Client (Web):** `supabase-js` (Auth) & `TanStack Query (v5)` (Server State).
- **Validation:** `Zod` (API inputs and types).
- **UI Library:** `shadcn/ui` (for fast, premium components).
- **Animations:** `Framer Motion` (for premium micro-animations).
- **State Management (Web):** `Zustand`.
- **Key Libraries:** `dnd-kit` (Drag & Drop for Notes/Chats), `react-markdown`, `lucide-react` (Icons).

## 3. Monorepo Module Breakdown

### `packages/` (Shared Code)

- **`packages/ui` (UI Components):** Shared, stateless React components.
- **`packages/types` (Shared Types):** The "contract" between `web` and `api`. Contains:
  - 1. **Zod Schemas** (The "API Contract" for validation).
  - 2. **`supabase-types.ts`** (The "DB Contract" - generated types).

### `apps/` (Applications)
    - `Database:` Securely connects via `supabase-js` Admin Client (using `SERVICE_ROLE_KEY`).
    - `Chat-BloomBuddy:` **(Internal Service)** The core logic service, configured via `.env` (e.g., Gemini). It is used for:
      - 1. **Prompt Optimization (Rewrite):** (Flow 1)
      - 2. **Response Evaluation (Prompt Chaining):** (Flow 2)
      - 3. **History Summarization (Continue Chat):** (Flow 3)
      - 4. **Chat-to-Note Summarization:** (Flow 4)
      - 5. **Notes-to-Prompt Synthesis:** (Flow 5)
    - `Chat-AITool:` **(External Service)** Handles API calls to user-selected AI Tools (Grok, ChatGPT, Gemini-Flash) to generate the final Response.
    - `Summarize:` Endpoints that expose the `Chat-BloomBuddy` summarization features (Flows 3, 4, 5).
    - `Data-API:` CRUD endpoints for `Chats`, `Notes`, `Folders`, and `Tags`.

### Other Folders

- **`supabase/migrations`**: (Root) Manages the SQL database schema. This is the "schema source of truth."

## 4. Core Logic Flow: MVP Bloom Buddy (Prompt Optimization)

This is the primary flow, matching **Flow 1** in `00-overview.md`.
**Endpoint:** `POST /api/chat`

1.  **Authenticate:** Server validates the Supabase JWT.
2.  **Receive & Persist (Immediate Save):**
    - Server receives `{ prompt: string, chatId?: string, aiTool?: string }`.
    - **If `chatId` is missing (New Chat):**
        - Create a new `Chat` record.
        - **Generate Title:** Use the first 50 characters of the `prompt` as the temporary `title`.
        - Save the new `Chat` to the DB.
    - **Save User Message:** Immediately save the user's `prompt` to the `messages` table (`role: 'user'`).
3.  **[API Call 1] Optimize Prompt (Internal `Bloom Buddy`):**
    - The backend calls `Bloom Buddy` to validate the prompt.
4.  **Decision (Blocking):**
    - **Case A (Prompt is "Bad"):** `is_good: false`.
      - **Save Suggestion:** The server saves `Bloom Buddy`'s rewritten prompt to the `messages` table (`role: 'assistant'`, `type: 'suggestion'`, `metadata: { is_optimization: true }`).
      - **Return:** `HTTP 200 OK` with `{ "new_prompt": "...", "chatId": "...", "messageId": "..." }`.
      - The client displays this suggestion in the history. The user can "Accept" (which sends the `new_prompt` as a new user message) or "Edit".
    - **Case B (Prompt is "Good"):** `is_good: true`.
      - The server proceeds to the next step.
5.  **[API Call 2] Get Response (User-Selected AI-Tool):**
    - **Determine AI-Tool:** (Same logic: Override > Chat > Default).
    - The backend calls the determined AI-Tool.
6.  **Respond & Save:**
    - The AI-Tool's response is received.
    - **Save Response:** The server saves the AI response to the `messages` table (`role: 'assistant'`, `type: 'response'`).
    - **Return:** `HTTP 200 OK` with `{ "response": "...", "chatId": "...", "messageId": "..." }`.
    - The flow **ENDS**.

## 5. Additional User Flows & Data Management

This section details the architecture for the other core flows defined in `00-overview.md`.

### Flow 2: "What Next?" (Prompt Chaining)

- **User Action:** Clicks "What Next?" button (appears after first response).
- **Endpoint:** `POST /api/chat/evaluate`
- **Logic:**
  1.  Server receives `{ "chatId": "...", "messageId": "..." }`.
  2.  `Bloom Buddy` is called to analyze the **entire chat history** to understand the full context and goal.
  3.  Server returns `HTTP 200 OK` with `{ "new_prompt": "..." }` (the suggested next step).
  4.  Client populates this `new_prompt` into the chat input for user review/edit.

### Flow 3: Handling the 7-Response Limit (Continue Chat)

- **User Action:** Clicks "Continue Chat" (which replaces the "What Next?" and "Submit" buttons when the limit is reached).
- **Endpoint:** `POST /api/summarize/chat-to-prompt`
- **Logic:** `Bloom Buddy` synthesizes the chat history into a `new_prompt`, which is returned to the client to start a new session.

### Flow 4: On-Demand Chat-to-Note Conversion

- **User Action:** Clicks "Save as Note".
- **Endpoint:** `POST /api/summarize/chat-to-note`
- **Logic:** `Bloom Buddy` summarizes the chat. The server saves this summary as a new `Note` in the database (at the root level, `parentId: null`) and returns the `Note` object (`HTTP 201 Created`). **The client then opens this note in an edit modal.**

### Flow 5: Notes-to-Prompt Synthesis

- **User Action:** Selects 2-7 notes and clicks "Combine".
- **Endpoint:** `POST /api/summarize/notes`
- **Logic:** `Bloom Buddy` synthesizes the content of the `noteIds` into a single `prompt`, which is returned (`HTTP 200 OK`) for the user to start a new chat.

### Flows 6-9: Data Management (Chats, Folders, Tags, Notes)

- **Chats (Flow 6 & History):**
  - `GET /api/chats`, `GET /api/chats/:id`, `PATCH /api/chats/:id`, `DELETE /api/chats/:id`
  - `Chat` table will have an optional `folderId` field.
  - Client (`apps/web`) will implement `dnd-kit` to assign `chat.folderId`.
- **Folders (Flow 6):**
  - `GET /api/folders`, `POST /api/folders`, `PATCH /api/folders/:id`, `DELETE /api/folders/:id`
  - **Delete Logic:** Deleting a folder sets `folderId = null` for all contained chats (moves them to root). It does **not** delete the chats.
- **Tags (Flow 7-8):**
  - `GET /api/tags`, `POST /api/tags`, `PATCH /api/tags/:id`, `DELETE /api/tags/:id`
  - `Tag` table will include `name` and `color` fields.
  - Requires many-to-many join tables: `chat_tags` and `note_tags`.
- **Notes (Flow 9):**
  - `GET /api/notes`, `POST /api/notes`, `PATCH /api/notes/:id`, `DELETE /api/notes/:id`
  - `Note` table has `parentId` field to create the tree.
  - API logic in `PATCH /api/notes/:id` must **enforce the 3-level depth limit** by checking the depth of the new `parentId` before allowing the update.

### Flow 10: Managing Default AI Tool (Settings)

- **Endpoints:** `GET /api/settings`, `PATCH /api/settings`.
- **Logic:**
  1. This setting (`default_ai_tool`) is stored in the dedicated `user_settings` table.
  2. **Critical Logic:** During Flow 1 (`POST /api/chat`), if the request does **not** contain an existing `chatId`, the server must fetch and use the `user_settings.default_ai_tool` value to select the AI backend (Grok, ChatGPT, or Gemini-Flash) for that new chat session.
  3. The `PATCH` logic must ensure the provided AI tool is one of the allowed, supported values (`GEMINI`, `CHATGPT`, or `GROK`).

## 6. Security Model

- **Authentication:** Handled by **Supabase Auth** (Google OAuth, Email OTP). `apps/web` manages the token; `apps/api` validates it.
- **Authorization (Database):** Strict **Row Level Security (RLS)** is enabled on all tables in Supabase. (e.g., `(auth.uid() = user_id)`). This is the primary data guard.
- **Authorization (API):**
  - All `apps/api` endpoints (except auth) require a valid Supabase JWT.
  - All API inputs are strictly validated using `Zod` schemas (from `packages/types`) to prevent injection and malformed data.
