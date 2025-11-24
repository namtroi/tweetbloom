import { createUserClient } from '../lib/supabase';
import { CreateFolderRequest, UpdateFolderRequest } from '@tweetbloom/types';

export class FolderService {
  constructor(private jwt: string) {}

  private get supabase() {
    return createUserClient(this.jwt);
  }

  async getFolders() {
    const { data, error } = await this.supabase
      .from('folders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async createFolder(data: CreateFolderRequest) {
    // Get user to ensure we insert with user_id (though RLS + default might handle it, explicit is safer if RLS allows)
    // Actually, RLS policy "Users can insert own settings" usually checks auth.uid() = user_id.
    // If the table default for user_id is auth.uid(), we don't need to pass it.
    // Looking at schema: user_id uuid not null references auth.users(id)
    // It doesn't have a default. So we MUST pass user_id, OR the insert policy must attach it?
    // Supabase client with auth header usually lets Postgres `auth.uid()` work.
    // But for `insert`, we usually need to provide the column.
    
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('User not found');

    const { data: folder, error } = await this.supabase
      .from('folders')
      .insert({ 
        name: data.name,
        user_id: user.id
      } as unknown as never)
      .select()
      .single();

    if (error) throw error;
    return folder;
  }

  async updateFolder(id: string, data: UpdateFolderRequest) {
    const { data: folder, error } = await this.supabase
      .from('folders')
      .update({ 
        name: data.name, 
        updated_at: new Date().toISOString() 
      } as unknown as never)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return folder;
  }

  async deleteFolder(id: string) {
    const { error } = await this.supabase
      .from('folders')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}
