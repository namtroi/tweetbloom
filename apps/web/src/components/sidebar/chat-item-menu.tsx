'use client'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { MoreHorizontal, Pencil, Trash2, FolderInput } from 'lucide-react'
import { useDeleteChat, useUpdateChat } from '@/hooks/use-chats'
import { useFolders } from '@/hooks/use-folders'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface ChatItemMenuProps {
  chatId: string
  currentFolderId: string | null
  onRename: () => void
}

export function ChatItemMenu({ chatId, currentFolderId, onRename }: ChatItemMenuProps) {
  const router = useRouter()
  const { mutate: deleteChat } = useDeleteChat()
  const { mutate: updateChat } = useUpdateChat()
  const { data: folders } = useFolders()
  const [open, setOpen] = useState(false)

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this chat?')) {
      deleteChat(chatId)
      router.push('/chat') // Redirect to new chat if deleted
    }
  }

  const handleMoveToFolder = (folderId: string | null) => {
    updateChat({ id: chatId, data: { folderId } })
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()} // Prevent navigation when clicking menu
        >
          <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onRename(); }}>
          <Pencil className="mr-2 h-4 w-4" />
          Rename
        </DropdownMenuItem>
        
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <FolderInput className="mr-2 h-4 w-4" />
            Move to Folder
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-48">
            <DropdownMenuItem 
              onClick={(e) => { e.stopPropagation(); handleMoveToFolder(null); }}
              disabled={currentFolderId === null}
            >
              Unorganized (Root)
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {folders?.map((folder) => (
              <DropdownMenuItem 
                key={folder.id}
                onClick={(e) => { e.stopPropagation(); handleMoveToFolder(folder.id); }}
                disabled={currentFolderId === folder.id}
              >
                {folder.name}
              </DropdownMenuItem>
            ))}
            {folders?.length === 0 && (
              <div className="p-2 text-xs text-muted-foreground text-center">
                No folders created
              </div>
            )}
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={(e) => { e.stopPropagation(); handleDelete(); }}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
