'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TagSelector } from '@/components/tags/tag-selector'
import { useNoteStore, type Note } from '@/store/use-note-store'
import { useCreateNote, useUpdateNote } from '@/hooks/use-note-mutations'
import type { Tag } from '@/store/use-tag-store'
import { Loader2 } from 'lucide-react'

interface NoteEditorModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  note?: Note | null // If editing existing note
  defaultParentId?: string | null
}

export function NoteEditorModal({ open, onOpenChange, note, defaultParentId }: NoteEditorModalProps) {
  const notes = useNoteStore((state) => state.notes)
  const createNoteMutation = useCreateNote()
  const updateNoteMutation = useUpdateNote()

  const [content, setContent] = useState('')
  const [parentId, setParentId] = useState<string | null>(null)
  const [selectedTags, setSelectedTags] = useState<Tag[]>([])

  // Sync state when modal opens or note changes
  useEffect(() => {
    if (open) {
      setContent(note?.content || '')
      setParentId(note?.parent_id || defaultParentId || null)
      setSelectedTags((note?.tags || []) as Tag[])
    }
  }, [open, note, defaultParentId])

  const isEditing = !!note

  // Word and character counting
  const wordCount = content.trim().split(/\s+/).filter(Boolean).length
  const charCount = content.length
  const isOverLimit = wordCount > 150 || charCount > 1200

  // Get available parent notes (max depth 2, so children can be depth 3)
  const availableParents = notes.filter((n) => {
    if (isEditing && n.id === note.id) return false // Can't be parent of itself
    
    // Calculate depth
    let depth = 1
    let current = n
    while (current.parent_id) {
      depth++
      const parent = notes.find((p) => p.id === current.parent_id)
      if (!parent) break
      current = parent
    }
    
    return depth < 3 // Only allow depth 1 and 2 as parents
  })

  const handleSave = async () => {
    if (!content.trim() || isOverLimit) return

    const tagIds = selectedTags.map(tag => tag.id)

    try {
      if (isEditing) {
        await updateNoteMutation.mutateAsync({
          id: note.id,
          data: { content, parentId, tagIds },
        })
      } else {
        await createNoteMutation.mutateAsync({
          content,
          parentId,
          tagIds,
        })
      }
      
      onOpenChange(false)
      setContent('')
      setParentId(null)
      setSelectedTags([])
    } catch (error) {
      // Error handled by mutation
    }
  }

  const isLoading = createNoteMutation.isPending || updateNoteMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Note' : 'Create New Note'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              placeholder="Write your note here... (max 150 words / 1200 characters)"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[200px] resize-none"
              disabled={isLoading}
            />
            <div className="flex justify-between text-sm">
              <span className={wordCount > 150 ? 'text-red-500' : 'text-muted-foreground'}>
                {wordCount} / 150 words
              </span>
              <span className={charCount > 1200 ? 'text-red-500' : 'text-muted-foreground'}>
                {charCount} / 1200 characters
              </span>
            </div>
          </div>

          {/* Parent Selector */}
          <div className="space-y-2">
            <Label htmlFor="parent">Parent Note (Optional)</Label>
            <Select value={parentId || 'root'} onValueChange={(val) => setParentId(val === 'root' ? null : val)}>
              <SelectTrigger id="parent" disabled={isLoading}>
                <SelectValue placeholder="Select parent note" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="root">Root (No Parent)</SelectItem>
                {availableParents.map((n) => (
                  <SelectItem key={n.id} value={n.id}>
                    {n.content.substring(0, 50)}...
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Notes can be nested up to 3 levels deep
            </p>
          </div>

          {/* Tag Selector */}
          <TagSelector
            selectedTags={selectedTags}
            onTagsChange={setSelectedTags}
            disabled={isLoading}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!content.trim() || isOverLimit || isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? 'Update' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
