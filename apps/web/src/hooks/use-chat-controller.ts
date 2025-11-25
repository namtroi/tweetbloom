import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useChatStore, messageRowToMessage, type AiTool } from '@/store/use-chat-store'
import { useSendMessage, useEvaluateChat, useContinueChat } from '@/hooks/use-chat-mutations'
import { useSummarizeChat } from '@/hooks/use-note-mutations'
import { fetchChat } from '@/lib/api/chat'
import type { Note } from '@/store/use-note-store'

export function useChatController(chatId: string) {
  const router = useRouter()
  
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
  const summarizeChatMutation = useSummarizeChat()
  
  const [whatNextPrompt, setWhatNextPrompt] = useState<string | undefined>()
  const [noteEditorOpen, setNoteEditorOpen] = useState(false)
  const [summarizedNote, setSummarizedNote] = useState<Note | null>(null)
  const [savingNoteId, setSavingNoteId] = useState<string | null>(null)

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
      
      if (chat.messages) {
        const convertedMessages = chat.messages.map((msg: any) => 
          messageRowToMessage(msg, chat.ai_tool as AiTool)
        )
        setMessages(convertedMessages)
      }
    }
  }, [chat, setCurrentChat, setMessages, setSelectedAiTool])

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
      router.push('/chat')
    }
  }

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

  return {
    chat,
    messages,
    isSending,
    isLoadingChat,
    responseCount,
    hasReachedLimit,
    showWhatNext,
    whatNextPrompt,
    setWhatNextPrompt,
    noteEditorOpen,
    summarizedNote,
    savingNoteId,
    handleSendMessage,
    handleWhatNext,
    handleContinueChat,
    handleSaveAsNote,
    handleCloseNoteEditor,
  }
}
