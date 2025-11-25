'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useChatStore, type AiTool } from '@/store/use-chat-store'
import { TagManager } from '@/components/tags/tag-manager'
import { Settings, Tag, Cpu } from 'lucide-react'

interface SettingsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const selectedAiTool = useChatStore((state) => state.selectedAiTool)
  const setSelectedAiTool = useChatStore((state) => state.setSelectedAiTool)

  const handleAiToolChange = (value: string) => {
    setSelectedAiTool(value as AiTool)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] h-[500px] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Settings
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="general" className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="general">
              <Cpu className="mr-2 h-4 w-4" />
              General
            </TabsTrigger>
            <TabsTrigger value="tags">
              <Tag className="mr-2 h-4 w-4" />
              Tags
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto py-4">
            <TabsContent value="general" className="space-y-4 m-0">
              <div className="space-y-2">
                <Label>Default AI Tool</Label>
                <Select 
                  value={selectedAiTool || 'GEMINI'} 
                  onValueChange={handleAiToolChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select AI Tool" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GEMINI">Google Gemini</SelectItem>
                    <SelectItem value="CHATGPT">ChatGPT (OpenAI)</SelectItem>
                    <SelectItem value="GROK">Grok (xAI)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Choose the default AI model for new chats.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="tags" className="m-0">
              <TagManager />
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
