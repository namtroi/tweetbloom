'use client'

import { useState } from 'react'
import { useDraggable, useDroppable } from '@dnd-kit/core'
import { NoteItem } from './note-item'
import { cn } from '@/lib/utils'
import { type Note } from '@/store/use-note-store'

interface DraggableNoteItemProps {
  note: Note & { children?: Note[] }
  depth: number
  onEdit: (note: Note) => void
  onAddChild: (parentId: string) => void
}

export function DraggableNoteItem({ note, depth, onEdit, onAddChild }: DraggableNoteItemProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  const { attributes, listeners, setNodeRef: setDraggableRef, isDragging } = useDraggable({
    id: note.id,
    data: { note, type: 'note', depth }
  })

  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: note.id,
    data: { note, type: 'note', depth }
  })

  return (
    <div
      ref={setDroppableRef}
      className={cn(
        "rounded-lg transition-all duration-200",
        isOver && "bg-accent/30 ring-2 ring-primary ring-offset-2",
        isDragging && "opacity-50 scale-95"
      )}
    >
      <div ref={setDraggableRef} {...listeners} {...attributes}>
        <NoteItem 
          note={note} 
          depth={depth} 
          onEdit={onEdit} 
          onAddChild={onAddChild} 
          renderChildren={false} // Handle recursion manually
          isExpanded={isExpanded}
          onToggleExpand={() => setIsExpanded(!isExpanded)}
        />
      </div>
      
      {/* Recursive Children */}
      {isExpanded && note.children && note.children.length > 0 && (
        <div className="mt-2 space-y-2">
          {note.children.map((child) => (
            <DraggableNoteItem
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
