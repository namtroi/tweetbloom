'use client'

import { X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Tag } from '@/store/use-tag-store'

interface TagBadgeProps {
  tag: Tag
  onRemove?: () => void
  removable?: boolean
  className?: string
}

export function TagBadge({ tag, onRemove, removable = false, className }: TagBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'gap-1 pr-1',
        className
      )}
      style={{
        borderColor: tag.color,
        color: tag.color,
        backgroundColor: `${tag.color}10`, // 10% opacity
      }}
    >
      <span>{tag.name}</span>
      {removable && onRemove && (
        <Button
          variant="ghost"
          size="sm"
          className="h-4 w-4 p-0 hover:bg-transparent"
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </Badge>
  )
}
