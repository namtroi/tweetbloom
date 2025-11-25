import { createUserClient } from '../lib/supabase';
import { UpdateChatRequest } from '@tweetbloom/types';

export class ChatManagementService {
  constructor(private jwt: string) {}

  private get supabase() {
    return createUserClient(this.jwt);
  }

  async updateChat(id: string, data: UpdateChatRequest) {
    const updates: any = { updated_at: new Date().toISOString() };
    
    if (data.title !== undefined) updates.title = data.title;
    if (data.folderId !== undefined) updates.folder_id = data.folderId;

    const { data: chat, error } = await this.supabase
      .from('chats')
      .update(updates as unknown as never)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Handle tags if provided
    if (data.tagIds !== undefined) {
      await this.updateChatTags(id, data.tagIds);
    }

    return chat;
  }

  async deleteChat(id: string) {
    const { error } = await this.supabase
      .from('chats')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Helper: Update chat tags
  private async updateChatTags(chatId: string, tagIds: string[]) {
    // Delete existing tags
    await this.supabase
      .from('chat_tags')
      .delete()
      .eq('chat_id', chatId);

    // Insert new tags
    if (tagIds.length > 0) {
      const tagRecords = tagIds.map(tagId => ({
        chat_id: chatId,
        tag_id: tagId
      }));

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await this.supabase
        .from('chat_tags')
        .insert(tagRecords as any);
    }
  }
}
