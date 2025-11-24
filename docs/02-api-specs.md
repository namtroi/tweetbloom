# 02 - API Specifications

## 1. Overview

This document details the API endpoints for the backend server (`apps/api`).

- **Base URL:** `/api`
- **Authentication:** All endpoints, unless otherwise specified, are protected and require a valid Supabase JWT.
- **Validation:** All request bodies are strictly validated using `Zod` (from `packages/types`). Invalid requests will receive a `400 Bad Request`.

## 2. Authentication

All protected endpoints require an `Authorization` header to be sent with the request. The token is the JWT obtained from the `supabase-js` client upon user login.

**Header Format:**

`Authorization: Bearer <supabase_jwt_token>`

## 3. Common Error Responses

- **`400 Bad Request`**
  - Sent when request validation (Zod) fails (e.g., missing fields, prompt >150 words OR >1200 characters).

  ```json
  {
    "statusCode": 400,
    "code": "FST_ERR_VALIDATION",
    "error": "Bad Request",
    "message": "body/prompt: Content must be 150 words or less"
  }
  ```

- **`429 Too Many Requests`** ⭐ NEW
  - Sent when rate limit is exceeded for an endpoint.

  ```json
  {
    "error": "Rate limit exceeded",
    "message": "Too many requests. Try again in 45 seconds",
    "retryAfter": 45000,
    "limit": 50,
    "timeWindow": 60000
  }
  ```

- **`401 Unauthorized`**
  - Sent when the `Authorization` header is missing or the JWT is invalid/expired.

  ```json
  {
    "statusCode": 401,
    "error": "Unauthorized",
    "message": "Invalid JWT token"
  }
  ```

- **`403 Forbidden`**
  - Sent when the user is authenticated but does not have permission to access the resource (e.g., trying to delete another user's note).

  ```json
  {
    "statusCode": 403,
    "error": "Forbidden",
    "message": "You do not have permission to perform this action"
  }
  ```

- **`404 Not Found`**
  - Sent when a specific resource (e.g., `/api/notes/invalid-uuid`) is not found.

  ```json
  {
    "statusCode": 404,
    "error": "Not Found",
    "message": "Resource not found"
  }
  ```

- **`500 Internal Server Error`**
  - A generic server error. This can happen if a 3rd-party AI API is down or an unhandled exception occurs.

  ```json
  {
    "statusCode": 500,
    "error": "Internal Server Error",
    "message": "An unexpected error occurred"
  }
  ```

---

## 4. Module: Chat & Bloom Buddy

### `POST /api/chat`

(Flow 1) Handles a new user prompt. This is the core "blocking" `Bloom Buddy` endpoint.
**Logic Update:** The server **immediately saves** the user's prompt to the DB (creating a new chat if needed).

**Rate Limit**: 50 requests per minute ⭐ NEW

**Request Body:**

```json
{
  "prompt": "string", // Max 150 words AND 1200 characters
  "chatId": "string (uuid)", // Optional: to continue an existing chat
  "aiTool": "GEMINI" // Optional: Override default tool ('GEMINI'|'CHATGPT'|'GROK')
}
```

**Success Responses:**

- `200 OK` (Optimized - Prompt is "Bad")
  - Returned when `Bloom Buddy` determines the prompt is low-quality.
  - **Crucially:** The server **saves** this suggestion to the DB as a message (type: 'suggestion').

  ```json
  {
    "new_prompt": "This is the new, optimized prompt. Please review and send.",
    "chatId": "string (uuid)", // Always returned now (since chat is created)
    "messageId": "string (uuid)" // The ID of this suggestion message
  }
  ```

- `200 OK` (Response - Prompt is "Good")
  - Returned when the prompt is high-quality and the selected AI-Tool has responded.

  ```json
  {
    "response": "Here is the high-quality, 150-word response from the AI tool...",
    "chatId": "string (uuid)", // The ID of the session
    "messageId": "string (uuid)" // The ID of this new message
  }
  ```

**Error Responses:**

- `400 Bad Request`
  - In addition to validation errors, also returned if the chat session has reached its 7-message limit.
  ```json
  {
    "statusCode": 400,
    "error": "Bad Request",
    "message": "Chat session has reached the 7-message limit."
  }
  ```

### `POST /api/chat/evaluate`

(Flow 2) Handles the "What Next?" (Prompt Chaining) flow.
Tells `Bloom Buddy` to analyze the **entire chat history** (using prompt chaining) and generate a new follow-up prompt.

**Rate Limit**: 60 requests per minute ⭐ NEW

**Request Body:**

```json
{
  "chatId": "string (uuid)",
  "messageId": "string (uuid)" // The ID of the AI response to evaluate
}
```

**Success Response (`200 OK`):**

- Returns the new prompt for the user to review and send.

```json
{
  "new_prompt": "That's a good start, but can you please elaborate on the second point in more detail?"
}
```

---

## 5. Module: Chat History (CRUD)

**Purpose:** Manage chat sessions, including listing for the sidebar, renaming, and deleting.

### `GET /api/chats`

Fetches a list of all chat sessions for the authenticated user (summary only, no messages).

**Success Response (`200 OK`):**

```json
[
  {
    "id": "uuid-chat-1",
    "title": "Marketing Ideas",
    "folderId": "uuid-folder-1",
    "ai_tool": "GEMINI",
    "updated_at": "2023-10-27T10:00:00Z"
  },
  {
    "id": "uuid-chat-2",
    "title": "New Project",
    "folderId": null,
    "ai_tool": "CHATGPT",
    "updated_at": "2023-10-26T15:30:00Z"
  }
]
```

### `GET /api/chats/:id`

Fetches a single chat session with its full message history.

**Success Response (`200 OK`):**

```json
{
  "id": "uuid-chat-1",
  "title": "Marketing Ideas",
  "messages": [
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ]
}
```

### `PATCH /api/chats/:id`

Updates a chat session's metadata (e.g., renaming or moving to a folder).

**Request Body:**

```json
{
  "title": "string", // Optional
  "folderId": "string (uuid) | null", // Optional
  "tagIds": ["string (uuid)"] // Optional: Array of tag IDs to assign (replaces existing)
}
```

**Success Response (`200 OK`):**

- Returns the updated chat object.

### `DELETE /api/chats/:id`

Deletes a chat session and all its messages.

**Success Response (`204 No Content`)**

---

## 6. Module: Summarization

> **Note**: Implementation uses `/api/notes/summarize` and `/api/notes/combine` instead of `/api/summarize/*` paths.

### `POST /api/notes/summarize` ⭐ UPDATED PATH

(Flow 4) On-demand summarization. Tells `Bloom Buddy` to summarize a chat and save it directly as a new note.

**Rate Limit**: 30 requests per minute ⭐ NEW

**Request Body:**

```json
{
  "chatId": "string (uuid)"
}
```

**Success Response (`201 Created`):**

- Returns the newly created note object.

```json
{
  "noteId": "uuid-new-note",
  "content": "This is a 150-word summary of the entire chat conversation, saved as a note."
}
```

### `POST /api/summarize/chat-to-prompt`

(Flow 3) Handles the 7-response limit "Continue Chat" flow.
Tells `Bloom Buddy` to synthesize a chat history into a new prompt. The client receives this prompt and loads it into a new chat session.

**Request Body:**

```json
{
  "chatId": "string (uuid)"
}
```

**Success Response (`200 OK`):**

```json
{
  "new_prompt": "Based on our previous conversation about A and B, let's now explore C..."
}
```

### `POST /api/notes/combine` ⭐ UPDATED PATH

(Flow 5) Combines up to 7 selected notes into a single, cohesive summary note.

**Rate Limit**: 20 requests per minute ⭐ NEW

**Request Body:**

```json
{
  "noteIds": ["string (uuid)", "string (uuid)"] // Array of note IDs, max 7
}
```

**Success Response (`200 OK`):**

```json
{
  "noteId": "uuid-new-combined-note",
  "content": "Based on the provided notes, this is a new, synthesized 150-word note."
}
```

---

## 7. Module: Notes (CRUD)

(Flow 9) Manages the 3-level tree structure for notes.

### `GET /api/notes`

Fetches all notes for the authenticated user, typically returned as a flat array to be structured on the client.

**Success Response (`200 OK`):**

```json
[
  {
    "id": "uuid-1",
    "content": "This is my first note.",
    "parentId": null,
    "createdAt": "2023-10-27T10:00:00Z"
  },
  {
    "id": "uuid-2",
    "content": "This is a child note.",
    "parentId": "uuid-1",
    "createdAt": "2023-10-27T10:05:00Z"
  }
]
```

### `POST /api/notes`

Creates a new note. The server must validate the `parentId` to ensure it does not exceed the 3-level depth limit.

**Request Body:**

```json
{
  "content": "string", // Max 150 words
  "parentId": "string (uuid)" // Optional: for creating a child note
}
```

**Success Response (`201 Created`):**

- Returns the newly created note object.

### `PATCH /api/notes/:id`

Updates a note's content or position (parent). The server must validate the new `parentId` to enforce the 3-level depth limit and prevent cycles.

**Request Parameters:**

- `:id` (string, uuid): The ID of the note to update.

**Request Body:**

```json
{
  "content": "string", // Optional, Max 150 words
  "parentId": "string (uuid) | null", // Optional, `null` to move to root
  "tagIds": ["string (uuid)"] // Optional: Array of tag IDs to assign (replaces existing)
}
```

**Success Response (`200 OK`):**

- Returns the fully updated note object.

**Error Responses:**

- `400 Bad Request` (Depth Limit / Cycle)
  - Returned if the move violates the 3-level depth limit or creates a cycle.
  ```json
  {
    "statusCode": 400,
    "error": "Bad Request",
    "message": "Note depth limit exceeded: Cannot add child to a level 3 note."
  }
  ```

### `DELETE /api/notes/:id`

Deletes a note.

**Request Parameters:**

- `:id` (string, uuid): The ID of the note to delete.

**Success Response (`204 No Content`):**

- Returns an empty body on successful deletion.

---

## 8. Module: Folders & Tags (CRUD)

### `GET /api/folders`

(Flow 6) Fetches all folders for the authenticated user.

### `POST /api/folders`

(Flow 6) Creates a new folder.

### `PATCH /api/folders/:id`

(Flow 6) Updates a folder (e.g., rename).

### `DELETE /api/folders/:id`

(Flow 6) Deletes a folder.
**Logic:** Deleting a folder **does not** delete the chats inside. The chats are moved back to the root list (unorganized), i.e., their `folderId` is set to `null`.

---

### `GET /api/tags`

(Flow 7) Fetches all tags (name and color) for the authenticated user.

**Success Response (`200 OK`):**

```json
[
  { "id": "uuid-tag-1", "name": "Work", "color": "#FF0000" },
  { "id": "uuid-tag-2", "name": "Ideas", "color": "#0000FF" }
]
```

### `POST /api/tags`

(Flow 8) Creates a new tag with a name and color.

**Request Body:**

```json
{
  "name": "string",
  "color": "string" // e.g., hex code "#FF0000"
}
```

**Success Response (`201 Created`):**

- Returns the new tag object.

### `PATCH /api/tags/:id`

(Flow 8) Updates a tag's name or color.

**Request Body:**

```json
{
  "name": "string", // Optional
  "color": "string" // Optional
}
```

**Success Response (`200 OK`):**

- Returns the updated tag object.

### `DELETE /api/tags/:id`

(Flow 8) Deletes a tag.

**Success Response (`204 No Content`)**

---

## 9. Module: User Settings

Manages user-specific preferences, such as the default AI-Tool.

### `GET /api/settings`

Fetches the current settings for the authenticated user.

**Success Response (`200 OK`):**

```json
{
  "user_id": "uuid-user",
  "default_ai_tool": "GEMINI",
  "updated_at": "2023-10-27T10:00:00Z"
}
```

### `PATCH /api/settings`

Updates the settings for the authenticated user.

**Request Body:**

```json
{
  "default_ai_tool": "CHATGPT" // Optional, must be 'GEMINI', 'CHATGPT', or 'GROK'
}
```

**Success Response (`200 OK`):**

- Returns the fully updated settings object.

```json
{
  "user_id": "uuid-user",
  "default_ai_tool": "CHATGPT",
  "updated_at": "2023-10-27T10:05:00Z"
}
```

---

## 10. Module: Folders

### `GET /api/folders`

Fetches all folders for the authenticated user.

**Success Response (`200 OK`):**

```json
[
  {
    "id": "uuid-folder-1",
    "user_id": "uuid-user",
    "name": "Marketing",
    "created_at": "...",
    "updated_at": "..."
  }
]
```

### `POST /api/folders`

Creates a new folder.

**Request Body:**

```json
{
  "name": "string"
}
```

**Success Response (`201 Created`):**

- Returns the created folder object.

### `PATCH /api/folders/:id`

Updates a folder's name.

**Request Body:**

```json
{
  "name": "string"
}
```

**Success Response (`200 OK`):**

- Returns the updated folder object.

### `DELETE /api/folders/:id`

Deletes a folder. Chats inside are moved to root (handled by DB `ON DELETE SET NULL`).

**Success Response (`204 No Content`)**
