import { v4 as uuidv4 } from 'uuid';

/**
 * In-Memory Data Store for Testing
 * Simulates Supabase database without requiring a real connection
 */

interface User {
  id: string;
  email: string;
  created_at: string;
}

interface Chat {
  id: string;
  user_id: string;
  title: string;
  ai_tool: 'GEMINI' | 'CHATGPT' | 'GROK';
  folder_id?: string | null;
  created_at: string;
  updated_at: string;
}

interface Message {
  id: string;
  chat_id: string;
  role: 'user' | 'assistant';
  content: string;
  type: 'text' | 'response' | 'suggestion';
  created_at: string;
}

interface Note {
  id: string;
  user_id: string;
  content: string;
  parent_id?: string;
  created_at: string;
  updated_at: string;
}

interface Folder {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

interface Tag {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
}

class InMemoryStore {
  private users: Map<string, User> = new Map();
  private chats: Map<string, Chat> = new Map();
  private messages: Map<string, Message> = new Map();
  private notes: Map<string, Note> = new Map();
  private folders: Map<string, Folder> = new Map();
  private tags: Map<string, Tag> = new Map();

  reset() {
    this.users.clear();
    this.chats.clear();
    this.messages.clear();
    this.notes.clear();
    this.folders.clear();
    this.tags.clear();
  }

  // Users
  createUser(email: string, id?: string): User {
    const user: User = {
      id: id || uuidv4(),
      email,
      created_at: new Date().toISOString(),
    };
    this.users.set(user.id, user);
    return user;
  }

  getUser(id: string): User | undefined {
    return this.users.get(id);
  }

  // Chats
  createChat(data: Omit<Chat, 'id' | 'created_at' | 'updated_at'>): Chat {
    const chat: Chat = {
      id: uuidv4(),
      folder_id: null, // Default to null for nullable fields
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.chats.set(chat.id, chat);
    return chat;
  }

  getChat(id: string): Chat | undefined {
    return this.chats.get(id);
  }

  getChatsByUser(userId: string): Chat[] {
    return Array.from(this.chats.values())
      .filter(chat => chat.user_id === userId)
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  }

  updateChat(id: string, data: Partial<Chat>): Chat | undefined {
    const chat = this.chats.get(id);
    if (!chat) return undefined;
    
    const updated = {
      ...chat,
      ...data,
      updated_at: new Date().toISOString(),
    };
    this.chats.set(id, updated);
    return updated;
  }

  deleteChat(id: string): boolean {
    // Also delete associated messages
    Array.from(this.messages.values())
      .filter(msg => msg.chat_id === id)
      .forEach(msg => this.messages.delete(msg.id));
    
    return this.chats.delete(id);
  }

  // Messages
  createMessage(data: Omit<Message, 'id' | 'created_at'>): Message {
    const message: Message = {
      id: uuidv4(),
      ...data,
      created_at: new Date().toISOString(),
    };
    this.messages.set(message.id, message);
    
    // Update chat's updated_at
    const chat = this.chats.get(data.chat_id);
    if (chat) {
      this.updateChat(chat.id, { updated_at: new Date().toISOString() });
    }
    
    return message;
  }

  getMessagesByChat(chatId: string): Message[] {
    return Array.from(this.messages.values())
      .filter(msg => msg.chat_id === chatId)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }

  // Notes
  createNote(data: Omit<Note, 'id' | 'created_at' | 'updated_at'>): Note {
    const note: Note = {
      id: uuidv4(),
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.notes.set(note.id, note);
    return note;
  }

  getNote(id: string): Note | undefined {
    return this.notes.get(id);
  }

  getNotesByUser(userId: string): Note[] {
    return Array.from(this.notes.values())
      .filter(note => note.user_id === userId);
  }

  updateNote(id: string, data: Partial<Note>): Note | undefined {
    const note = this.notes.get(id);
    if (!note) return undefined;
    
    const updated = {
      ...note,
      ...data,
      updated_at: new Date().toISOString(),
    };
    this.notes.set(id, updated);
    return updated;
  }

  deleteNote(id: string): boolean {
    return this.notes.delete(id);
  }

  // Folders
  createFolder(data: Omit<Folder, 'id' | 'created_at'>): Folder {
    const folder: Folder = {
      id: uuidv4(),
      ...data,
      created_at: new Date().toISOString(),
    };
    this.folders.set(folder.id, folder);
    return folder;
  }

  getFolder(id: string): Folder | undefined {
    return this.folders.get(id);
  }

  getFoldersByUser(userId: string): Folder[] {
    return Array.from(this.folders.values())
      .filter(folder => folder.user_id === userId);
  }

  updateFolder(id: string, data: Partial<Folder>): Folder | undefined {
    const folder = this.folders.get(id);
    if (!folder) return undefined;
    
    const updated = {
      ...folder,
      ...data,
      updated_at: new Date().toISOString(),
    };
    this.folders.set(id, updated);
    return updated;
  }

  deleteFolder(id: string): boolean {
    return this.folders.delete(id);
  }

  // Tags
  createTag(data: Omit<Tag, 'id' | 'created_at'>): Tag {
    const tag: Tag = {
      id: uuidv4(),
      ...data,
      created_at: new Date().toISOString(),
    };
    this.tags.set(tag.id, tag);
    return tag;
  }

  getTag(id: string): Tag | undefined {
    return this.tags.get(id);
  }

  getTagsByUser(userId: string): Tag[] {
    return Array.from(this.tags.values())
      .filter(tag => tag.user_id === userId);
  }

  updateTag(id: string, data: Partial<Tag>): Tag | undefined {
    const tag = this.tags.get(id);
    if (!tag) return undefined;
    
    const updated = {
      ...tag,
      ...data,
    };
    this.tags.set(id, updated);
    return updated;
  }

  deleteTag(id: string): boolean {
    return this.tags.delete(id);
  }
}

// Singleton instance for tests
export const testStore = new InMemoryStore();
