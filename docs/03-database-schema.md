# 03 - Database Schema

This document defines the SQL schema for the Supabase PostgreSQL database.

## 1. Overview

- **Schema:** `public`
- **Auth:** Integrated with Supabase Auth (`auth.users`).
- **Security:** Row Level Security (RLS) is **ENABLED** on all tables.
- **Keys:** UUIDs are used for all primary keys.

## 2. Tables

### 2.1. `user_settings`

Stores user-specific preferences.

```sql
create table public.user_settings (
  user_id uuid not null references auth.users(id) on delete cascade primary key,
  default_ai_tool text not null default 'GEMINI' check (default_ai_tool in ('GEMINI', 'CHATGPT', 'GROK')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS
alter table public.user_settings enable row level security;
create policy "Users can view own settings" on public.user_settings for select using (auth.uid() = user_id);
create policy "Users can update own settings" on public.user_settings for update using (auth.uid() = user_id);
create policy "Users can insert own settings" on public.user_settings for insert with check (auth.uid() = user_id);
```

### 2.2. `folders`

Organizes chat sessions.

```sql
create table public.folders (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS
alter table public.folders enable row level security;
create policy "Users can CRUD own folders" on public.folders for all using (auth.uid() = user_id);
```

### 2.3. `chats`

Represents a chat session.

```sql
create table public.chats (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  folder_id uuid references public.folders(id) on delete set null, -- Move to root on delete
  title text not null,
  ai_tool text not null check (ai_tool in ('GEMINI', 'CHATGPT', 'GROK')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS
alter table public.chats enable row level security;
create policy "Users can CRUD own chats" on public.chats for all using (auth.uid() = user_id);
```

### 2.4. `messages`

Individual messages within a chat.

```sql
create table public.messages (
  id uuid not null default gen_random_uuid() primary key,
  chat_id uuid not null references public.chats(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null, -- Max 150 words enforced by API/App
  type text not null default 'text' check (type in ('text', 'suggestion', 'response')),
  metadata jsonb default '{}'::jsonb, -- e.g., { "is_optimization": true }
  created_at timestamptz not null default now()
);

-- RLS
alter table public.messages enable row level security;
-- Policy relies on the parent chat's user_id for efficiency, or direct join
create policy "Users can CRUD own messages" on public.messages for all using (
  exists (select 1 from public.chats where id = messages.chat_id and user_id = auth.uid())
);
```

### 2.5. `tags`

Shared tags for chats and notes.

```sql
create table public.tags (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  color text not null, -- Hex code
  created_at timestamptz not null default now()
);

-- RLS
alter table public.tags enable row level security;
create policy "Users can CRUD own tags" on public.tags for all using (auth.uid() = user_id);
```

### 2.6. `chat_tags` (Junction)

Many-to-many relationship between chats and tags.

```sql
create table public.chat_tags (
  chat_id uuid not null references public.chats(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  primary key (chat_id, tag_id)
);

-- RLS
alter table public.chat_tags enable row level security;
create policy "Users can CRUD own chat_tags" on public.chat_tags for all using (
  exists (select 1 from public.chats where id = chat_tags.chat_id and user_id = auth.uid())
);
```

### 2.7. `notes`

Hierarchical notes (max depth 3).

```sql
create table public.notes (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  parent_id uuid references public.notes(id) on delete cascade, -- Cascade delete for children
  content text not null, -- Max 150 words
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS
alter table public.notes enable row level security;
create policy "Users can CRUD own notes" on public.notes for all using (auth.uid() = user_id);
```

### 2.8. `note_tags` (Junction)

Many-to-many relationship between notes and tags.

```sql
create table public.note_tags (
  note_id uuid not null references public.notes(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  primary key (note_id, tag_id)
);

-- RLS
alter table public.note_tags enable row level security;
create policy "Users can CRUD own note_tags" on public.note_tags for all using (
  exists (select 1 from public.notes where id = note_tags.note_id and user_id = auth.uid())
);
```

## 3. Indexes

Performance optimizations.

```sql
create index idx_chats_user_id on public.chats(user_id);
create index idx_chats_folder_id on public.chats(folder_id);
create index idx_messages_chat_id on public.messages(chat_id);
create index idx_notes_user_id on public.notes(user_id);
create index idx_notes_parent_id on public.notes(parent_id);
```
