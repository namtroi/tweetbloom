'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import { useChats } from '@/hooks/use-chats'
import { useNotes } from '@/hooks/use-note-mutations'
import { useTags } from '@/hooks/use-tag-mutations'
import { type Note } from '@/store/use-note-store'
import { type Tag } from '@/store/use-tag-store'
import { type Chat } from '@/types/chat'
import { MessageSquare, StickyNote, Tag as TagIcon, Search } from 'lucide-react'

export function SearchCommand() {
  const [open, setOpen] = React.useState(false)
  const router = useRouter()

  const { data: chats } = useChats() as { data: Chat[] }
  const { data: notes } = useNotes() as { data: Note[] }
  const { data: tags } = useTags() as { data: Tag[] }

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  const runCommand = React.useCallback((command: () => unknown) => {
    setOpen(false)
    command()
  }, [])

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-2 rounded-md border border-input bg-muted/50 px-3 py-2 text-sm text-muted-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground"
      >
        <Search className="h-4 w-4" />
        <span className="flex-1 text-left">Search...</span>
        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          
          {/* Chats Group */}
          {chats && chats.length > 0 && (
            <CommandGroup heading="Chats">
              {chats.map((chat: any) => (
                <CommandItem
                  key={chat.id}
                  value={`chat ${chat.title}`}
                  onSelect={() => {
                    runCommand(() => router.push(`/chat/${chat.id}`))
                  }}
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  <span>{chat.title || 'Untitled Chat'}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          <CommandSeparator />

          {/* Notes Group */}
          {notes && notes.length > 0 && (
            <CommandGroup heading="Notes">
              {notes.map((note: any) => (
                <CommandItem
                  key={note.id}
                  value={`note ${note.content}`}
                  onSelect={() => {
                    runCommand(() => router.push(`/notes`)) 
                  }}
                >
                  <StickyNote className="mr-2 h-4 w-4" />
                  <span className="truncate">{note.content.substring(0, 50)}...</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          <CommandSeparator />

          {/* Tags Group */}
          {tags && tags.length > 0 && (
            <CommandGroup heading="Tags">
              {tags.map((tag: any) => (
                <CommandItem
                  key={tag.id}
                  value={`tag ${tag.name}`}
                  onSelect={() => {
                    runCommand(() => router.push(`/notes`))
                  }}
                >
                  <TagIcon className="mr-2 h-4 w-4" />
                  <span>{tag.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  )
}
