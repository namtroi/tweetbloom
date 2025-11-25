'use client'

import { useParams } from 'next/navigation'
import { useChatController } from '@/hooks/use-chat-controller'
import { ChatHeader } from '@/components/chat/chat-header'
import { ChatInput } from '@/components/chat/chat-input'
import { MessageList } from '@/components/chat/message-list'
import { NoteEditorModal } from '@/components/notes/note-editor-modal'

export default function ChatDetailPage() {
  const params = useParams()
  const chatId = params.id as string
  
  const {
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
  } = useChatController(chatId)

  return (
    <div className="flex h-full flex-col">
      <ChatHeader 
        title={chat?.title}
        aiTool={chat?.ai_tool}
        responseCount={responseCount}
        chatId={chatId}
        tags={chat?.tags}
        isLoading={isLoadingChat}
      />

      {/* Messages */}
      <div className="flex-1 overflow-hidden">
        <MessageList
          messages={messages}
          isLoading={isSending}
          isEmpty={messages.length === 0}
          onAcceptSuggestion={handleSendMessage}
          onEditSuggestion={setWhatNextPrompt}
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
        showAiToolSelector={false}
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
