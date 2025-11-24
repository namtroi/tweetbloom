/**
 * Message List Component
 * Displays all messages in a chat with auto-scroll and loading states
 */

'use client'

import { useEffect, useRef } from 'react'
import { Loader2 } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { MessageItem } from './message-item'
import type { Message } from '@/store/use-chat-store'

interface MessageListProps {
  messages: Message[]
  isLoading?: boolean
  isEmpty?: boolean
  onAcceptSuggestion?: (content: string) => void
  onEditSuggestion?: (content: string) => void
}

export function MessageList({
  messages,
  isLoading = false,
  isEmpty = false,
  onAcceptSuggestion,
  onEditSuggestion,
}: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Empty state
  if (isEmpty && !isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="text-center space-y-3">
          <div className="mx-auto w-16 h-16 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold">Start a new conversation</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Type your prompt below and let Bloom Buddy help you optimize it!
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Loading skeleton
  if (isLoading && messages.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="space-y-4 w-full max-w-2xl">
          <MessageSkeleton />
          <MessageSkeleton isUser />
          <MessageSkeleton />
        </div>
      </div>
    )
  }

  return (
    <ScrollArea className="h-full">
      <div ref={scrollRef} className="p-4 space-y-6 max-w-4xl mx-auto">
        {messages.map((message) => (
          <MessageItem
            key={message.id}
            message={message}
            onAcceptSuggestion={onAcceptSuggestion}
            onEditSuggestion={onEditSuggestion}
          />
        ))}
        
        {/* Typing indicator */}
        {isLoading && messages.length > 0 && (
          <div className="flex gap-3">
            <div className="h-8 w-8 rounded-full bg-green-600 flex items-center justify-center">
              <Loader2 className="h-4 w-4 text-white animate-spin" />
            </div>
            <div className="flex items-center gap-1 px-4 py-3 rounded-2xl rounded-tl-sm bg-muted">
              <div className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:-0.3s]" />
              <div className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:-0.15s]" />
              <div className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" />
            </div>
          </div>
        )}
        
        {/* Auto-scroll anchor */}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  )
}

// Message skeleton for loading state
function MessageSkeleton({ isUser = false }: { isUser?: boolean }) {
  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : ''}`}>
      {!isUser && <Skeleton className="h-8 w-8 rounded-full" />}
      <div className="space-y-2 max-w-[80%]">
        <Skeleton className="h-4 w-24" />
        <Skeleton className={`h-20 ${isUser ? 'w-64' : 'w-80'} rounded-2xl`} />
      </div>
      {isUser && <Skeleton className="h-8 w-8 rounded-full" />}
    </div>
  )
}
