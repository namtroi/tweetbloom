/**
 * TanStack Query hooks for chat mutations
 * Handles optimistic updates and error handling
 */

'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { sendMessage, evaluateChat, continueChat } from '@/lib/api/chat'
import { useChatStore } from '@/store/use-chat-store'
import type { AiTool } from '@/store/use-chat-store'
import { toast } from 'sonner'

/**
 * Hook for sending a message
 * Handles optimistic updates and error states
 */
export function useSendMessage() {
  const queryClient = useQueryClient()
  const { addMessage, setLoading, setError, currentChatId, selectedAiTool, setCurrentChat } = useChatStore()

  return useMutation({
    mutationFn: async ({ 
      prompt, 
      chatId, 
      aiTool 
    }: { 
      prompt: string
      chatId?: string
      aiTool?: AiTool 
    }) => {
      setLoading(true)
      setError(null)
      
      // Optimistically add user message
      const tempUserMessage = {
        id: `temp-${Date.now()}`,
        role: 'user' as const,
        content: prompt,
        type: 'text' as const,
        createdAt: new Date().toISOString(),
      }
      addMessage(tempUserMessage)

      // Send to API
      const response = await sendMessage(
        prompt, 
        chatId || currentChatId || undefined, 
        aiTool || selectedAiTool || undefined
      )
      
      return { response, tempUserMessage }
    },
    
    onSuccess: ({ response, tempUserMessage }) => {
      setLoading(false)
      
      // CRITICAL FIX: Set currentChatId if this is a new chat
      if (response.chatId && !currentChatId) {

        setCurrentChat(response.chatId);
      }
      
      // Handle suggestion response
      if (response.status === 'suggestion' && response.content) {
        const suggestionMessage = {
          id: response.messageId || `suggestion-${Date.now()}`,
          role: 'assistant' as const,
          content: response.content,
          type: 'suggestion' as const,
          metadata: { reasoning: response.reasoning },
          createdAt: new Date().toISOString(),
        }
        addMessage(suggestionMessage)
        toast.info('Bloom Buddy suggests a better prompt!')
      }
      
      // Handle success response
      if (response.status === 'success' && response.content) {
        const assistantMessage = {
          id: response.messageId || `response-${Date.now()}`,
          role: 'assistant' as const,
          content: response.content,
          type: 'response' as const,
          createdAt: new Date().toISOString(),
          aiTool: selectedAiTool || undefined, // Add AI tool for display
        }
        addMessage(assistantMessage)
      }
      
      // Invalidate chat queries to refresh sidebar
      queryClient.invalidateQueries({ queryKey: ['chats'] })
      if (response.chatId) {
        queryClient.invalidateQueries({ queryKey: ['chat', response.chatId] })
      }
    },
    
    onError: (error: Error) => {
      setLoading(false)
      setError(error.message)
      
      // Show user-friendly error message
      if (error.message.includes('7-message limit')) {
        toast.error('Chat limit reached', {
          description: 'This chat has reached the 7-message limit. Use "Continue Chat" to start a new session.',
        })
      } else if (error.message.includes('Rate limit')) {
        toast.error('Too many requests', {
          description: 'Please wait a moment before trying again.',
        })
      } else {
        toast.error('Failed to send message', {
          description: error.message,
        })
      }
    },
  })
}

/**
 * Hook for "What Next?" evaluation
 */
export function useEvaluateChat() {
  const { setLoading, setError } = useChatStore()

  return useMutation({
    mutationFn: async ({ chatId, messageId }: { chatId: string; messageId: string }) => {
      setLoading(true)
      setError(null)
      return evaluateChat(chatId, messageId)
    },
    
    onSuccess: (data) => {
      setLoading(false)
      toast.success('Bloom Buddy suggests the next step!')
      return data
    },
    
    onError: (error: Error) => {
      setLoading(false)
      setError(error.message)
      toast.error('Failed to evaluate chat', {
        description: error.message,
      })
    },
  })
}

/**
 * Hook for "Continue Chat" flow
 */
export function useContinueChat() {
  const { setLoading, setError, reset } = useChatStore()

  return useMutation({
    mutationFn: async (chatId: string) => {
      setLoading(true)
      setError(null)
      return continueChat(chatId)
    },
    
    onSuccess: (data) => {
      setLoading(false)
      
      // Store synthesized prompt in localStorage
      if (data.new_prompt) {
        localStorage.setItem('continue_chat_prompt', data.new_prompt)
      }
      
      // Reset store for new chat
      reset()
      toast.success('Chat synthesized!', {
        description: 'Starting a new conversation with your synthesized prompt.',
      })
      return data
    },
    
    onError: (error: Error) => {
      setLoading(false)
      setError(error.message)
      toast.error('Failed to continue chat', {
        description: error.message,
      })
    },
  })
}

/**
 * Hook for updating chat (title, folder, tags)
 */
export function useUpdateChat() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { title?: string; folderId?: string | null; tagIds?: string[] } }) => {
      // Dynamic import to avoid circular dependency if any
      const { updateChat } = await import('@/lib/api/chat')
      return updateChat(id, data)
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['chat', data.id] })
      queryClient.invalidateQueries({ queryKey: ['chats'] })
      toast.success('Chat updated')
    },
    onError: (error: Error) => {
      toast.error('Failed to update chat', { description: error.message })
    }
  })
}
