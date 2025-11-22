# 🚀 Action Plan: TweetBloom Implementation

This is the master checklist for building TweetBloom. It is based on the finalized documentation (`00-overview.md`, `01-architecture.md`, `02-api-specs.md`, `03-database-schema.md`).

## Phase 0: Environment & Setup (The Foundation)

- [ ] **Repo Initialization**
    - [ ] Initialize Monorepo with `pnpm` workspaces (`apps/web`, `apps/api`, `packages/ui`, `packages/types`).
    - [ ] Configure `Turborepo` for build pipeline.
    - [ ] Set up `ESLint` and `Prettier` for the root and all packages.
- [ ] **Supabase Setup**
    - [ ] Create a new Supabase project.
    - [ ] Install Supabase CLI locally.
    - [ ] Link local project to remote Supabase project.
- [ ] **Environment Variables**
    - [ ] Create `.env` files for `apps/api` and `apps/web`.
    - [ ] Define `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
    - [ ] Define AI Provider Keys (`GEMINI_API_KEY`, `OPENAI_API_KEY`, `GROK_API_KEY`).
    - [ ] Define App Constraints (`MAX_WORDS=150`, `MAX_RESPONSES=7`, `MAX_NOTES=7`, `MAX_DEPTH=3`).

## Phase 1: Database & Backend Foundation

- [ ] **Database Schema (SQL)**
    - [ ] Create migration: `001_initial_schema.sql` based on `docs/03-database-schema.md`.
    - [ ] Apply migration to local/remote DB (`supabase db push`).
    - [ ] Verify tables (`user_settings`, `folders`, `chats`, `messages`, `tags`, `notes`) and RLS policies.
- [ ] **Type Generation**
    - [ ] Run `supabase gen types typescript` to generate `packages/types/supabase-types.ts`.
    - [ ] Create Zod schemas in `packages/types` for all API requests/responses defined in `docs/02-api-specs.md`.
- [ ] **API Server Setup (`apps/api`)**
    - [ ] Initialize Fastify server.
    - [ ] Configure `fastify-cors` and `fastify-helmet`.
    - [ ] Implement Auth Middleware (validate Supabase JWT).
    - [ ] Set up `supabase-admin` client for internal logic.
    - [ ] Configure Swagger/OpenAPI documentation generation from Zod schemas.

## Phase 2: Core Logic Implementation (Bloom Buddy)

- [ ] **Flow 1: Prompt Optimization (The Core)**
    - [ ] Implement `POST /api/chat`.
    - [ ] Logic: Save User Prompt -> Call Bloom Buddy (Optimize) -> Save Suggestion (if bad) OR Call AI Tool (if good).
    - [ ] Implement AI Tool Selection Logic (Override > Chat > Default).
- [ ] **Flow 2: "What Next?" (Prompt Chaining)**
    - [ ] Implement `POST /api/chat/evaluate`.
    - [ ] Logic: Fetch entire chat history -> Call Bloom Buddy -> Return `new_prompt`.
- [ ] **Flow 3: Continue Chat (Summarization)**
    - [ ] Implement `POST /api/summarize/chat-to-prompt`.
    - [ ] Logic: Summarize history -> Return `new_prompt`.
- [ ] **Flow 4 & 5: Note Summarization**
    - [ ] Implement `POST /api/summarize/chat-to-note`.
    - [ ] Implement `POST /api/summarize/notes` (Combine Notes).

## Phase 3: Frontend Foundation (`apps/web`)

- [ ] **Project Setup**
    - [ ] Initialize Next.js (App Router).
    - [ ] Install `TailwindCSS` and `shadcn/ui`.
    - [ ] Install `Framer Motion` and `lucide-react`.
    - [ ] Configure `supabase-js` client (Auth).
    - [ ] Configure `TanStack Query` (React Query) and `Zustand`.
- [ ] **Authentication & Layout**
    - [ ] Build Login/Signup pages (Supabase Auth UI).
    - [ ] Create Main Layout (Sidebar + Chat Area).
    - [ ] Implement Protected Route wrapper.

## Phase 4: Core UI Implementation

- [ ] **Chat Interface (Flow 1, 2, 3)**
    - [ ] Build Chat Input component (with 150-word counter).
    - [ ] Build Message List component (User, Assistant, Suggestion).
    - [ ] Implement "What Next?" button logic (Flow 2).
    - [ ] Implement "Continue Chat" transition (Flow 3).
    - [ ] Add "Save as Note" button (Flow 4).
- [ ] **Sidebar & History (Flow 6)**
    - [ ] Fetch and display Chat History (`GET /api/chats`).
    - [ ] Implement Folders (Create, Rename, Delete).
    - [ ] Implement Drag & Drop (Chat -> Folder) using `dnd-kit`.

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
