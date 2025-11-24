import { createUserClient } from '../lib/supabase';

export interface CreateNoteRequest {
  content: string;
  parentId?: string | null;
}

export interface UpdateNoteRequest {
  content?: string;
  parentId?: string | null;
  tagIds?: string[];
}

export class NoteService {
  constructor(private jwt: string) {}

  private get supabase() {
    return createUserClient(this.jwt);
  }

  async getNotes() {
    const { data, error } = await this.supabase
      .from('notes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async createNote(data: CreateNoteRequest) {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('User not found');

    // Validate depth if parentId is provided
    if (data.parentId) {
      const depth = await this.calculateDepth(data.parentId);
      if (depth >= 3) {
        throw new Error('Cannot create note: parent is already at maximum depth (3 levels)');
      }
    }

    const { data: note, error } = await this.supabase
      .from('notes')
      .insert({ 
        content: data.content,
        parent_id: data.parentId || null,
        user_id: user.id
      } as unknown as never)
      .select()
      .single();

    if (error) throw error;
    return note;
  }

  async updateNote(id: string, data: UpdateNoteRequest) {
    // Validate depth if changing parent
    if (data.parentId !== undefined && data.parentId !== null) {
      const depth = await this.calculateDepth(data.parentId);
      if (depth >= 3) {
        throw new Error('Cannot move note: target parent is already at maximum depth (3 levels)');
      }
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    };

    if (data.content !== undefined) {
      updateData.content = data.content;
    }

    if (data.parentId !== undefined) {
      updateData.parent_id = data.parentId;
    }

    const { data: note, error } = await this.supabase
      .from('notes')
      .update(updateData as never)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Handle tags if provided
    if (data.tagIds !== undefined) {
      await this.updateNoteTags(id, data.tagIds);
    }

    return note;
  }

  async deleteNote(id: string) {
    // Cascade delete is handled by DB (ON DELETE CASCADE)
    const { error } = await this.supabase
      .from('notes')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Helper: Calculate depth of a note
  private async calculateDepth(noteId: string): Promise<number> {
    let depth = 1;
    let currentId: string | null = noteId;

    while (currentId) {
      const { data, error } = await this.supabase
        .from('notes')
        .select('parent_id')
        .eq('id', currentId)
        .single();

      if (error || !data) break;

      const noteData = data as { parent_id: string | null };

      if (noteData.parent_id) {
        depth++;
        currentId = noteData.parent_id;
      } else {
        break;
      }
    }

    return depth;
  }

  // Helper: Update note tags (for future tag implementation)
  private async updateNoteTags(noteId: string, tagIds: string[]) {
    // Delete existing tags
    await this.supabase
      .from('note_tags')
      .delete()
      .eq('note_id', noteId);

    // Insert new tags
    if (tagIds.length > 0) {
      const tagRecords = tagIds.map(tagId => ({
        note_id: noteId,
        tag_id: tagId
      }));

      await this.supabase
        .from('note_tags')
        .insert(tagRecords as never);
    }
  }
}
