'use client'

import { useState } from 'react'
import { useNoteStore, buildNoteTree, type Note } from '@/store/use-note-store'
import { useNotes, useCombineNotes } from '@/hooks/use-note-mutations'
import { NoteItem } from './note-item'
import { NoteEditorModal } from './note-editor-modal'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, Combine } from 'lucide-react'

import { TagFilter } from '@/components/tags/tag-filter'
import { useTagStore } from '@/store/use-tag-store'

export function NoteTree() {
  const { data: notes, isLoading } = useNotes()
  const selectedNotes = useNoteStore((state) => state.selectedNotes)
  const clearSelection = useNoteStore((state) => state.clearSelection)
  const combineNotesMutation = useCombineNotes()
  
  // Tag filtering
  const selectedTagFilter = useTagStore((state) => state.selectedTagFilter)
  const isFiltering = selectedTagFilter.length > 0

  const [editorOpen, setEditorOpen] = useState(false)
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [defaultParentId, setDefaultParentId] = useState<string | null>(null)

  // Filter notes logic
  const filteredNotes = isFiltering
    ? notes?.filter(note => 
        note.tags?.some(tag => selectedTagFilter.includes(tag.id))
      ) || []
    : notes

  // Build tree structure (only if not filtering, or handle filtering differently)
  // If filtering, we show a flat list of matched notes to avoid confusion
  const displayNotes = isFiltering 
    ? (filteredNotes || []) 
    : (notes ? buildNoteTree(notes) : [])

  const handleEdit = (note: Note) => {
    setEditingNote(note)
    setDefaultParentId(null)
    setEditorOpen(true)
  }

  const handleAddChild = (parentId: string) => {
    setEditingNote(null)
    setDefaultParentId(parentId)
    setEditorOpen(true)
  }

  const handleCreateRoot = () => {
    setEditingNote(null)
    setDefaultParentId(null)
    setEditorOpen(true)
  }

  const handleCombine = async () => {
    if (selectedNotes.length < 2 || selectedNotes.length > 7) {
      return
    }
    await combineNotesMutation.mutateAsync(selectedNotes)
  }

  const handleCloseEditor = () => {
    setEditorOpen(false)
    setEditingNote(null)
    setDefaultParentId(null)
  }

  if (isLoading) {
    return (
      <div className="space-y-3 p-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b p-4">
        <div>
          <h2 className="text-lg font-semibold">Notes</h2>
          <p className="text-sm text-muted-foreground">
            {notes?.length || 0} notes
            {selectedNotes.length > 0 && ` • ${selectedNotes.length} selected`}
          </p>
        </div>
        <div className="flex gap-2">
          {selectedNotes.length >= 2 && selectedNotes.length <= 7 && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleCombine}
              disabled={combineNotesMutation.isPending}
            >
              <Combine className="mr-2 h-4 w-4" />
              Combine ({selectedNotes.length})
            </Button>
          )}
          <Button size="sm" onClick={handleCreateRoot}>
            <Plus className="mr-2 h-4 w-4" />
            New Note
          </Button>
        </div>
      </div>

      {/* Selection Actions */}
      {selectedNotes.length > 0 && (
        <div className="border-b bg-muted/50 p-2 px-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {selectedNotes.length} note{selectedNotes.length > 1 ? 's' : ''} selected
              {selectedNotes.length >= 2 && selectedNotes.length <= 7 && ' (ready to combine)'}
              {selectedNotes.length > 7 && ' (max 7 for combine)'}
            </span>
            <Button variant="ghost" size="sm" onClick={clearSelection}>
              Clear Selection
            </Button>
          </div>
        </div>
      )}

      {/* Note Tree */}
      <ScrollArea className="flex-1">
        <div className="space-y-4 p-4">
          {/* Tag Filter */}
          <TagFilter />

          {displayNotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground">
                {isFiltering ? 'No notes match the selected tags' : 'No notes yet'}
              </p>
              {!isFiltering && (
                <>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Create your first note or save a chat as a note
                  </p>
                  <Button className="mt-4" onClick={handleCreateRoot}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create First Note
                  </Button>
                </>
              )}
            </div>
          ) : (
            <div className={isFiltering ? 'space-y-2' : 'space-y-2'}>
              {displayNotes.map((note) => (
                <NoteItem
                  key={note.id}
                  note={note}
                  depth={1} // Always depth 1 if filtering (flat list)
                  onEdit={handleEdit}
                  onAddChild={handleAddChild}
                />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Editor Modal */}
      <NoteEditorModal
        open={editorOpen}
        onOpenChange={handleCloseEditor}
        note={editingNote}
        defaultParentId={defaultParentId}
      />
    </div>
  )
}
