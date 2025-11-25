/**
 * Chat Page - Main chat interface
 * Handles Flow 1, 2, and 3
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useChatStore } from '@/store/use-chat-store'
import { useSendMessage, useEvaluateChat, useContinueChat } from '@/hooks/use-chat-mutations'
import { ChatInput } from '@/components/chat/chat-input'
import { MessageList } from '@/components/chat/message-list'
import type { AiTool } from '@/store/use-chat-store'

export default function ChatPage() {
  const router = useRouter()
  const { 
    messages, 
    isLoading, 
    currentChatId,
    setCurrentChat,
    clearMessages,
  } = useChatStore()
  
  const sendMessageMutation = useSendMessage()
  const evaluateChatMutation = useEvaluateChat()
  const continueChatMutation = useContinueChat()
  
  const [whatNextPrompt, setWhatNextPrompt] = useState<string | undefined>()
  const [continuePrompt, setContinuePrompt] = useState<string | undefined>()

  // Reset chat state on mount (new chat)
  useEffect(() => {
    setCurrentChat(null)
    clearMessages()
    
    // Check if there's a continue chat prompt in localStorage
    const storedPrompt = localStorage.getItem('continue_chat_prompt')
    if (storedPrompt) {
      setContinuePrompt(storedPrompt)
      // Clear it immediately after reading
      localStorage.removeItem('continue_chat_prompt')
    }
  }, [setCurrentChat, clearMessages])

  // Count assistant responses (not suggestions)
  const responseCount = messages.filter(
    (m) => m.role === 'assistant' && m.type === 'response'
  ).length

  const hasReachedLimit = responseCount >= 7
  const showWhatNext = responseCount > 0 && !hasReachedLimit

  const handleSendMessage = async (prompt: string, aiTool?: AiTool) => {
    setWhatNextPrompt(undefined) // Clear any "What Next?" suggestion
    setContinuePrompt(undefined) // Clear any "Continue Chat" prompt
    
    await sendMessageMutation.mutateAsync({
      prompt,
      chatId: currentChatId || undefined,
      aiTool,
    })
  }

  const handleAcceptSuggestion = async (content: string) => {
    // Send the suggestion as a new message
    await handleSendMessage(content)
  }

  const handleEditSuggestion = (content: string) => {
    // Pre-fill input with suggestion for editing
    setWhatNextPrompt(content)
  }

  const handleWhatNext = async () => {
    if (!currentChatId) {
      return;
    }

    const lastResponse = messages
      .filter((m) => m.role === 'assistant' && m.type === 'response')
      .pop();
    
    if (!lastResponse) {
      return;
    }

    try {
      const result = await evaluateChatMutation.mutateAsync({
        chatId: currentChatId,
        messageId: lastResponse.id,
      });

      if (result) {
        setWhatNextPrompt(result.new_prompt);
      }
    } catch (error) {
      console.error('❌ Mutation error:', error);
    }
  }

  const handleContinueChat = async () => {
    if (!currentChatId) return

    const result = await continueChatMutation.mutateAsync(currentChatId)

    if (result) {
      // Navigate to new chat with prefilled prompt
      router.push('/chat')
      setContinuePrompt(result.new_prompt)
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b bg-background p-4">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-lg font-semibold">New Chat</h1>
          <p className="text-sm text-muted-foreground">
            Start a conversation with Bloom Buddy
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-hidden">
        <MessageList
          messages={messages}
          isLoading={isLoading}
          isEmpty={messages.length === 0}
          onAcceptSuggestion={handleAcceptSuggestion}
          onEditSuggestion={handleEditSuggestion}
        />
      </div>

      {/* Input */}
      <ChatInput
        onSubmit={handleSendMessage}
        onEvaluate={handleWhatNext}
        onContinue={handleContinueChat}
        disabled={isLoading}
        showAiToolSelector={!currentChatId} // Only show for new chats
        showWhatNext={showWhatNext}
        showContinue={hasReachedLimit}
        prefilledValue={whatNextPrompt || continuePrompt}
      />
    </div>
  )
}
