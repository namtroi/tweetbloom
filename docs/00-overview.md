# 00 - Product Overview

## 1. Mission & Vision

Our mission is to build a "Mobile First, Fast, Simple" AI application. `TweetBloom` is designed to actively **optimize** the `prompt` (command) a user enters, suggesting a new, better, and more effective `prompt` to deliver the best possible results from AI.

## 2. Target Audience

This application is built for US-based users (ages 25-45) who are new to or less experienced with `prompt engineering` and require assistance to get the most out of AI tools.

## 3. Core User Flows

These are the primary journeys a user will take through the application.

### Flow 1: The "Bloom Buddy" Prompting Experience (Core Flow)

This is the app's primary "blocking" flow, which prioritizes output quality over speed.

1.  A user writes a new `prompt` (max 150 words).
2.  The server receives the request. **It immediately creates a new Chat Session (if one doesn't exist) and saves the user's `prompt` to the history.**
3.  `Bloom Buddy` (our internal, server-side Meta-AI) validates the `prompt`'s quality.
4.  **If the `prompt` is "Bad"** (e.g., too vague):
    - `Bloom Buddy` generates a better version.
    - The server **saves this suggestion** to the chat history (so the user can compare).
    - The app displays the suggestion. The user can "Accept" (send it) or "Edit" it.
5.  **If the `prompt` is "Good"**:
    - The server proceeds to call the selected `AI-Tool` (e.g., Grok, ChatGPT).
    - The app returns the final `response` (delivered by **Bloom Buddy**) and saves it to the chat history.
    
### Flow 2: "What Next?" - Bloom Buddy Suggests the Next Step

1.  **Trigger:** Immediately after the **first** AI response (and subsequent ones), a "What Next?" button appears next to the "Submit" button.
2.  **Action:** When clicked, `Bloom Buddy` analyzes the **entire chat history** (using prompt chaining) to understand the context and goal.
3.  **Suggestion:** The server generates a suggested `follow-up prompt` (what the user *should* ask next) and sends it back.
4.  **User Interaction:** The input field is pre-filled with this suggested `prompt`. The user can:
    - **Edit** the prompt if needed.
    - **Submit** it directly to continue the conversation.
5.  **Constraint:** The `AI-Tool` selected at the start of the chat (Flow 1) is **locked**. Users cannot switch AI models (e.g., from Gemini to ChatGPT) in the middle of a conversation. They can only choose the AI tool for the very first message.

### Flow 3: Handling the 7-Response Limit ("Continue Chat" Flow)

When a chat session reaches its 7-`response` limit, the **"What Next?" button AND the "Submit" button are replaced** by a single "Continue Chat" button. The user cannot send any more messages in this session.

1.  **Trigger:** The user clicks "Continue Chat" on a full chat session.
2.  **Action:** `Bloom Buddy` (server-side) synthesizes the **entire chat history** (up to 7 messages) into a single `new_prompt` (max 150 words).
3.  **Transition:** The server returns this `new_prompt` to the client.
4.  **New Session:** The client app receives this `new_prompt`, automatically routes the user to a **new chat session** (with a soft link "Continued from [Old Chat]"), and pre-fills the input field with it.
5.  **User Interaction:** The user can then review and edit this `new_prompt` before deciding to send it. This effectively starts a new Flow 1 cycle with rich context.

### Flow 4: Summarizing Chat into a Note (Chat → Note)

At any point during a conversation, the user can save the chat as a `note`.

1.  The user clicks "Save as Note".
2.  `Bloom Buddy` (server-side) summarizes the conversation (up to 7 messages) into a single 150-word summary.
3.  The server **automatically saves** this summary as a new `note` in the user's note tree.
4.  **Save & Edit:** The Client UI immediately opens the new `note` in an overlay/modal, allowing the user to review and edit the summary if needed.

### Flow 5: Synthesizing Notes into a Prompt (Notes → Prompt)

This flow allows users to synthesize old ideas into new ones.

1.  A user can select multiple `notes` (up to 7) from their collection.
2.  They then request to "combine" or "synthesize" them.
3.  The system (using `Bloom Buddy`) generates a new, coherent 150-word `prompt` based on the selected `notes`.
4.  **Action:** The app redirects to a **new chat session** and **pre-fills the input field** with this new prompt. The user can review or edit it before sending.

### Flow 6: Chat Management with Folders

Users can organize their chat sessions into folders.

1.  The UI (e.g., sidebar) provides an option to "Create Folder".
2.  **Manage:** Users can Rename or Delete folders.
    - **Delete Logic:** Deleting a folder **does not** delete the chats inside. The chats are moved back to the root list (unorganized).
3.  Users can `drag` a chat session from their history.
4.  Folders act as `drop targets`. Dropping a `chat` into a folder updates its `folderId` on the server.
5.  The UI displays chats grouped within their respective folders.

### Flow 7: Tagging for Chats and Notes

Users can use a shared `tag` system to manage both `chats` and `notes`.

1.  When viewing a `chat` or `note`, a user can "Add Tag".
2.  A pop-up shows existing `tags` and a search/create input.
3.  Users can select existing `tags` or type a new name to create and assign a new one.
4.  Users can remove a `tag` from a specific `chat` or `note`.
5.  The system allows filtering `chats` and `notes` based on these `tags`.

### Flow 8: Tag Management (CRUD)

Users have a central area (e.g., in Settings) to manage `tags`.

1.  Users see a list of all `tags` they have created.
2.  **Create:** Users can create a new `tag`, entering a name and selecting a display color.
3.  **Edit:** Users can change the name or color of an existing `tag`.
4.  **Delete:** Users can delete a `tag`, which removes it from all associated `chats` and `notes` (but does not delete the items themselves).

### Flow 9: Note Management (3-Level Tree)

Users can manage and organize `notes` in a tree-like structure (similar to Notion) with a maximum depth of 3 levels.

1.  **Create:** Users create a new `note` (or via Flow 4). New `notes` can be created at the root level or inside another `note` (setting its `parentId`).
2.  **Organize:** The `note` interface uses `dnd-kit` (drag-and-drop).
3.  Users can `drag` a `note` onto another `note` to make it a child.
4.  Users can `drag` `notes` to reorder them.
5.  **Depth Limit:** The UI and server will prevent creating/moving a `note` beyond 3 levels (e.g., L1 -> L2 -> L3). A `note` at L3 cannot have children.

### Flow 10: Managing Default AI Tool (Settings)

This flow allows the user to set their preferred default AI backend, which the server uses when starting a new chat session (Flow 1, without a chatId).

1. The user navigates to the Settings area (e.g., in a modal or dedicated page).
2. The client calls `GET /api/settings` to display the current selection (e.g., 'GEMINI').
3. The user selects a new AI tool (e.g., 'CHATGPT' or 'GROK') from a dropdown.
4. The client calls `PATCH /api/settings` to update the user's `default_ai_tool` preference on the server.
5. This setting is then referenced by the server during Flow 1 when a new chat is initiated.

## 4. Core Product Constraints

To maintain the "Mobile First, Fast, Simple" mission, the entire user experience is built around these hard limits:

- **150-Word Limit:** All user `prompts`, AI `responses`, and `notes` are limited to a max of 150 words.
- **7-Response Limit:** A single chat session can have a max of 7 AI `responses`.
- **7-Note Limit:** The "Combine Notes" feature can synthesize a max of 7 `notes` at a time.
- **3-Level Depth Limit:** The `note` tree structure is limited to 3 levels deep.
- **Setting:** These limits (150, 7, 7, 3) can be configured on the server via the `.env` file.
