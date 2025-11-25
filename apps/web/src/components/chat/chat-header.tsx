'use client'

import { ChatTags } from './chat-tags'
import { Skeleton } from '@/components/ui/skeleton'

interface ChatHeaderProps {
  title?: string
  aiTool?: string
  responseCount: number
  chatId: string
  tags?: any[]
  isLoading?: boolean
}

export function ChatHeader({ 
  title, 
  aiTool, 
  responseCount, 
  chatId, 
  tags = [],
  isLoading = false 
}: ChatHeaderProps) {
  if (isLoading) {
    return (
      <div className="border-b bg-background p-4">
        <div className="mx-auto max-w-3xl space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>
    )
  }

  return (
    <div className="border-b bg-background p-4">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-lg font-semibold">{title || 'Chat'}</h1>
        <p className="text-sm text-muted-foreground">
          Using {aiTool || 'AI'} · {responseCount}/7 responses
        </p>
        <ChatTags chatId={chatId} tags={tags} />
      </div>
    </div>
  )
}
