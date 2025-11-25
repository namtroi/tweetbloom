import { createClient } from '@/lib/supabase/client'
import type { Tag } from '@/store/use-tag-store'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export interface CreateTagData {
  name: string
  color: string
}

export interface UpdateTagData {
  name?: string
  color?: string
}

export const tagsApi = {
  // Fetch all tags
  fetchTags: async (): Promise<Tag[]> => {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      throw new Error('Not authenticated')
    }

    const response = await fetch(`${API_BASE}/api/tags`, {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to fetch tags')
    }

    return response.json()
  },

  // Create new tag
  createTag: async (data: CreateTagData): Promise<Tag> => {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      throw new Error('Not authenticated')
    }

    const response = await fetch(`${API_BASE}/api/tags`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to create tag')
    }

    return response.json()
  },

  // Update tag
  updateTag: async (id: string, data: UpdateTagData): Promise<Tag> => {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      throw new Error('Not authenticated')
    }

    const response = await fetch(`${API_BASE}/api/tags/${id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to update tag')
    }

    return response.json()
  },

  // Delete tag
  deleteTag: async (id: string): Promise<void> => {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      throw new Error('Not authenticated')
    }

    const response = await fetch(`${API_BASE}/api/tags/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to delete tag')
    }
  },
}
