/**
 * Message Item Component
 * Displays different message types: user, assistant, suggestion
 */

'use client'

import { motion } from 'framer-motion'
import { Sparkles, Copy, Check, Edit, ThumbsUp, FileText, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { formatRelativeTime } from '@/lib/utils/text'
import type { Message } from '@/store/use-chat-store'

interface MessageItemProps {
  message: Message
  onAcceptSuggestion?: (content: string) => void
  onEditSuggestion?: (content: string) => void
  onSaveAsNote?: () => void
  showActions?: boolean
  isSavingNote?: boolean
}

// Helper function to get AI display name
function getAiDisplayName(aiTool?: string): string {
  if (!aiTool) return 'Bloom Buddy'
  
  const nameMap: Record<string, string> = {
    'GEMINI': 'Gemini',
    'CHATGPT': 'ChatGPT',
    'GROK': 'Grok',
  }
  
  return nameMap[aiTool] || 'Bloom Buddy'
}

export function MessageItem({
  message,
  onAcceptSuggestion,
  onEditSuggestion,
  onSaveAsNote,
  showActions = true,
  isSavingNote = false,
}: MessageItemProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  
  // Get AI name for display
  const aiName = message.type === 'suggestion' 
    ? 'Bloom Buddy' 
    : getAiDisplayName(message.aiTool)

  // User Message
  if (message.role === 'user') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex justify-end gap-3"
      >
        <div className="max-w-[80%] space-y-1">
          <div className="rounded-2xl rounded-tr-sm bg-primary px-4 py-3 text-primary-foreground">
            <p className="whitespace-pre-wrap text-sm">{message.content}</p>
          </div>
          <p className="px-2 text-xs text-muted-foreground text-right">
            {formatRelativeTime(message.createdAt)}
          </p>
        </div>
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-primary text-primary-foreground text-xs">
            You
          </AvatarFallback>
        </Avatar>
      </motion.div>
    )
  }

  // Suggestion Message
  if (message.type === 'suggestion') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex gap-3"
      >
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-green-600 text-white">
            <Sparkles className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
        <div className="max-w-[80%] space-y-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-green-600">Bloom Buddy</span>
              <span className="text-xs text-muted-foreground">
                {formatRelativeTime(message.createdAt)}
              </span>
            </div>
            <div className="rounded-2xl rounded-tl-sm border-2 border-green-600/20 bg-green-50 dark:bg-green-950/20 px-4 py-3">
              <div className="mb-2 flex items-center gap-2 text-xs font-medium text-green-600">
                <Sparkles className="h-3 w-3" />
                <span>I suggest a better prompt:</span>
              </div>
              <p className="whitespace-pre-wrap text-sm">{message.content}</p>
              {message.metadata?.reasoning && (
                <p className="mt-2 text-xs text-muted-foreground italic">
                  {message.metadata.reasoning}
                </p>
              )}
            </div>
          </div>
          
          {/* Action Buttons */}
          {showActions && (
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => onAcceptSuggestion?.(message.content)}
                className="flex-1"
              >
                <ThumbsUp className="mr-2 h-3 w-3" />
                Accept
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onEditSuggestion?.(message.content)}
                className="flex-1"
              >
                <Edit className="mr-2 h-3 w-3" />
                Edit
              </Button>
            </div>
          )}
        </div>
      </motion.div>
    )
  }

  // Assistant Response Message
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex gap-3"
    >
      <Avatar className="h-8 w-8">
        <AvatarFallback className="bg-green-600 text-white">
          <Sparkles className="h-4 w-4" />
        </AvatarFallback>
      </Avatar>
      <div className="max-w-[80%] space-y-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-green-600">{aiName}</span>
            <span className="text-xs text-muted-foreground">
              {formatRelativeTime(message.createdAt)}
            </span>
          </div>
          <div className="rounded-2xl rounded-tl-sm bg-muted px-4 py-3">
            <p className="whitespace-pre-wrap text-sm">{message.content}</p>
          </div>
        </div>
        
        {/* Action Buttons */}
        {showActions && (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCopy}
              className="h-8"
            >
              {copied ? (
                <>
                  <Check className="mr-2 h-3 w-3" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-3 w-3" />
                  Copy
                </>
              )}
            </Button>
            
            {/* Save as Note button */}
            <Button
              size="sm"
              variant="ghost"
              onClick={onSaveAsNote}
              disabled={isSavingNote}
              className="h-8"
            >
              {isSavingNote ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-3 w-3" />
                  Save as Note
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  )
}
