import { create } from 'zustand'

export interface Tag {
  id: string
  user_id: string
  name: string
  color: string
  created_at: string
}

interface TagStore {
  // State
  tags: Tag[]
  selectedTagFilter: string[] // For filtering chats/notes
  isLoading: boolean
  error: string | null
  
  // Actions
  setTags: (tags: Tag[]) => void
  addTag: (tag: Tag) => void
  updateTag: (id: string, updates: Partial<Tag>) => void
  deleteTag: (id: string) => void
  toggleTagFilter: (id: string) => void
  clearFilters: () => void
  setLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void
  reset: () => void
}

const initialState = {
  tags: [],
  selectedTagFilter: [],
  isLoading: false,
  error: null,
}

export const useTagStore = create<TagStore>((set) => ({
  ...initialState,
  
  setTags: (tags) => set({ tags, error: null }),
  
  addTag: (tag) => 
    set((state) => ({ 
      tags: [...state.tags, tag],
      error: null,
    })),
  
  updateTag: (id, updates) =>
    set((state) => ({
      tags: state.tags.map((tag) =>
        tag.id === id ? { ...tag, ...updates } : tag
      ),
    })),
  
  deleteTag: (id) =>
    set((state) => ({
      tags: state.tags.filter((tag) => tag.id !== id),
      selectedTagFilter: state.selectedTagFilter.filter((tagId) => tagId !== id),
    })),
  
  toggleTagFilter: (id) =>
    set((state) => {
      const isSelected = state.selectedTagFilter.includes(id)
      
      return {
        selectedTagFilter: isSelected
          ? state.selectedTagFilter.filter((tagId) => tagId !== id)
          : [...state.selectedTagFilter, id],
        error: null,
      }
    }),
  
  clearFilters: () => set({ selectedTagFilter: [] }),
  
  setLoading: (isLoading) => set({ isLoading }),
  
  setError: (error) => set({ error, isLoading: false }),
  
  reset: () => set(initialState),
}))
