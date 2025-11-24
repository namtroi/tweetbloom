/**
 * TanStack Query hooks for folder management
 */

'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchFolders, createFolder, updateFolder, deleteFolder } from '@/lib/api/folders'
import { toast } from 'sonner'
import type { CreateFolderRequest, UpdateFolderRequest } from '@tweetbloom/types'

/**
 * Hook to fetch all folders
 */
export function useFolders() {
  return useQuery({
    queryKey: ['folders'],
    queryFn: fetchFolders,
  })
}

/**
 * Hook to create a new folder
 */
export function useCreateFolder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateFolderRequest) => createFolder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] })
      toast.success('Folder created')
    },
    onError: (error: Error) => {
      toast.error('Failed to create folder', {
        description: error.message,
      })
    },
  })
}

/**
 * Hook to update a folder (rename)
 */
export function useUpdateFolder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateFolderRequest }) => 
      updateFolder(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] })
      toast.success('Folder updated')
    },
    onError: (error: Error) => {
      toast.error('Failed to update folder', {
        description: error.message,
      })
    },
  })
}

/**
 * Hook to delete a folder
 */
export function useDeleteFolder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteFolder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] })
      // Also invalidate chats as they might have moved to root
      queryClient.invalidateQueries({ queryKey: ['chats'] })
      toast.success('Folder deleted')
    },
    onError: (error: Error) => {
      toast.error('Failed to delete folder', {
        description: error.message,
      })
    },
  })
}
