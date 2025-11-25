"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  MessageSquarePlus,
  LayoutDashboard,
  LogOut,
  Menu,
  StickyNote,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { ChatList } from "@/components/sidebar/chat-list"

import { SettingsModal } from "@/components/settings/settings-modal"
import { Settings } from "lucide-react"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [settingsOpen, setSettingsOpen] = React.useState(false)

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  return (
    <div className={cn("pb-12 flex flex-col h-full", className)}>
      <div className="space-y-4 py-4 flex-1 flex flex-col min-h-0">
        <div className="px-3 py-2 flex-shrink-0">
          <div className="mb-2 px-4 text-lg font-semibold tracking-tight text-primary flex items-center gap-2">
            <LayoutDashboard className="h-5 w-5" />
            TweetBloom
          </div>
          <div className="space-y-1">
            <Button
              variant="default"
              className="w-full justify-start shadow-sm bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => router.push("/chat")}
            >
              <MessageSquarePlus className="mr-2 h-4 w-4" />
              New Chat
            </Button>
          </div>
          
          {/* Navigation Links */}
          <div className="mt-4 space-y-1">
            <Link href="/chat">
              <Button
                variant={pathname.startsWith("/chat") ? "secondary" : "ghost"}
                className="w-full justify-start"
              >
                <MessageSquarePlus className="mr-2 h-4 w-4" />
                Chats
              </Button>
            </Link>
            <Link href="/notes">
              <Button
                variant={pathname.startsWith("/notes") ? "secondary" : "ghost"}
                className="w-full justify-start"
              >
                <StickyNote className="mr-2 h-4 w-4" />
                Notes
              </Button>
            </Link>
          </div>
        </div>
        
        <div className="px-3 py-2 flex-1 flex flex-col min-h-0 overflow-hidden">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight flex-shrink-0">
            History
          </h2>
          <ScrollArea className="flex-1 -mx-2 px-2">
             <ChatList />
          </ScrollArea>
        </div>
      </div>
      <div className="absolute bottom-4 left-4 right-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start pl-0 hover:bg-transparent">
              <Avatar className="h-8 w-8 mr-2">
                <AvatarImage src="/avatars/01.png" alt="@shadcn" />
                <AvatarFallback>TB</AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start text-sm">
                <span className="font-medium">User</span>
                <span className="text-xs text-muted-foreground">user@example.com</span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">User</p>
                <p className="text-xs leading-none text-muted-foreground">
                  user@example.com
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setSettingsOpen(true)}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  )
}

export function MobileSidebar() {
  const [open, setOpen] = React.useState(false)
  const pathname = usePathname()

  React.useEffect(() => {
    setOpen(false)
  }, [pathname])

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0">
        <Sidebar className="h-full" />
      </SheetContent>
    </Sheet>
  )
}
