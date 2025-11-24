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
    return chat;
  }

  async deleteChat(id: string) {
    const { error } = await this.supabase
      .from('chats')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}
