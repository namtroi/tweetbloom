'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { 
  DndContext, 
  DragOverlay, 
  useSensor, 
  useSensors, 
  PointerSensor, 
  closestCenter, 
  DragEndEvent,
  useDroppable
} from '@dnd-kit/core'
import { DraggableNoteItem } from './draggable-note-item'
import { NoteItem } from './note-item'
import { type Note } from '@/store/use-note-store'
import { useUpdateNote } from '@/hooks/use-note-mutations'
import { toast } from 'sonner'

interface NoteTreeDndProps {
  notes: (Note & { children?: Note[] })[]
  onEdit: (note: Note) => void
  onAddChild: (parentId: string) => void
}

export function NoteTreeDnd({ notes, onEdit, onAddChild }: NoteTreeDndProps) {
  const updateNoteMutation = useUpdateNote()
  const [activeNote, setActiveNote] = useState<Note | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement to start drag
      },
    })
  )

  const { setNodeRef: setRootRef, isOver: isOverRoot } = useDroppable({
    id: 'root',
  })

  const handleDragStart = (event: any) => {
    setActiveNote(event.active.data.current?.note || null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveNote(null)

    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    if (activeId === overId) return

    // Determine new parent
    // If dropped on 'root' (the container background), parent is null
    // If dropped on another note, parent is that note
    const newParentId = overId === 'root' ? null : overId

    // Optimistic check? 
    // Ideally we should check for circular dependency here (is overId a child of activeId?)
    // But backend will fail if so.

    updateNoteMutation.mutate({
      id: activeId,
      data: { parentId: newParentId }
    })
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div 
        ref={setRootRef}
        className={`min-h-[200px] space-y-2 rounded-lg p-2 transition-colors ${
          isOverRoot ? 'bg-muted/30' : ''
        }`}
      >
        {notes.map((note) => (
          <DraggableNoteItem
            key={note.id}
            note={note}
            depth={1}
            onEdit={onEdit}
            onAddChild={onAddChild}
          />
        ))}
        
        {/* Empty state hint if no notes */}
        {notes.length === 0 && (
          <div className="flex h-32 items-center justify-center text-sm text-muted-foreground border-2 border-dashed rounded-lg">
            Drop notes here to move to root
          </div>
        )}
      </div>

      {typeof document !== 'undefined' && createPortal(
        <DragOverlay>
          {activeNote ? (
            <div className="opacity-80">
               <NoteItem 
                 note={activeNote} 
                 depth={1} 
                 onEdit={() => {}} 
                 onAddChild={() => {}} 
                 renderChildren={false}
               />
            </div>
          ) : null}
        </DragOverlay>,
        document.body
      )}
    </DndContext>
  )
}
