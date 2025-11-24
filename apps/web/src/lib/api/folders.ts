/**
 * Folder API client functions
 */

import type { 
  CreateFolderRequest,
  UpdateFolderRequest,
  Database
} from '@tweetbloom/types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

type Folder = Database['public']['Tables']['folders']['Row']

/**
 * Get auth token from Supabase session
 */
async function getAuthToken(): Promise<string> {
  if (typeof window === 'undefined') {
    throw new Error('Cannot get auth token on server side')
  }
  
  const { createClient } = await import('@/lib/supabase/client')
  const supabase = createClient()
  
  const { data: { session }, error } = await supabase.auth.getSession()
  
  if (error || !session) {
    throw new Error('No active session. Please log in.')
  }
  
  return session.access_token
}

/**
 * Fetch all folders
 */
export async function fetchFolders(): Promise<Folder[]> {
  const token = await getAuthToken()

  const response = await fetch(`${API_BASE_URL}/api/folders`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }))
    throw new Error(error.message || `HTTP ${response.status}`)
  }

  return response.json()
}

/**
 * Create a new folder
 */
export async function createFolder(data: CreateFolderRequest): Promise<Folder> {
  const token = await getAuthToken()

  const response = await fetch(`${API_BASE_URL}/api/folders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }))
    throw new Error(error.message || `HTTP ${response.status}`)
  }

  return response.json()
}

/**
 * Update a folder (rename)
 */
export async function updateFolder(id: string, data: UpdateFolderRequest): Promise<Folder> {
  const token = await getAuthToken()

  const response = await fetch(`${API_BASE_URL}/api/folders/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }))
    throw new Error(error.message || `HTTP ${response.status}`)
  }

  return response.json()
}

/**
 * Delete a folder
 */
export async function deleteFolder(id: string): Promise<void> {
  const token = await getAuthToken()

  const response = await fetch(`${API_BASE_URL}/api/folders/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }))
    throw new Error(error.message || `HTTP ${response.status}`)
  }
}
