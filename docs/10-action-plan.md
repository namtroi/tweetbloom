# 🚀 Action Plan: TweetBloom Implementation

This is the master checklist for building TweetBloom. It is based on the finalized documentation (`00-overview.md`, `01-architecture.md`, `02-api-specs.md`, `03-database-schema.md`).

## Phase 0: Environment & Setup (The Foundation)

- [x] **Repo Initialization**
    - [x] Initialize Monorepo with `pnpm` workspaces (`apps/web`, `apps/api`, `packages/ui`, `packages/types`).
    - [x] Configure `Turborepo` for build pipeline.
    - [x] Set up `ESLint` and `Prettier` for the root and all packages.
- [x] **Supabase Setup**
    - [x] Create a new Supabase project.
    - [x] Install Supabase CLI locally.
    - [x] Link local project to remote Supabase project.
- [x] **Environment Variables**
    - [x] Create `.env` files for `apps/api` and `apps/web`.
    - [x] Define `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
    - [x] Define AI Provider Keys (`GEMINI_API_KEY`, `OPENAI_API_KEY`, `GROK_API_KEY`).
    - [x] Define App Constraints (`MAX_WORDS=150`, `MAX_RESPONSES=7`, `MAX_NOTES=7`, `MAX_DEPTH=3`).

## Phase 1: Database & Backend Foundation

- [x] **Database Schema (SQL)**
    - [x] Create migration: `001_initial_schema.sql` based on `docs/03-database-schema.md`.
    - [x] Apply migration to local/remote DB (`supabase db push`).
    - [x] Verify tables (`user_settings`, `folders`, `chats`, `messages`, `tags`, `notes`) and RLS policies.
- [x] **Type Generation**
    - [x] Run `supabase gen types typescript` to generate `packages/types/supabase-types.ts`.
    - [x] Create Zod schemas in `packages/types` for all API requests/responses defined in `docs/02-api-specs.md`.
- [x] **API Server Setup (`apps/api`)**
    - [x] Initialize Fastify server.
    - [x] Configure `fastify-cors` and `fastify-helmet`.
    - [x] Implement Auth Middleware (validate Supabase JWT).
    - [x] Set up `supabase-admin` client for internal logic.
    - [ ] Configure Swagger/OpenAPI documentation generation from Zod schemas.

## Phase 2: Core Logic Implementation (Bloom Buddy)

- [x] **Flow 1: Prompt Optimization (The Core)**
    - [x] Implement `POST /api/chat`.
    - [x] Logic: Save User Prompt -> Call Bloom Buddy (Optimize) -> Save Suggestion (if bad) OR Call AI Tool (if good).
    - [x] Implement AI Tool Selection Logic (Override > Chat > Default).
- [x] **Flow 2: "What Next?" (Prompt Chaining)**
    - [x] Implement `POST /api/chat/evaluate`.
    - [x] Logic: Fetch entire chat history -> Call Bloom Buddy -> Return `new_prompt`.
- [x] **Flow 3: Continue Chat (Summarization)**
    - [x] Implement `POST /api/summarize/chat-to-prompt`.
    - [x] Logic: Summarize history -> Return `new_prompt`.
- [x] **Flow 4 & 5: Note Summarization**
    - [x] Implement `POST /api/summarize/chat-to-note`.
    - [x] Implement `POST /api/summarize/notes` (Combine Notes).

## Phase 3: Frontend Foundation (`apps/web`)
> **Detailed Plan**: See `docs/11-phase-3-detailed-plan.md`

- [x] **Project Setup**
    - [x] Initialize Next.js (App Router).
    - [x] Install `TailwindCSS` and `shadcn/ui` (Theme: **Green**).
    - [x] Install `Framer Motion` and `lucide-react`.
    - [x] Configure `supabase-js` client (Auth with `@supabase/ssr`).
    - [x] Configure `TanStack Query` (React Query) and `Zustand`.
- [x] **Authentication & Layout**
    - [x] Build Login page with **Magic Link** (OTP via Email - no password required).
    - [x] Create Auth Callback route for Magic Link verification.
    - [x] Create Main Layout (Sidebar + Chat Area).
    - [x] Implement Protected Route wrapper (Middleware).

## Phase 4: Core UI Implementation ✅ COMPLETE

- [x] **Chat Interface (Flow 1, 2, 3)**
    - [x] Build Chat Input component (with 150-word counter).
    - [x] Build Message List component (User, Assistant, Suggestion).
    - [x] Implement "What Next?" button logic (Flow 2).
    - [x] Implement "Continue Chat" transition (Flow 3).
    - [x] Add "Save as Note" button (Flow 4) - Deferred to Phase 5.
- [x] **Sidebar & History (Flow 6)**
    - [x] Fetch and display Chat History (`GET /api/chats`).
    - [x] Implement Folders (Create, Rename, Delete).
    - [x] Implement Drag & Drop (Chat -> Folder) using `dnd-kit`.
- [x] **Additional Improvements**
    - [x] Added chat history context to AI providers (Gemini, OpenAI, Grok).
    - [x] Fixed AI name display bug when loading chat history.
    - [x] Fixed CORS issue blocking PATCH requests.
    - [x] Implemented localStorage for Continue Chat prompt (clean URLs).

## Phase 5: Advanced Features

- [ ] **Note Management (Flow 9)**
    - [ ] Build Note Tree UI (max depth 3).
    - [ ] Implement Drag & Drop for Notes.
    - [ ] Implement Note Editor Modal.
    - [ ] Implement "Combine Notes" selection UI (Flow 5).
- [ ] **Tagging System (Flow 7, 8)**
    - [ ] Build Tag Management Settings (Create, Edit, Delete, Color Picker).
    - [ ] Add Tag Selector to Chat and Note interfaces.
- [ ] **User Settings (Flow 10)**
    - [ ] Build Settings Modal.
    - [ ] Implement Default AI Tool selection.

## Phase 6: Polish & Verification

- [ ] **Testing**
    - [ ] Write Unit Tests for critical backend logic (Limits, AI Selection).
    - [ ] Write E2E Tests for critical flows (Flow 1, Flow 9).
- [ ] **UI Polish**
    - [ ] Add Micro-animations (Framer Motion) for message appearance, button hovers.
    - [ ] Ensure Mobile Responsiveness (Hamburger menu, touch targets).
    - [ ] Verify Dark Mode support.
