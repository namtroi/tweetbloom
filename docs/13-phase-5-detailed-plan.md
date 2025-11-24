# Phase 5: Note Management, Tags & Search (Detailed Plan)

**Status**: 🚧 IN PROGRESS
**Owner**: Full Stack Dev
**Timeline**: Week 5-6
**Dependencies**: Phase 4 Complete ✅

**Tech Stack**: Next.js 15, TailwindCSS, shadcn/ui (Green), TanStack Query, Zustand, dnd-kit, Framer Motion

---

## 📋 Overview

Phase 5 implements advanced features:
1. **Note Management** - 3-level tree structure with drag-and-drop (Flow 9)
2. **Tagging System** - Shared tags for chats and notes (Flow 7, 8)
3. **Search & Filter** - Find chats and notes by tags
4. **Chat-to-Note** - Save conversations as notes (Flow 4)
5. **Note-to-Prompt** - Synthesize notes into new prompts (Flow 5)
6. **User Settings** - Default AI tool selection (Flow 10)

---

## 🎯 Part 1: Note Management (Flow 9)

### 1.1 Backend API (Already Exists)

**Endpoints**:
- `GET /api/notes` - Fetch all notes (flat array)
- `POST /api/notes` - Create note (validates 3-level depth)
- `PATCH /api/notes/:id` - Update content/parentId/tags
- `DELETE /api/notes/:id` - Delete note (cascade children)

**Validation**:
- Max 150 words / 1200 chars
- Max depth 3 levels
- Prevent circular references

### 1.2 Note Store (Zustand)

**File**: `src/store/use-note-store.ts`

```typescript
interface NoteStore {
  notes: Note[]
  selectedNotes: string[] // For combine feature
  isLoading: boolean
  error: string | null
  
  // Actions
  setNotes: (notes: Note[]) => void
  addNote: (note: Note) => void
  updateNote: (id: string, updates: Partial<Note>) => void
  deleteNote: (id: string) => void
  toggleNoteSelection: (id: string) => void
  clearSelection: () => void
  reset: () => void
}
```

### 1.3 Note Components

**File**: `src/components/notes/note-tree.tsx`

- Display notes in tree structure (max depth 3)
- Use recursion for nested rendering
- Show expand/collapse icons
- Highlight selected notes (for combine)
- Empty state: "Create your first note"

**File**: `src/components/notes/note-item.tsx`

- Note content preview (truncated)
- Depth indicator (visual indent)
- Tags display (colored badges)
- Actions dropdown:
  - Edit
  - Add child note (if depth < 3)
  - Delete
  - Select for combine

**File**: `src/components/notes/note-editor-modal.tsx`

- Modal for create/edit note
- Textarea with word/char counter (150/1200)
- Parent selector (dropdown, max depth 3)
- Tag selector (multi-select)
- Save/Cancel buttons

### 1.4 Drag & Drop (dnd-kit)

**File**: `src/components/notes/note-tree-dnd.tsx`

- Wrap tree with `DndContext`
- Make notes draggable (`useDraggable`)
- Make notes droppable (`useDroppable`)
- Validate depth before drop
- Optimistic updates via React Query
- Show drag overlay

**Logic**:
```typescript
onDragEnd = (event) => {
  const { active, over } = event
  if (!over) return
  
  // Validate depth
  const newDepth = calculateDepth(over.id)
  if (newDepth > 3) {
    toast.error("Cannot exceed 3 levels")
    return
  }
  
  // Update via API
  updateNoteMutation.mutate({
    id: active.id,
    parentId: over.id
  })
}
```

### 1.5 Note API Integration

**File**: `src/lib/api/notes.ts`

```typescript
export const notesApi = {
  fetchNotes: () => fetch('/api/notes'),
  createNote: (data) => fetch('/api/notes', { method: 'POST', body: JSON.stringify(data) }),
  updateNote: (id, data) => fetch(`/api/notes/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteNote: (id) => fetch(`/api/notes/${id}`, { method: 'DELETE' }),
  combineNotes: (noteIds) => fetch('/api/notes/combine', { method: 'POST', body: JSON.stringify({ noteIds }) })
}
```

**File**: `src/hooks/use-note-mutations.ts`

- `useNotes()` - Query for fetching notes
- `useCreateNote()` - Mutation for creating
- `useUpdateNote()` - Mutation for updating
- `useDeleteNote()` - Mutation for deleting
- `useCombineNotes()` - Mutation for combining (Flow 5)

---

## 🏷️ Part 2: Tagging System (Flow 7, 8)

### 2.1 Backend API (Already Exists)

**Endpoints**:
- `GET /api/tags` - Fetch all tags
- `POST /api/tags` - Create tag (name, color)
- `PATCH /api/tags/:id` - Update tag
- `DELETE /api/tags/:id` - Delete tag (removes from all chats/notes)

**Chat/Note Updates**:
- `PATCH /api/chats/:id` - `{ tagIds: [...] }`
- `PATCH /api/notes/:id` - `{ tagIds: [...] }`

### 2.2 Tag Store (Zustand)

**File**: `src/store/use-tag-store.ts`

```typescript
interface TagStore {
  tags: Tag[]
  selectedTagFilter: string[] // For filtering
  
  setTags: (tags: Tag[]) => void
  addTag: (tag: Tag) => void
  updateTag: (id: string, updates: Partial<Tag>) => void
  deleteTag: (id: string) => void
  toggleTagFilter: (id: string) => void
  clearFilters: () => void
}
```

### 2.3 Tag Components

**File**: `src/components/tags/tag-badge.tsx`

- Display tag with custom color
- Small, rounded badge
- Optional close button (for removal)

**File**: `src/components/tags/tag-selector.tsx`

- Multi-select dropdown
- Show existing tags
- Search/filter tags
- Create new tag inline
- Color picker for new tags

**File**: `src/components/tags/tag-manager-modal.tsx`

- Settings modal for tag CRUD
- List all tags
- Edit name/color
- Delete tag (with confirmation)
- Create new tag

### 2.4 Tag Integration

**Update Files**:
- `src/components/chat/chat-item.tsx` - Add tag badges
- `src/components/notes/note-item.tsx` - Add tag badges
- `src/components/sidebar.tsx` - Add tag filter dropdown

**Filter Logic**:
```typescript
const filteredChats = chats.filter(chat => 
  selectedTagFilter.length === 0 || 
  chat.tags.some(tag => selectedTagFilter.includes(tag.id))
)
```

---

## 💾 Part 3: Chat-to-Note & Note-to-Prompt

### 3.1 Chat-to-Note (Flow 4)

**Backend**: `POST /api/notes/summarize`

**Frontend**:

**File**: `src/components/chat/message-item.tsx` (Update)

- Add "Save as Note" button to assistant messages
- On click: Call `/api/notes/summarize` with chatId
- Open note editor modal with summary pre-filled
- User can edit before saving

**File**: `src/hooks/use-summarize-mutations.ts`

```typescript
export const useSummarizeChat = () => {
  return useMutation({
    mutationFn: (chatId: string) => 
      fetch('/api/notes/summarize', {
        method: 'POST',
        body: JSON.stringify({ chatId })
      }),
    onSuccess: (note) => {
      // Open note editor modal
      openNoteEditor(note)
      toast.success("Chat summarized as note")
    }
  })
}
```

### 3.2 Note-to-Prompt (Flow 5)

**Backend**: `POST /api/notes/combine`

**Frontend**:

**File**: `src/components/notes/combine-notes-button.tsx`

- Show when 2-7 notes selected
- On click: Call `/api/notes/combine` with noteIds
- Receive new prompt
- Navigate to new chat with prompt pre-filled

**Logic**:
```typescript
const handleCombine = async () => {
  if (selectedNotes.length < 2 || selectedNotes.length > 7) {
    toast.error("Select 2-7 notes to combine")
    return
  }
  
  const { noteId, content } = await combineNotesMutation.mutateAsync(selectedNotes)
  
  // Navigate to new chat with prompt
  router.push(`/chat?prompt=${encodeURIComponent(content)}`)
  clearSelection()
}
```

### 3.3 Continue Chat (Flow 3 - Backend)

**Backend**: `POST /api/summarize/chat-to-prompt`

**Implementation**:

**File**: `apps/api/src/routes/summarize.ts`

```typescript
fastify.post('/summarize/chat-to-prompt', async (request, reply) => {
  const { chatId } = request.body
  
  // Fetch chat history
  const messages = await fetchChatMessages(chatId)
  
  // Call Bloom Buddy to synthesize
  const newPrompt = await bloomBuddy.synthesizeChatToPrompt(messages)
  
  return { new_prompt: newPrompt }
})
```

---

## ⚙️ Part 4: User Settings (Flow 10)

### 4.1 Backend API (Already Exists)

**Endpoints**:
- `GET /api/settings` - Fetch user settings
- `PATCH /api/settings` - Update settings (default_ai_tool)

### 4.2 Settings Modal

**File**: `src/components/settings/settings-modal.tsx`

- Trigger: Settings icon in sidebar
- Sections:
  1. **AI Preferences**
     - Default AI Tool selector (Gemini/ChatGPT/Grok)
  2. **Tag Management**
     - Embed `TagManagerModal` content
  3. **Account**
     - User email (read-only)
     - Logout button

**File**: `src/hooks/use-settings.ts`

```typescript
export const useSettings = () => {
  return useQuery({
    queryKey: ['settings'],
    queryFn: () => fetch('/api/settings')
  })
}

export const useUpdateSettings = () => {
  return useMutation({
    mutationFn: (data) => 
      fetch('/api/settings', {
        method: 'PATCH',
        body: JSON.stringify(data)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(['settings'])
      toast.success("Settings updated")
    }
  })
}
```

---

## 🔍 Part 5: Search & Filter

### 5.1 Search Component

**File**: `src/components/search/search-bar.tsx`

- Search input in sidebar
- Debounced search (300ms)
- Search by:
  - Chat title
  - Note content
  - Tag name

**File**: `src/hooks/use-search.ts`

```typescript
export const useSearch = (query: string) => {
  const { chats } = useChats()
  const { notes } = useNotes()
  
  return useMemo(() => {
    if (!query) return { chats, notes }
    
    const lowerQuery = query.toLowerCase()
    
    return {
      chats: chats.filter(c => 
        c.title.toLowerCase().includes(lowerQuery) ||
        c.tags.some(t => t.name.toLowerCase().includes(lowerQuery))
      ),
      notes: notes.filter(n => 
        n.content.toLowerCase().includes(lowerQuery) ||
        n.tags.some(t => t.name.toLowerCase().includes(lowerQuery))
      )
    }
  }, [query, chats, notes])
}
```

### 5.2 Filter UI

**File**: `src/components/sidebar.tsx` (Update)

- Add search bar at top
- Add tag filter dropdown
- Show active filters (badges)
- Clear filters button

---

## 🎨 Part 6: UI/UX Polish

### 6.1 Animations

- Note tree expand/collapse (Framer Motion)
- Drag preview for notes
- Tag badge hover effects
- Modal slide-in animations

### 6.2 Empty States

- No notes: "Create your first note or save a chat"
- No tags: "Create tags to organize your content"
- No search results: "No matches found"

### 6.3 Loading States

- Skeleton for note tree
- Skeleton for tag list
- Loading spinner for combine/summarize

---

## 🧪 Testing Checklist

### Flow 4: Chat-to-Note
- [ ] Click "Save as Note" on assistant message
- [ ] Verify summary is generated (150 words max)
- [ ] Edit summary in modal
- [ ] Save note → Appears in note tree

### Flow 5: Note-to-Prompt
- [ ] Select 2-7 notes
- [ ] Click "Combine Notes"
- [ ] Verify new prompt generated
- [ ] Navigate to new chat with prompt pre-filled

### Flow 7: Tagging
- [ ] Create new tag with color
- [ ] Assign tag to chat
- [ ] Assign tag to note
- [ ] Filter by tag → See only tagged items
- [ ] Remove tag from item

### Flow 8: Tag Management
- [ ] Edit tag name/color
- [ ] Delete tag → Removed from all items
- [ ] Create tag from settings

### Flow 9: Note Management
- [ ] Create root note
- [ ] Create child note (depth 2)
- [ ] Create grandchild note (depth 3)
- [ ] Try to create depth 4 → Error
- [ ] Drag note to new parent
- [ ] Delete parent → Children deleted (cascade)
- [ ] Edit note content

### Flow 10: Settings
- [ ] Open settings modal
- [ ] Change default AI tool
- [ ] Verify new chats use new default
- [ ] Manage tags from settings

---

## 📦 New Dependencies

```bash
# Already installed from Phase 4
# @dnd-kit/core
# @dnd-kit/sortable
# @dnd-kit/utilities

# New components
pnpm dlx shadcn@latest add popover
pnpm dlx shadcn@latest add command
pnpm dlx shadcn@latest add badge
pnpm dlx shadcn@latest add separator
```

---

## 📝 Implementation Order

**Week 1: Notes Foundation**
1. Note store (1.2)
2. Note API integration (1.5)
3. Note tree UI (1.3)
4. Note editor modal (1.3)
5. Note CRUD operations

**Week 2: Advanced Note Features**
6. Drag & drop for notes (1.4)
7. Chat-to-Note (3.1)
8. Note-to-Prompt (3.2)
9. Continue Chat backend (3.3)

**Week 3: Tags & Settings**
10. Tag store (2.2)
11. Tag components (2.3)
12. Tag integration (2.4)
13. Settings modal (4.2)

**Week 4: Search & Polish**
14. Search implementation (5.1, 5.2)
15. Animations (6.1)
16. Empty/loading states (6.2, 6.3)
17. Testing (all flows)

---

## 🎯 Success Criteria

1. ✅ Notes can be created, edited, deleted (Flow 9)
2. ✅ Note tree supports 3 levels with drag-and-drop
3. ✅ Tags can be created and assigned to chats/notes (Flow 7, 8)
4. ✅ Chats can be saved as notes (Flow 4)
5. ✅ Notes can be combined into prompts (Flow 5)
6. ✅ Search finds chats and notes
7. ✅ Tag filtering works
8. ✅ Settings modal allows AI tool selection (Flow 10)
9. ✅ Continue Chat backend complete (Flow 3)
10. ✅ All animations smooth and polished

---

## 🔗 Dependencies

**Blocked by**: Phase 4 ✅

**Blocks**: Phase 6 (Polish & Testing)

**Related**: Backend API (all endpoints exist, need Continue Chat)

---

## 📚 References

- **Flows**: `docs/00-overview.md` (Flows 4, 5, 7, 8, 9, 10)
- **API Specs**: `docs/02-api-specs.md`
- **Database**: `docs/03-database-schema.md`
- **Phase 4**: `docs/12-phase-4-detailed-plan.md`

---

**Let's Bloom Further! 🌳**
