/**
 * Chat Input Component
 * Handles user input with word/character counter and AI tool selection
 */

'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { countWords, countChars } from '@/lib/utils/text'
import { validatePrompt } from '@/lib/utils/validation'
import { useChatStore, type AiTool } from '@/store/use-chat-store'

interface ChatInputProps {
  onSubmit: (prompt: string, aiTool?: AiTool) => void
  onEvaluate?: () => void
  onContinue?: () => void
  disabled?: boolean
  placeholder?: string
  showAiToolSelector?: boolean
  showWhatNext?: boolean
  showContinue?: boolean
  prefilledValue?: string
}

export function ChatInput({
  onSubmit,
  onEvaluate,
  onContinue,
  disabled = false,
  placeholder = 'Type your prompt here...',
  showAiToolSelector = false,
  showWhatNext = false,
  showContinue = false,
  prefilledValue,
}: ChatInputProps) {
  const [value, setValue] = useState('')
  const [selectedTool, setSelectedTool] = useState<AiTool>('GEMINI')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { isLoading, selectedAiTool, setSelectedAiTool } = useChatStore()

  // Handle prefilled value
  useEffect(() => {
    if (prefilledValue) {
      setValue(prefilledValue)
      // Focus textarea
      textareaRef.current?.focus()
    }
  }, [prefilledValue])

  // Sync selected tool with store
  useEffect(() => {
    if (selectedAiTool) {
      setSelectedTool(selectedAiTool)
    }
  }, [selectedAiTool])

  const wordCount = countWords(value)
  const charCount = countChars(value)
  const validation = validatePrompt(value)

  const isValid = validation.valid && value.trim().length > 0
  const isOverLimit = !validation.valid && value.trim().length > 0

  const handleSubmit = () => {
    if (!isValid || disabled || isLoading) return

    onSubmit(value.trim(), showAiToolSelector ? selectedTool : undefined)
    setValue('')
    
    // Save selected tool to store if it's a new chat
    if (showAiToolSelector) {
      setSelectedAiTool(selectedTool)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleToolChange = (tool: string) => {
    setSelectedTool(tool as AiTool)
  }

  // Show Continue Chat button instead of input
  if (showContinue) {
    return (
      <div className="border-t bg-background p-4">
        <div className="mx-auto max-w-3xl">
          <div className="mb-4 text-center text-sm text-muted-foreground">
            This chat has reached the 7-message limit.
          </div>
          <Button
            onClick={onContinue}
            disabled={disabled || isLoading}
            className="w-full"
            size="lg"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Continue Chat
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="border-t bg-background p-4">
      <div className="mx-auto max-w-3xl space-y-3">
        {/* AI Tool Selector (only for new chats) */}
        {showAiToolSelector && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">AI Tool:</span>
            <Select value={selectedTool} onValueChange={handleToolChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GEMINI">Gemini</SelectItem>
                <SelectItem value="CHATGPT">ChatGPT</SelectItem>
                <SelectItem value="GROK">Grok</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Input Area */}
        <div className="relative">
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || isLoading}
            className={cn(
              'min-h-[100px] max-h-[200px] resize-none pr-12',
              isOverLimit && 'border-destructive focus-visible:ring-destructive'
            )}
          />
          
          {/* Character/Word Counter */}
          <div
            className={cn(
              'absolute bottom-2 right-2 text-xs',
              isOverLimit ? 'text-destructive font-medium' : 'text-muted-foreground'
            )}
          >
            {wordCount}/150 words · {charCount}/1200 chars
          </div>
        </div>

        {/* Error Message */}
        {isOverLimit && (
          <p className="text-sm text-destructive">{validation.error}</p>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* What Next Button */}
          {showWhatNext && (
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1">
              <Button
                onClick={onEvaluate}
                disabled={disabled || isLoading}
                variant="outline"
                className="w-full"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                What Next?
              </Button>
            </motion.div>
          )}

          {/* Submit Button */}
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className={cn('flex-1', !showWhatNext && 'w-full')}>
            <Button
              onClick={handleSubmit}
              disabled={!isValid || disabled || isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send
                </>
              )}
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
