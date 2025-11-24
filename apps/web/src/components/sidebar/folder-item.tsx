'use client'

import { useState } from 'react'
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from '@/components/ui/collapsible'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { ChevronRight, Folder, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ChatItem } from './chat-item'
import { RenameFolderDialog } from './rename-folder-dialog'
import { useDeleteFolder } from '@/hooks/use-folders'
import { useDroppable } from '@dnd-kit/core'

interface Chat {
  id: string
  title: string
  ai_tool: 'GEMINI' | 'CHATGPT' | 'GROK'
  updated_at: string
  folder_id: string | null
}

interface FolderItemProps {
  folder: {
    id: string
    name: string
  }
  chats: Chat[]
}

export function FolderItem({ folder, chats }: FolderItemProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showRenameDialog, setShowRenameDialog] = useState(false)
  const { mutate: deleteFolder } = useDeleteFolder()

  const { setNodeRef, isOver } = useDroppable({
    id: folder.id,
    data: folder
  })

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete folder "${folder.name}"? Chats will be moved to Unorganized.`)) {
      deleteFolder(folder.id)
    }
  }

  return (
    <>
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full space-y-1">
        <div 
          ref={setNodeRef}
          className={cn(
            "flex items-center justify-between group w-full px-2 py-1 rounded-md transition-colors",
            isOver && "bg-accent/50 ring-2 ring-primary/20"
          )}
        >
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="flex-1 justify-start p-2 h-auto font-normal hover:bg-accent hover:text-accent-foreground">
              <ChevronRight className={cn("mr-2 h-4 w-4 transition-transform", isOpen && "rotate-90")} />
              <Folder className="mr-2 h-4 w-4 text-muted-foreground" />
              <span className="truncate">{folder.name}</span>
              <span className="ml-auto text-xs text-muted-foreground">{chats.length}</span>
            </Button>
          </CollapsibleTrigger>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setShowRenameDialog(true)}>
                <Pencil className="mr-2 h-4 w-4" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleDelete} className="text-destructive focus:text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <CollapsibleContent className="space-y-1 pl-4 border-l ml-4 border-border/40">
          {chats.length === 0 ? (
            <div className="text-xs text-muted-foreground px-4 py-2 italic">
              No chats in this folder
            </div>
          ) : (
            chats.map((chat) => (
              <ChatItem key={chat.id} chat={chat} />
            ))
          )}
        </CollapsibleContent>
      </Collapsible>

      <RenameFolderDialog 
        open={showRenameDialog} 
        onOpenChange={setShowRenameDialog} 
        folderId={folder.id} 
        currentName={folder.name} 
      />
    </>
  )
}
