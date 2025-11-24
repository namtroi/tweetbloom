/**
 * TanStack Query hooks for chat management (fetching, updating, deleting)
 */

'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchChats, fetchChat, updateChat, deleteChat } from '@/lib/api/chat'
import { toast } from 'sonner'

/**
 * Hook to fetch all chats
 */
export function useChats() {
  return useQuery({
    queryKey: ['chats'],
    queryFn: fetchChats,
  })
}

/**
 * Hook to fetch a single chat
 */
export function useChat(chatId: string | null) {
  return useQuery({
    queryKey: ['chat', chatId],
    queryFn: () => fetchChat(chatId!),
    enabled: !!chatId,
  })
}

/**
 * Hook to update a chat (rename, move)
 */
export function useUpdateChat() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { title?: string; folderId?: string | null } }) => 
      updateChat(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['chats'] })
      queryClient.invalidateQueries({ queryKey: ['chat', data.id] })
      toast.success('Chat updated')
    },
    onError: (error: Error) => {
      toast.error('Failed to update chat', {
        description: error.message,
      })
    },
  })
}

/**
 * Hook to delete a chat
 */
export function useDeleteChat() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteChat(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chats'] })
      toast.success('Chat deleted')
    },
    onError: (error: Error) => {
      toast.error('Failed to delete chat', {
        description: error.message,
      })
    },
  })
}
