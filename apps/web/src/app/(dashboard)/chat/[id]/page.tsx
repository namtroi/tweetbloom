/**
 * Dynamic Chat Page - For existing chats
 * Loads chat history and continues conversation
 */

'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useChatStore, messageRowToMessage } from '@/store/use-chat-store'
import { useSendMessage, useEvaluateChat, useContinueChat } from '@/hooks/use-chat-mutations'
import { useSummarizeChat } from '@/hooks/use-note-mutations'
import { ChatInput } from '@/components/chat/chat-input'
import { MessageList } from '@/components/chat/message-list'
import { NoteEditorModal } from '@/components/notes/note-editor-modal'
import { fetchChat } from '@/lib/api/chat'
import type { AiTool } from '@/store/use-chat-store'
import type { Note } from '@/store/use-note-store'
import { Skeleton } from '@/components/ui/skeleton'
import { ChatTags } from '@/components/chat/chat-tags'

export default function ChatDetailPage() {
  const params = useParams()
  const router = useRouter()
  const chatId = params.id as string
  
  const { 
    messages, 
    isLoading: isSending, 
    setCurrentChat,
    setMessages,
    setSelectedAiTool,
  } = useChatStore()
  
  const sendMessageMutation = useSendMessage()
  const evaluateChatMutation = useEvaluateChat()
  const continueChatMutation = useContinueChat()
  
  const [whatNextPrompt, setWhatNextPrompt] = useState<string | undefined>()

  // Fetch chat data
  const { data: chat, isLoading: isLoadingChat } = useQuery({
    queryKey: ['chat', chatId],
    queryFn: () => fetchChat(chatId),
    enabled: !!chatId,
  })

  // Load chat messages into store
  useEffect(() => {
    if (chat) {
      setCurrentChat(chat.id)
      setSelectedAiTool(chat.ai_tool as AiTool)
      
      // Convert and set messages
      if (chat.messages) {
        const convertedMessages = chat.messages.map((msg: any) => 
          messageRowToMessage(msg, chat.ai_tool as AiTool)
        )
        setMessages(convertedMessages)
      }
    }
  }, [chat, setCurrentChat, setMessages, setSelectedAiTool])

  // Count assistant responses (not suggestions)
  const responseCount = messages.filter(
    (m) => m.role === 'assistant' && m.type === 'response'
  ).length

  const hasReachedLimit = responseCount >= 7
  const showWhatNext = responseCount > 0 && !hasReachedLimit

  const handleSendMessage = async (prompt: string) => {
    setWhatNextPrompt(undefined)
    
    await sendMessageMutation.mutateAsync({
      prompt,
      chatId,
    })
  }

  const handleAcceptSuggestion = async (content: string) => {
    await handleSendMessage(content)
  }

  const handleEditSuggestion = (content: string) => {
    setWhatNextPrompt(content)
  }

  const handleWhatNext = async () => {
    const lastResponse = messages
      .filter((m) => m.role === 'assistant' && m.type === 'response')
      .pop()
    
    if (!lastResponse) return

    const result = await evaluateChatMutation.mutateAsync({
      chatId,
      messageId: lastResponse.id,
    })

    if (result) {
      setWhatNextPrompt(result.new_prompt)
    }
  }

  const handleContinueChat = async () => {
    const result = await continueChatMutation.mutateAsync(chatId)

    if (result) {
      // Navigate to new chat (prompt is stored in localStorage by the mutation)
      router.push('/chat')
    }
  }

  // Save as Note functionality
  const summarizeChatMutation = useSummarizeChat()
  const [noteEditorOpen, setNoteEditorOpen] = useState(false)
  const [summarizedNote, setSummarizedNote] = useState<Note | null>(null)
  const [savingNoteId, setSavingNoteId] = useState<string | null>(null)

  const handleSaveAsNote = async (messageId: string) => {
    setSavingNoteId(messageId)
    
    try {
      const note = await summarizeChatMutation.mutateAsync(chatId)
      
      if (note) {
        setSummarizedNote(note)
        setNoteEditorOpen(true)
      }
    } finally {
      setSavingNoteId(null)
    }
  }

  const handleCloseNoteEditor = () => {
    setNoteEditorOpen(false)
    setSummarizedNote(null)
  }

  // Loading state
  if (isLoadingChat) {
    return (
      <div className="flex h-full flex-col">
        <div className="border-b bg-background p-4">
          <div className="mx-auto max-w-3xl space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <div className="flex-1 p-4">
          <div className="mx-auto max-w-3xl space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-3/4 ml-auto" />
            <Skeleton className="h-20 w-full" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b bg-background p-4">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-lg font-semibold">{chat?.title || 'Chat'}</h1>
          <p className="text-sm text-muted-foreground">
            Using {chat?.ai_tool || 'AI'} · {responseCount}/7 responses
          </p>
          {chat && (
            <ChatTags chatId={chat.id} tags={chat.tags || []} />
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-hidden">
        <MessageList
          messages={messages}
          isLoading={isSending}
          isEmpty={messages.length === 0}
          onAcceptSuggestion={handleAcceptSuggestion}
          onEditSuggestion={handleEditSuggestion}
          onSaveAsNote={handleSaveAsNote}
          savingNoteId={savingNoteId}
        />
      </div>

      {/* Input */}
      <ChatInput
        onSubmit={handleSendMessage}
        onEvaluate={handleWhatNext}
        onContinue={handleContinueChat}
        disabled={isSending}
        showAiToolSelector={false} // AI tool is locked for existing chats
        showWhatNext={showWhatNext}
        showContinue={hasReachedLimit}
        prefilledValue={whatNextPrompt}
      />

      {/* Note Editor Modal */}
      <NoteEditorModal
        open={noteEditorOpen}
        onOpenChange={handleCloseNoteEditor}
        note={summarizedNote}
      />
    </div>
  )
}
