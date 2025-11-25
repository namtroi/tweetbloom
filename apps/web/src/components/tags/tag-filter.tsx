'use client'

import { useTagStore } from '@/store/use-tag-store'
import { useTags } from '@/hooks/use-tag-mutations'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Filter, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export function TagFilter() {
  const { data: tags = [] } = useTags()
  const selectedTagFilter = useTagStore((state) => state.selectedTagFilter)
  const toggleTagFilter = useTagStore((state) => state.toggleTagFilter)
  const clearFilters = useTagStore((state) => state.clearFilters)

  if (tags.length === 0) return null

  return (
    <div className="flex flex-col gap-2 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Filter className="h-4 w-4" />
          <span>Filter by Tags</span>
        </div>
        
        {selectedTagFilter.length > 0 && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearFilters}
            className="h-6 px-2 text-xs"
          >
            <X className="mr-1 h-3 w-3" />
            Clear
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => {
          const isSelected = selectedTagFilter.includes(tag.id)
          return (
            <Badge
              key={tag.id}
              variant={isSelected ? 'default' : 'outline'}
              className={cn(
                'cursor-pointer transition-all hover:opacity-80',
                !isSelected && 'opacity-60 hover:opacity-100'
              )}
              style={{
                backgroundColor: isSelected ? tag.color : 'transparent',
                borderColor: tag.color,
                color: isSelected ? '#fff' : tag.color,
              }}
              onClick={() => toggleTagFilter(tag.id)}
            >
              {tag.name}
            </Badge>
          )
        })}
      </div>
    </div>
  )
}
