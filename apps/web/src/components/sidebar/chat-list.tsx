'use client'

import { useFolders } from '@/hooks/use-folders'
import { useChats } from '@/hooks/use-chats'
import { FolderItem } from './folder-item'
import { ChatItem } from './chat-item'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { FolderPlus } from 'lucide-react'
import { useState } from 'react'
import { CreateFolderDialog } from './create-folder-dialog'

import { 
  DndContext, 
  DragOverlay, 
  useSensor, 
  useSensors, 
  PointerSensor, 
  TouchSensor,
  DragEndEvent,
  DragStartEvent,
  pointerWithin
} from '@dnd-kit/core'
import { useUpdateChat } from '@/hooks/use-chats'

interface Chat {
  id: string
  folder_id: string | null
  title: string
  ai_tool: 'GEMINI' | 'CHATGPT' | 'GROK'
  updated_at: string
}

export function ChatList() {
  const { data: folders, isLoading: isLoadingFolders } = useFolders()
  const { data: chats, isLoading: isLoadingChats } = useChats()
  const [showCreateFolder, setShowCreateFolder] = useState(false)
  const { mutate: updateChat } = useUpdateChat()
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor)
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (over && active.id !== over.id) {
      const folderId = over.id as string
      const isFolder = folders?.some(f => f.id === folderId)

      if (isFolder) {
        updateChat({ 
          id: active.id as string, 
          data: { folderId: folderId } 
        })
      }
    }
  }

  const activeChat = chats?.find((c: Chat) => c.id === activeId)

  if (isLoadingFolders || isLoadingChats) {
    return (
      <div className="space-y-2 p-2">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    )
  }

  // Group chats by folder
  const chatsByFolder: Record<string, Chat[]> = {}
  const unorganizedChats: Chat[] = []

  chats?.forEach((chat: Chat) => {
    if (chat.folder_id) {
      if (!chatsByFolder[chat.folder_id]) {
        chatsByFolder[chat.folder_id] = []
      }
      chatsByFolder[chat.folder_id].push(chat)
    } else {
      unorganizedChats.push(chat)
    }
  })

  return (
    <DndContext 
      sensors={sensors} 
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart} 
      onDragEnd={handleDragEnd}
    >
      <div className="flex-1 overflow-y-auto">
        <div className="px-2 py-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full justify-start text-muted-foreground hover:text-foreground"
            onClick={() => setShowCreateFolder(true)}
          >
            <FolderPlus className="mr-2 h-4 w-4" />
            New Folder
          </Button>
        </div>

        <div className="space-y-1">
          {/* Folders */}
          {folders?.map((folder) => (
            <FolderItem 
              key={folder.id} 
              folder={folder} 
              chats={chatsByFolder[folder.id] || []} 
            />
          ))}

          {/* Unorganized Chats */}
          {unorganizedChats.length > 0 && (
            <div className="pt-2">
              {folders && folders.length > 0 && (
                <div className="px-4 py-1 text-xs font-semibold text-muted-foreground/50 uppercase tracking-wider">
                  Unorganized
                </div>
              )}
              {unorganizedChats.map((chat) => (
                <ChatItem key={chat.id} chat={chat} />
              ))}
            </div>
          )}

          {/* Empty State */}
          {(!folders?.length && !chats?.length) && (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              No chats yet. Start a new conversation!
            </div>
          )}
        </div>

        <CreateFolderDialog 
          open={showCreateFolder} 
          onOpenChange={setShowCreateFolder} 
        />
        
        <DragOverlay>
          {activeId && activeChat ? (
            <ChatItem chat={activeChat} isOverlay />
          ) : null}
        </DragOverlay>
      </div>
    </DndContext>
  )
}
