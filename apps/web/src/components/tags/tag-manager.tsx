'use client'

import { useState } from 'react'
import { useTags, useUpdateTag, useDeleteTag } from '@/hooks/use-tag-mutations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Edit2, Trash2, Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const TAG_COLORS = [
  '#ef4444', // red-500
  '#f97316', // orange-500
  '#eab308', // yellow-500
  '#22c55e', // green-500
  '#3b82f6', // blue-500
  '#a855f7', // purple-500
  '#ec4899', // pink-500
]

export function TagManager() {
  const { data: tags, isLoading } = useTags()
  const updateTagMutation = useUpdateTag()
  const deleteTagMutation = useDeleteTag()

  const [editingTagId, setEditingTagId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('')

  const handleEdit = (tag: any) => {
    setEditingTagId(tag.id)
    setEditName(tag.name)
    setEditColor(tag.color)
  }

  const handleCancelEdit = () => {
    setEditingTagId(null)
    setEditName('')
    setEditColor('')
  }

  const handleSaveEdit = async () => {
    if (!editingTagId || !editName.trim()) return

    await updateTagMutation.mutateAsync({
      id: editingTagId,
      data: { name: editName, color: editColor }
    })
    setEditingTagId(null)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this tag? It will be removed from all notes and chats.')) {
      await deleteTagMutation.mutateAsync(id)
    }
  }

  if (isLoading) return <div>Loading tags...</div>

  return (
    <div className="space-y-4">
      <div className="grid gap-4">
        {tags?.map((tag) => (
          <div key={tag.id} className="flex items-center justify-between rounded-lg border p-3">
            {editingTagId === tag.id ? (
              <div className="flex flex-1 items-center gap-2">
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="h-8 flex-1"
                />
                <div className="flex gap-1">
                  {TAG_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setEditColor(color)}
                      className={cn(
                        "h-6 w-6 rounded-full border transition-transform hover:scale-110",
                        editColor === color && "ring-2 ring-primary ring-offset-2"
                      )}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <Button size="sm" onClick={handleSaveEdit} disabled={updateTagMutation.isPending}>
                  <Check className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <div
                    className="h-4 w-4 rounded-full"
                    style={{ backgroundColor: tag.color }}
                  />
                  <span className="font-medium">{tag.name}</span>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => handleEdit(tag)}>
                    <Edit2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(tag.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </>
            )}
          </div>
        ))}

        {tags?.length === 0 && (
          <div className="text-center text-sm text-muted-foreground py-8">
            No tags created yet. Create tags in the Note Editor.
          </div>
        )}
      </div>
    </div>
  )
}
