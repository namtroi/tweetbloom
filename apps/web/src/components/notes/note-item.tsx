'use client'

import { useState } from 'react'
import { type Note } from '@/store/use-note-store'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { TagBadge } from '@/components/tags/tag-badge'
import { useDeleteNote } from '@/hooks/use-note-mutations'
import { useNoteStore } from '@/store/use-note-store'
import { MoreVertical, Edit, Trash2, Plus, CheckSquare, Square } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NoteItemProps {
  note: Note & { children?: Note[] }
  depth: number
  onEdit: (note: Note) => void
  onAddChild: (parentId: string) => void
  renderChildren?: boolean
  isExpanded?: boolean
  onToggleExpand?: () => void
}

export function NoteItem({ 
  note, 
  depth, 
  onEdit, 
  onAddChild, 
  renderChildren = true,
  isExpanded: controlledExpanded,
  onToggleExpand
}: NoteItemProps) {
  const deleteNoteMutation = useDeleteNote()
  const selectedNotes = useNoteStore((state) => state.selectedNotes)
  const toggleNoteSelection = useNoteStore((state) => state.toggleNoteSelection)
  
  const [internalExpanded, setInternalExpanded] = useState(true)
  const isExpanded = controlledExpanded ?? internalExpanded
  
  const isSelected = selectedNotes.includes(note.id)
  const hasChildren = note.children && note.children.length > 0
  const canAddChild = depth < 3 // Max depth is 3

  const handleToggleExpand = () => {
    if (onToggleExpand) {
      onToggleExpand()
    } else {
      setInternalExpanded(!internalExpanded)
    }
  }

  const handleDelete = async () => {
    if (confirm('Are you sure? This will delete the note and all its children.')) {
      await deleteNoteMutation.mutateAsync(note.id)
    }
  }

  return (
    <div className="group">
      {/* Note Item */}
      <div
        className={cn(
          'flex items-start gap-2 rounded-lg border p-3 transition-colors hover:bg-accent',
          isSelected && 'border-primary bg-primary/5',
          'cursor-pointer'
        )}
        style={{ marginLeft: `${(depth - 1) * 24}px` }}
      >
        {/* Selection Checkbox */}
        <button
          onClick={() => toggleNoteSelection(note.id)}
          className="mt-0.5 flex-shrink-0"
        >
          {isSelected ? (
            <CheckSquare className="h-4 w-4 text-primary" />
          ) : (
            <Square className="h-4 w-4 text-muted-foreground" />
          )}
        </button>

        {/* Expand/Collapse (if has children) */}
        {hasChildren && (
          <button
            onClick={handleToggleExpand}
            className="mt-0.5 flex-shrink-0"
          >
            <svg
              className={cn('h-4 w-4 transition-transform', isExpanded && 'rotate-90')}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm line-clamp-2">{note.content}</p>
          
          {/* Tags */}
          {note.tags && note.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {note.tags.map((tag) => (
                <TagBadge key={tag.id} tag={tag as any} />
              ))}
            </div>
          )}
          
          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
            <span>Depth {depth}</span>
            <span>•</span>
            <span>{new Date(note.created_at).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(note)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            {canAddChild && (
              <DropdownMenuItem onClick={() => onAddChild(note.id)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Child Note
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={handleDelete} className="text-red-600">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Children (recursive) */}
      {renderChildren && hasChildren && isExpanded && (
        <div className="mt-2 space-y-2">
          {note.children!.map((child) => (
            <NoteItem
              key={child.id}
              note={child}
              depth={depth + 1}
              onEdit={onEdit}
              onAddChild={onAddChild}
            />
          ))}
        </div>
      )}
    </div>
  )
}
