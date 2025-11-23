import { z } from 'zod';

/**
 * Database row schemas for runtime validation
 * These schemas validate data returned from Supabase to ensure type safety
 */

/**
 * Chat row schema
 */
export const ChatRowSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  folder_id: z.string().uuid().nullable(),
  title: z.string(),
  ai_tool: z.enum(['GEMINI', 'CHATGPT', 'GROK']),
  created_at: z.string(), // ISO timestamp
  updated_at: z.string(), // ISO timestamp
});

/**
 * Message row schema
 */
export const MessageRowSchema = z.object({
  id: z.string().uuid(),
  chat_id: z.string().uuid(),
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
  type: z.enum(['text', 'suggestion', 'response']),
  metadata: z.record(z.string(), z.any()).optional(),
  created_at: z.string(), // ISO timestamp
});

/**
 * Note row schema
 */
export const NoteRowSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  parent_id: z.string().uuid().nullable(),
  content: z.string(),
  created_at: z.string(), // ISO timestamp
  updated_at: z.string(), // ISO timestamp
});

/**
 * Tag row schema
 */
export const TagRowSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  name: z.string(),
  color: z.string(), // Hex color
  created_at: z.string(), // ISO timestamp
});

/**
 * Folder row schema
 */
export const FolderRowSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  name: z.string(),
  created_at: z.string(), // ISO timestamp
  updated_at: z.string(), // ISO timestamp
});

/**
 * User settings row schema
 */
export const UserSettingsRowSchema = z.object({
  user_id: z.string().uuid(),
  default_ai_tool: z.enum(['GEMINI', 'CHATGPT', 'GROK']),
  created_at: z.string(), // ISO timestamp
  updated_at: z.string(), // ISO timestamp
});

/**
 * Type exports
 */
export type ChatRow = z.infer<typeof ChatRowSchema>;
export type MessageRow = z.infer<typeof MessageRowSchema>;
export type NoteRow = z.infer<typeof NoteRowSchema>;
export type TagRow = z.infer<typeof TagRowSchema>;
export type FolderRow = z.infer<typeof FolderRowSchema>;
export type UserSettingsRow = z.infer<typeof UserSettingsRowSchema>;
