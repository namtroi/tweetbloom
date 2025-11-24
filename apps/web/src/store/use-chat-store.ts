import { create } from 'zustand'
import type { MessageRow } from '@tweetbloom/types'

export type AiTool = 'GEMINI' | 'CHATGPT' | 'GROK'

export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  type: 'text' | 'suggestion' | 'response'
  metadata?: Record<string, any>
  createdAt: string
  aiTool?: AiTool // Track which AI generated this response
}

interface ChatState {
  // Current chat state
  currentChatId: string | null
  messages: Message[]
  isLoading: boolean
  error: string | null
  selectedAiTool: AiTool | null
  
  // Actions
  setCurrentChat: (chatId: string | null) => void
  addMessage: (message: Message) => void
  updateMessage: (messageId: string, updates: Partial<Message>) => void
  setMessages: (messages: Message[]) => void
  clearMessages: () => void
  setLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void
  setSelectedAiTool: (tool: AiTool | null) => void
  reset: () => void
}

const initialState = {
  currentChatId: null,
  messages: [],
  isLoading: false,
  error: null,
  selectedAiTool: null,
}

export const useChatStore = create<ChatState>((set) => ({
  ...initialState,
  
  setCurrentChat: (chatId) => set({ currentChatId: chatId }),
  
  addMessage: (message) => 
    set((state) => ({ 
      messages: [...state.messages, message],
      error: null, // Clear error on new message
    })),
  
  updateMessage: (messageId, updates) =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === messageId ? { ...msg, ...updates } : msg
      ),
    })),
  
  setMessages: (messages) => set({ messages }),
  
  clearMessages: () => set({ messages: [] }),
  
  setLoading: (isLoading) => set({ isLoading }),
  
  setError: (error) => set({ error, isLoading: false }),
  
  setSelectedAiTool: (tool) => set({ selectedAiTool: tool }),
  
  reset: () => set(initialState),
}))

// Helper function to convert MessageRow to Message
// Helper function to convert MessageRow to Message
export function messageRowToMessage(row: MessageRow, aiTool?: AiTool): Message {
  return {
    id: row.id,
    role: row.role,
    content: row.content,
    type: row.type,
    metadata: row.metadata,
    createdAt: row.created_at,
    aiTool: aiTool,
  }
}
