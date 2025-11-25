/**
 * Chat API client functions
 * Handles all chat-related API calls
 */

import type { 
  ChatRequest, 
  ChatResponse,
  ChatEvaluateRequest,
  ChatEvaluateResponse,
} from '@tweetbloom/types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

/**
 * Get auth token from Supabase session
 */
async function getAuthToken(): Promise<string> {
  if (typeof window === 'undefined') {
    throw new Error('Cannot get auth token on server side')
  }
  
  // Dynamically import to avoid SSR issues
  const { createClient } = await import('@/lib/supabase/client')
  const supabase = createClient()
  
  const { data: { session }, error } = await supabase.auth.getSession()
  
  if (error || !session) {
    throw new Error('No active session. Please log in.')
  }
  
  return session.access_token
}

/**
 * Send a message to the chat API
 * Handles both new chats and continuing existing chats
 */
export async function sendMessage(
  prompt: string,
  chatId?: string,
  aiTool?: 'GEMINI' | 'CHATGPT' | 'GROK'
): Promise<ChatResponse> {
  const token = await getAuthToken()
  
  const body: ChatRequest = {
    prompt,
    chatId,
    aiTool,
    override_ai_check: false, // Always false for normal user requests
  }

  const response = await fetch(`${API_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }))
    throw new Error(error.message || `HTTP ${response.status}`)
  }

  return response.json()
}

/**
 * Evaluate chat and get "What Next?" suggestion
 */
export async function evaluateChat(
  chatId: string,
  messageId: string
): Promise<ChatEvaluateResponse> {
  const token = await getAuthToken()
  
  const body: ChatEvaluateRequest = {
    chatId,
    messageId, // Now included in request
  }

  const response = await fetch(`${API_BASE_URL}/api/chat/evaluate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }))
    throw new Error(error.message || `HTTP ${response.status}`)
  }

  return response.json()
}

/**
 * Continue chat (Flow 3) - Synthesize chat history into new prompt
 */
export async function continueChat(chatId: string): Promise<{ new_prompt: string }> {
  const token = await getAuthToken()

  const response = await fetch(`${API_BASE_URL}/api/summarize/chat-to-prompt`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ chatId }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }))
    throw new Error(error.message || `HTTP ${response.status}`)
  }

  return response.json()
}

/**
 * Fetch a single chat with its messages
 */
export async function fetchChat(chatId: string) {
  const token = await getAuthToken()

  const response = await fetch(`${API_BASE_URL}/api/chat/${chatId}`, {
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
 * Fetch all chats for the current user
 */
export async function fetchChats() {
  const token = await getAuthToken()

  const response = await fetch(`${API_BASE_URL}/api/chat`, {
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
 * Update a chat (rename, move to folder)
 */
export async function updateChat(id: string, data: { title?: string; folderId?: string | null; tagIds?: string[] }) {
  const token = await getAuthToken()

  const response = await fetch(`${API_BASE_URL}/api/chat/${id}`, {
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
 * Delete a chat
 */
export async function deleteChat(id: string) {
  const token = await getAuthToken()

  const response = await fetch(`${API_BASE_URL}/api/chat/${id}`, {
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
