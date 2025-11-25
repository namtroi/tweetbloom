'use client'

import { useState } from 'react'
import { Check, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { TagBadge } from './tag-badge'
import { useTags, useCreateTag } from '@/hooks/use-tag-mutations'
import type { Tag } from '@/store/use-tag-store'
import { Loader2 } from 'lucide-react'

interface TagSelectorProps {
  selectedTags: Tag[]
  onTagsChange: (tags: Tag[]) => void
  disabled?: boolean
}

// Predefined colors for new tags
const TAG_COLORS = [
  '#10b981', // green
  '#3b82f6', // blue
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
]

export function TagSelector({ selectedTags, onTagsChange, disabled = false, showLabel = true }: TagSelectorProps & { showLabel?: boolean }) {
  const { data: allTags = [], isLoading } = useTags()
  const createTagMutation = useCreateTag()
  
  const [open, setOpen] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [selectedColor, setSelectedColor] = useState(TAG_COLORS[0])

  const selectedTagIds = selectedTags.map(t => t.id)
  const availableTags = allTags.filter(t => !selectedTagIds.includes(t.id))

  const handleToggleTag = (tag: Tag) => {
    const isSelected = selectedTagIds.includes(tag.id)
    
    if (isSelected) {
      onTagsChange(selectedTags.filter(t => t.id !== tag.id))
    } else {
      onTagsChange([...selectedTags, tag])
    }
  }

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return

    try {
      const newTag = await createTagMutation.mutateAsync({
        name: newTagName.trim(),
        color: selectedColor,
      })

      // Auto-select the new tag
      onTagsChange([...selectedTags, newTag])
      
      setNewTagName('')
      setSelectedColor(TAG_COLORS[0])
    } catch (error) {
      // Error handled by mutation
    }
  }

  return (
    <div className="space-y-2">
      {showLabel && <Label>Tags</Label>}
      
      {/* Selected Tags */}
      <div className="flex flex-wrap gap-2">
        {selectedTags.map((tag) => (
          <TagBadge
            key={tag.id}
            tag={tag}
            removable
            onRemove={() => handleToggleTag(tag)}
          />
        ))}
        
        {/* Add Tag Button */}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-6"
              disabled={disabled}
            >
              <Plus className="mr-1 h-3 w-3" />
              Add Tag
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="start">
            <div className="space-y-4">
              <h4 className="font-medium text-sm">Select or Create Tag</h4>
              
              {/* Existing Tags */}
              {isLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              ) : availableTags.length > 0 ? (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Existing Tags</p>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {availableTags.map((tag) => (
                      <button
                        key={tag.id}
                        onClick={() => {
                          handleToggleTag(tag)
                          setOpen(false)
                        }}
                        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
                      >
                        <TagBadge tag={tag} />
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No available tags</p>
              )}

              {/* Create New Tag */}
              <div className="space-y-2 border-t pt-2">
                <p className="text-xs text-muted-foreground">Create New Tag</p>
                <Input
                  placeholder="Tag name"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleCreateTag()
                    }
                  }}
                />
                
                {/* Color Picker */}
                <div className="flex gap-2">
                  {TAG_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className="h-6 w-6 rounded-full border-2 transition-transform hover:scale-110"
                      style={{
                        backgroundColor: color,
                        borderColor: selectedColor === color ? color : 'transparent',
                      }}
                    >
                      {selectedColor === color && (
                        <Check className="h-4 w-4 text-white" />
                      )}
                    </button>
                  ))}
                </div>

                <Button
                  size="sm"
                  onClick={handleCreateTag}
                  disabled={!newTagName.trim() || createTagMutation.isPending}
                  className="w-full"
                >
                  {createTagMutation.isPending && (
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  )}
                  Create Tag
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}
