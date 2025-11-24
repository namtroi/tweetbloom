import { create } from 'zustand'

interface ChatState {
  messages: any[] // Replace with proper type later
  isLoading: boolean
  addMessage: (message: any) => void
  setLoading: (loading: boolean) => void
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isLoading: false,
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  setLoading: (loading) => set({ isLoading: loading }),
}))
