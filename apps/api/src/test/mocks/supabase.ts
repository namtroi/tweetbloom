import { testStore } from './in-memory-store';

/**
 * Mock Supabase Client for Testing
 * Provides a Supabase-like API that uses in-memory store
 */

interface QueryBuilder {
  select: (columns?: string) => QueryBuilder;
  insert: (data: any) => QueryBuilder;
  update: (data: any) => QueryBuilder;
  delete: () => QueryBuilder;
  eq: (column: string, value: any) => QueryBuilder;
  order: (column: string, options?: any) => QueryBuilder;
  limit: (count: number) => QueryBuilder;
  single: () => Promise<{ data: any; error: null }>;
  then: (resolve: (value: { data: any; error: null }) => void) => Promise<any>;
}

class MockQueryBuilder implements QueryBuilder {
  private table: string;
  private userId: string;
  private hasInsert: boolean = false;
  private hasUpdate: boolean = false;
  private hasDelete: boolean = false;
  private selectColumns: string = '*';
  private insertData: any = null;
  private updateData: any = null;
  private filters: Array<{ column: string; value: any }> = [];
  private orderBy: { column: string; ascending: boolean } = { column: 'created_at', ascending: false };
  private limitCount: number = 1000;
  private singleMode: boolean = false;

  constructor(table: string, userId: string) {
    this.table = table;
    this.userId = userId;
  }

  select(columns: string = '*'): QueryBuilder {
    this.selectColumns = columns;
    return this;
  }

  insert(data: any): QueryBuilder {
    this.hasInsert = true;
    this.insertData = data;
    return this;
  }

  update(data: any): QueryBuilder {
    this.hasUpdate = true;
    this.updateData = data;
    return this;
  }

  delete(): QueryBuilder {
    this.hasDelete = true;
    return this;
  }

  eq(column: string, value: any): QueryBuilder {
    this.filters.push({ column, value });
    return this;
  }

  order(column: string, options: { ascending?: boolean } = {}): QueryBuilder {
    this.orderBy = { column, ascending: options.ascending ?? false };
    return this;
  }

  limit(count: number): QueryBuilder {
    this.limitCount = count;
    return this;
  }

  single(): Promise<{ data: any; error: null }> {
    this.singleMode = true;
    return this.execute();
  }

  then(resolve: (value: { data: any; error: null }) => void): Promise<any> {
    return this.execute().then(resolve);
  }

  private async execute(): Promise<{ data: any; error: null }> {
    try {
      let result: any;

      // Handle insert + select pattern (e.g., .insert().select().single())
      if (this.hasInsert) {
        result = this.handleInsert();
        // If there's a select after insert, return the inserted data
        return { data: result, error: null };
      }

      // Handle update + select pattern
      if (this.hasUpdate) {
        result = this.handleUpdate();
        return { data: result, error: null };
      }

      // Handle delete
      if (this.hasDelete) {
        result = this.handleDelete();
        return { data: result, error: null };
      }

      // Handle pure select
      result = this.handleSelect();
      return { data: result, error: null };
    } catch (error) {
      console.error('Mock query error:', error);
      return { data: null, error: null };
    }
  }

  private handleInsert(): any {
    switch (this.table) {
      case 'chats':
        return testStore.createChat(this.insertData);
      case 'messages':
        return testStore.createMessage(this.insertData);
      case 'notes':
        return testStore.createNote(this.insertData);
      case 'folders':
        return testStore.createFolder(this.insertData);
      case 'tags':
        return testStore.createTag(this.insertData);
      default:
        return { ...this.insertData, id: 'mock-id', created_at: new Date().toISOString() };
    }
  }

  private handleUpdate(): any {
    const idFilter = this.filters.find(f => f.column === 'id');
    if (!idFilter) return null;

    switch (this.table) {
      case 'chats':
        return testStore.updateChat(idFilter.value, this.updateData);
      case 'notes':
        return testStore.updateNote(idFilter.value, this.updateData);
      default:
        return this.updateData;
    }
  }

  private handleDelete(): any {
    const idFilter = this.filters.find(f => f.column === 'id');
    if (!idFilter) return null;

    switch (this.table) {
      case 'chats':
        testStore.deleteChat(idFilter.value);
        break;
      case 'notes':
        testStore.deleteNote(idFilter.value);
        break;
      case 'folders':
        testStore.deleteFolder(idFilter.value);
        break;
      case 'tags':
        testStore.deleteTag(idFilter.value);
        break;
    }

    return null;
  }

  private handleSelect(): any {
    let results: any[] = [];

    switch (this.table) {
      case 'chats': {
        const userFilter = this.filters.find(f => f.column === 'user_id');
        const idFilter = this.filters.find(f => f.column === 'id');
        
        if (idFilter) {
          const chat = testStore.getChat(idFilter.value);
          if (chat) {
            // If selecting with messages, include them
            if (this.selectColumns.includes('messages')) {
              const messages = testStore.getMessagesByChat(chat.id);
              return { ...chat, messages, tags: [], chat_tags: [] };
            }
            return chat;
          }
          return null;
        }
        
        if (userFilter) {
          results = testStore.getChatsByUser(userFilter.value);
        } else {
          // No filter, return all chats for test user
          results = testStore.getChatsByUser('00000000-0000-4000-8000-000000000001');
        }
        break;
      }
      case 'messages': {
        const chatFilter = this.filters.find(f => f.column === 'chat_id');
        if (chatFilter) {
          results = testStore.getMessagesByChat(chatFilter.value);
        }
        break;
      }
      case 'notes': {
        const userFilter = this.filters.find(f => f.column === 'user_id');
        const idFilter = this.filters.find(f => f.column === 'id');
        
        if (idFilter) {
          const note = testStore.getNote(idFilter.value);
          return note || null;
        }
        
        // Simulate RLS: automatically filter by current user if no explicit filter
        const targetUserId = userFilter ? userFilter.value : this.userId;
        results = testStore.getNotesByUser(targetUserId);
        break;
      }
      case 'folders': {
        const userFilter = this.filters.find(f => f.column === 'user_id');
        // Simulate RLS: automatically filter by current user if no explicit filter
        const targetUserId = userFilter ? userFilter.value : this.userId;
        results = testStore.getFoldersByUser(targetUserId);
        break;
      }
      case 'tags': {
        const userFilter = this.filters.find(f => f.column === 'user_id');
        // Simulate RLS: automatically filter by current user if no explicit filter
        const targetUserId = userFilter ? userFilter.value : this.userId;
        results = testStore.getTagsByUser(targetUserId);
        break;
      }
    }

    // Apply ordering
    if (results.length > 0 && this.orderBy.column in results[0]) {
      results.sort((a, b) => {
        const aVal = a[this.orderBy.column];
        const bVal = b[this.orderBy.column];
        const comparison = aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
        return this.orderBy.ascending ? comparison : -comparison;
      });
    }

    // Apply limit
    results = results.slice(0, this.limitCount);

    return this.singleMode ? (results[0] || null) : results;
  }
}

export function createMockSupabaseClient(userId: string) {
  return {
    from: (table: string) => new MockQueryBuilder(table, userId),
    auth: {
      getUser: async () => ({
        data: {
          user: testStore.getUser(userId) || testStore.createUser(`test-${userId}@example.com`, userId),
        },
        error: null,
      }),
    },
  };
}
