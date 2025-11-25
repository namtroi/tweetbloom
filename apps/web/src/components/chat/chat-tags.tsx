'use client'

import { TagSelector } from '@/components/tags/tag-selector'
import { useUpdateChat } from '@/hooks/use-chat-mutations'
import type { Tag } from '@/store/use-tag-store'

interface ChatTagsProps {
  chatId: string
  tags: Tag[]
}

export function ChatTags({ chatId, tags }: ChatTagsProps) {
  const updateChatMutation = useUpdateChat()

  const handleTagsChange = async (newTags: Tag[]) => {
    await updateChatMutation.mutateAsync({
      id: chatId,
      data: { tagIds: newTags.map(t => t.id) }
    })
  }

  return (
    <div className="mt-2">
      <TagSelector 
        selectedTags={tags} 
        onTagsChange={handleTagsChange} 
        showLabel={false}
      />
    </div>
  )
}
