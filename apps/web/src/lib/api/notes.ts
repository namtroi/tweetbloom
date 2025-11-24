import { createClient } from '@/lib/supabase/client'
import type { Note } from '@/store/use-note-store'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export interface CreateNoteData {
  content: string
  parentId?: string | null
}

export interface UpdateNoteData {
  content?: string
  parentId?: string | null
  tagIds?: string[]
}

export interface CombineNotesResponse {
  noteId: string
  content: string
}

export const notesApi = {
  // Fetch all notes
  fetchNotes: async (): Promise<Note[]> => {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      throw new Error('Not authenticated')
    }

    const response = await fetch(`${API_BASE}/api/notes`, {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to fetch notes')
    }

    return response.json()
  },

  // Create new note
  createNote: async (data: CreateNoteData): Promise<Note> => {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      throw new Error('Not authenticated')
    }

    const response = await fetch(`${API_BASE}/api/notes`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: data.content,
        parentId: data.parentId || null,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to create note')
    }

    return response.json()
  },

  // Update note
  updateNote: async (id: string, data: UpdateNoteData): Promise<Note> => {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      throw new Error('Not authenticated')
    }

    const response = await fetch(`${API_BASE}/api/notes/${id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to update note')
    }

    return response.json()
  },

  // Delete note
  deleteNote: async (id: string): Promise<void> => {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      throw new Error('Not authenticated')
    }

    const response = await fetch(`${API_BASE}/api/notes/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to delete note')
    }
  },

  // Combine notes (Flow 5)
  combineNotes: async (noteIds: string[]): Promise<CombineNotesResponse> => {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      throw new Error('Not authenticated')
    }

    if (noteIds.length < 2 || noteIds.length > 7) {
      throw new Error('Must select 2-7 notes to combine')
    }

    const response = await fetch(`${API_BASE}/api/notes/combine`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ noteIds }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to combine notes')
    }

    return response.json()
  },

  // Summarize chat to note (Flow 4)
  summarizeChatToNote: async (chatId: string): Promise<Note> => {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      throw new Error('Not authenticated')
    }

    const response = await fetch(`${API_BASE}/api/notes/summarize`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ chatId }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to summarize chat')
    }

    const result = await response.json() as { noteId: string; content: string }
    
    // Fetch full note object
    const noteResponse = await fetch(`${API_BASE}/api/notes`, {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
    })
    
    if (!noteResponse.ok) {
      throw new Error('Failed to fetch note after summarization')
    }
    
    const notes = await noteResponse.json() as Note[]
    const note = notes.find(n => n.id === result.noteId)
    
    if (!note) {
      throw new Error('Note not found after summarization')
    }
    
    return note
  },
}
