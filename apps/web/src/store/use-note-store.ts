import { create } from 'zustand'

export interface Note {
  id: string
  user_id: string
  parent_id: string | null
  content: string
  created_at: string
  updated_at: string
  tags?: Array<{ id: string; name: string; color: string }>
}

interface NoteStore {
  // State
  notes: Note[]
  selectedNotes: string[] // For combine feature (max 7)
  isLoading: boolean
  error: string | null
  
  // Actions
  setNotes: (notes: Note[]) => void
  addNote: (note: Note) => void
  updateNote: (id: string, updates: Partial<Note>) => void
  deleteNote: (id: string) => void
  toggleNoteSelection: (id: string) => void
  clearSelection: () => void
  setLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void
  reset: () => void
}

const initialState = {
  notes: [],
  selectedNotes: [],
  isLoading: false,
  error: null,
}

export const useNoteStore = create<NoteStore>((set) => ({
  ...initialState,
  
  setNotes: (notes) => set({ notes, error: null }),
  
  addNote: (note) => 
    set((state) => ({ 
      notes: [...state.notes, note],
      error: null,
    })),
  
  updateNote: (id, updates) =>
    set((state) => ({
      notes: state.notes.map((note) =>
        note.id === id ? { ...note, ...updates } : note
      ),
    })),
  
  deleteNote: (id) =>
    set((state) => ({
      notes: state.notes.filter((note) => note.id !== id),
      selectedNotes: state.selectedNotes.filter((noteId) => noteId !== id),
    })),
  
  toggleNoteSelection: (id) =>
    set((state) => {
      const isSelected = state.selectedNotes.includes(id)
      
      // Max 7 notes for combine
      if (!isSelected && state.selectedNotes.length >= 7) {
        return { error: 'Maximum 7 notes can be selected' }
      }
      
      return {
        selectedNotes: isSelected
          ? state.selectedNotes.filter((noteId) => noteId !== id)
          : [...state.selectedNotes, id],
        error: null,
      }
    }),
  
  clearSelection: () => set({ selectedNotes: [] }),
  
  setLoading: (isLoading) => set({ isLoading }),
  
  setError: (error) => set({ error, isLoading: false }),
  
  reset: () => set(initialState),
}))

// Helper: Calculate note depth in tree
export function calculateNoteDepth(noteId: string, notes: Note[]): number {
  const note = notes.find((n) => n.id === noteId)
  if (!note || !note.parent_id) return 1
  
  return 1 + calculateNoteDepth(note.parent_id, notes)
}

// Helper: Build tree structure from flat array
export function buildNoteTree(notes: Note[]): Note[] {
  const rootNotes = notes.filter((note) => !note.parent_id)
  
  const addChildren = (note: Note): Note & { children?: Note[] } => {
    const children = notes
      .filter((n) => n.parent_id === note.id)
      .map(addChildren)
    
    return children.length > 0 ? { ...note, children } : note
  }
  
  return rootNotes.map(addChildren)
}
