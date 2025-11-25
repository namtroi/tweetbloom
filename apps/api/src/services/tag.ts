import { createUserClient } from '../lib/supabase';

export interface CreateTagRequest {
  name: string;
  color: string;
}

export interface UpdateTagRequest {
  name?: string;
  color?: string;
}

export class TagService {
  constructor(private jwt: string) {}

  private get supabase() {
    return createUserClient(this.jwt);
  }

  async getTags() {
    const { data, error } = await this.supabase
      .from('tags')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return data;
  }

  async createTag(data: CreateTagRequest) {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('User not found');

    const { data: tag, error } = await this.supabase
      .from('tags')
      .insert({ 
        name: data.name,
        color: data.color,
        user_id: user.id
      } as unknown as never)
      .select()
      .single();

    if (error) throw error;
    return tag;
  }

  async updateTag(id: string, data: UpdateTagRequest) {
    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.color !== undefined) updateData.color = data.color;

    const { data: tag, error } = await this.supabase
      .from('tags')
      .update(updateData as never)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return tag;
  }

  async deleteTag(id: string) {
    const { error } = await this.supabase
      .from('tags')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}
