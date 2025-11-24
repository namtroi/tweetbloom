'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Bot, Sparkles, Zap, MessageSquare, GripVertical } from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils/text'
import { ChatItemMenu } from './chat-item-menu'
import { useState, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { useUpdateChat } from '@/hooks/use-chats'
import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'

interface ChatItemProps {
  chat: {
    id: string
    title: string
    ai_tool: 'GEMINI' | 'CHATGPT' | 'GROK'
    updated_at: string
    folder_id: string | null
  }
  isOverlay?: boolean
}

export function ChatItem({ chat, isOverlay }: ChatItemProps) {
  const params = useParams()
  const isActive = params.id === chat.id
  const [isRenaming, setIsRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState(chat.title)
  const inputRef = useRef<HTMLInputElement>(null)
  const { mutate: updateChat } = useUpdateChat()

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: chat.id,
    data: chat,
    disabled: isRenaming
  })

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  }

  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isRenaming])

  const handleRename = () => {
    if (renameValue.trim() && renameValue !== chat.title) {
      updateChat({ id: chat.id, data: { title: renameValue } })
    }
    setIsRenaming(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRename()
    } else if (e.key === 'Escape') {
      setRenameValue(chat.title)
      setIsRenaming(false)
    }
  }

  const getAiIcon = (tool: string) => {
    switch (tool) {
      case 'GEMINI': return <Sparkles className="h-4 w-4 text-blue-500" />
      case 'CHATGPT': return <Bot className="h-4 w-4 text-green-500" />
      case 'GROK': return <Zap className="h-4 w-4 text-purple-500" />
      default: return <MessageSquare className="h-4 w-4 text-gray-500" />
    }
  }

  if (isRenaming) {
    return (
      <div className="px-2 py-1">
        <Input
          ref={inputRef}
          value={renameValue}
          onChange={(e) => setRenameValue(e.target.value)}
          onBlur={handleRename}
          onKeyDown={handleKeyDown}
          className="h-8 text-sm"
        />
      </div>
    )
  }

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={cn("group relative px-2 py-1", isOverlay && "opacity-100 bg-background border rounded-lg shadow-lg z-50 pointer-events-none")}
      {...attributes}
    >
      <div className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
          isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground",
          isOverlay && "bg-accent text-accent-foreground"
        )}
      >
        {/* Drag Handle - visible on hover */}
        <div 
          className="absolute left-0 top-1/2 -translate-y-1/2 p-1 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing z-10"
          {...listeners}
        >
          <GripVertical className="h-3 w-3 text-muted-foreground/50" />
        </div>

        <Link
          href={`/chat/${chat.id}`}
          className="flex-1 flex items-center gap-3 min-w-0 pl-2"
          onClick={(e) => {
            if (isDragging) e.preventDefault()
          }}
        >
          {getAiIcon(chat.ai_tool)}
          <div className="flex-1 overflow-hidden">
            <div className="truncate">{chat.title}</div>
            <div className="text-[10px] text-muted-foreground/60 truncate">
              {formatRelativeTime(chat.updated_at)}
            </div>
          </div>
        </Link>
      </div>
      
      {!isDragging && !isOverlay && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
          <ChatItemMenu 
            chatId={chat.id} 
            currentFolderId={chat.folder_id}
            onRename={() => setIsRenaming(true)} 
          />
        </div>
      )}
    </div>
  )
}
