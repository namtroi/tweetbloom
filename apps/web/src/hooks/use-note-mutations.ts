import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { notesApi, type CreateNoteData, type UpdateNoteData } from '@/lib/api/notes'
import { useNoteStore } from '@/store/use-note-store'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

// Query: Fetch all notes
export function useNotes() {
  const setNotes = useNoteStore((state) => state.setNotes)
  const setLoading = useNoteStore((state) => state.setLoading)
  const setError = useNoteStore((state) => state.setError)

  return useQuery({
    queryKey: ['notes'],
    queryFn: async () => {
      setLoading(true)
      try {
        const notes = await notesApi.fetchNotes()
        setNotes(notes)
        return notes
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch notes'
        setError(message)
        throw error
      } finally {
        setLoading(false)
      }
    },
  })
}

// Mutation: Create note
export function useCreateNote() {
  const queryClient = useQueryClient()
  const addNote = useNoteStore((state) => state.addNote)

  return useMutation({
    mutationFn: (data: CreateNoteData) => notesApi.createNote(data),
    onSuccess: (newNote) => {
      addNote(newNote)
      queryClient.invalidateQueries({ queryKey: ['notes'] })
      toast.success('Note created successfully')
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Failed to create note'
      toast.error(message)
    },
  })
}

// Mutation: Update note
export function useUpdateNote() {
  const queryClient = useQueryClient()
  const updateNote = useNoteStore((state) => state.updateNote)

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateNoteData }) =>
      notesApi.updateNote(id, data),
    onMutate: async ({ id, data }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['notes'] })
      const previousNotes = queryClient.getQueryData(['notes'])
      
      updateNote(id, data)
      
      return { previousNotes }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
      toast.success('Note updated successfully')
    },
    onError: (error, _, context) => {
      // Rollback on error
      if (context?.previousNotes) {
        queryClient.setQueryData(['notes'], context.previousNotes)
      }
      const message = error instanceof Error ? error.message : 'Failed to update note'
      toast.error(message)
    },
  })
}

// Mutation: Delete note
export function useDeleteNote() {
  const queryClient = useQueryClient()
  const deleteNote = useNoteStore((state) => state.deleteNote)

  return useMutation({
    mutationFn: (id: string) => notesApi.deleteNote(id),
    onMutate: async (id) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['notes'] })
      const previousNotes = queryClient.getQueryData(['notes'])
      
      deleteNote(id)
      
      return { previousNotes }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
      toast.success('Note deleted successfully')
    },
    onError: (error, _, context) => {
      // Rollback on error
      if (context?.previousNotes) {
        queryClient.setQueryData(['notes'], context.previousNotes)
      }
      const message = error instanceof Error ? error.message : 'Failed to delete note'
      toast.error(message)
    },
  })
}

// Mutation: Combine notes (Flow 5)
export function useCombineNotes() {
  const router = useRouter()
  const clearSelection = useNoteStore((state) => state.clearSelection)

  return useMutation({
    mutationFn: (noteIds: string[]) => notesApi.combineNotes(noteIds),
    onSuccess: (response) => {
      clearSelection()
      toast.success('Notes combined successfully')
      
      // Navigate to new chat with combined prompt
      router.push(`/chat?prompt=${encodeURIComponent(response.content)}`)
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Failed to combine notes'
      toast.error(message)
    },
  })
}

// Mutation: Summarize chat to note (Flow 4)
export function useSummarizeChat() {
  const queryClient = useQueryClient()
  const addNote = useNoteStore((state) => state.addNote)

  return useMutation({
    mutationFn: (chatId: string) => notesApi.summarizeChatToNote(chatId),
    onSuccess: (newNote) => {
      addNote(newNote)
      queryClient.invalidateQueries({ queryKey: ['notes'] })
      toast.success('Chat saved as note')
      
      // Return note for opening in editor
      return newNote
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Failed to save chat as note'
      toast.error(message)
    },
  })
}
