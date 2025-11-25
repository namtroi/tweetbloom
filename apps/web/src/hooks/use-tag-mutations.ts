import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { tagsApi, type CreateTagData, type UpdateTagData } from '@/lib/api/tags'
import { useTagStore } from '@/store/use-tag-store'
import { toast } from 'sonner'

// Query: Fetch all tags
export function useTags() {
  const setTags = useTagStore((state) => state.setTags)
  const setLoading = useTagStore((state) => state.setLoading)
  const setError = useTagStore((state) => state.setError)

  return useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      setLoading(true)
      try {
        const tags = await tagsApi.fetchTags()
        setTags(tags)
        return tags
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch tags'
        setError(message)
        throw error
      } finally {
        setLoading(false)
      }
    },
  })
}

// Mutation: Create tag
export function useCreateTag() {
  const queryClient = useQueryClient()
  const addTag = useTagStore((state) => state.addTag)

  return useMutation({
    mutationFn: (data: CreateTagData) => tagsApi.createTag(data),
    onSuccess: (newTag) => {
      addTag(newTag)
      queryClient.invalidateQueries({ queryKey: ['tags'] })
      toast.success('Tag created successfully')
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Failed to create tag'
      toast.error(message)
    },
  })
}

// Mutation: Update tag
export function useUpdateTag() {
  const queryClient = useQueryClient()
  const updateTag = useTagStore((state) => state.updateTag)

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTagData }) =>
      tagsApi.updateTag(id, data),
    onMutate: async ({ id, data }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['tags'] })
      const previousTags = queryClient.getQueryData(['tags'])
      
      updateTag(id, data)
      
      return { previousTags }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] })
      toast.success('Tag updated successfully')
    },
    onError: (error, _, context) => {
      // Rollback on error
      if (context?.previousTags) {
        queryClient.setQueryData(['tags'], context.previousTags)
      }
      const message = error instanceof Error ? error.message : 'Failed to update tag'
      toast.error(message)
    },
  })
}

// Mutation: Delete tag
export function useDeleteTag() {
  const queryClient = useQueryClient()
  const deleteTag = useTagStore((state) => state.deleteTag)

  return useMutation({
    mutationFn: (id: string) => tagsApi.deleteTag(id),
    onMutate: async (id) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['tags'] })
      const previousTags = queryClient.getQueryData(['tags'])
      
      deleteTag(id)
      
      return { previousTags }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] })
      queryClient.invalidateQueries({ queryKey: ['notes'] }) // Refresh notes to update tags
      queryClient.invalidateQueries({ queryKey: ['chats'] }) // Refresh chats to update tags
      toast.success('Tag deleted successfully')
    },
    onError: (error, _, context) => {
      // Rollback on error
      if (context?.previousTags) {
        queryClient.setQueryData(['tags'], context.previousTags)
      }
      const message = error instanceof Error ? error.message : 'Failed to delete tag'
      toast.error(message)
    },
  })
}
