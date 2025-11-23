import { z } from 'zod';

// --- Chat Schemas ---

export const ChatRequestSchema = z.object({
    prompt: z.string().max(150, "Prompt must be 150 words or less").min(1, "Prompt is required"),
    chatId: z.string().uuid().optional(),
    aiTool: z.enum(['GEMINI', 'CHATGPT', 'GROK']).optional(),
    override_ai_check: z.boolean().optional().default(false)
});

export const ChatResponseSchema = z.object({
    status: z.enum(['success', 'suggestion', 'error']),
    content: z.string().optional(), // The AI response or the suggestion
    reasoning: z.string().optional(), // Why it was flagged as bad
    chatId: z.string().uuid(),
    messageId: z.string().uuid().optional()
});

export const ChatEvaluateRequestSchema = z.object({
    chatId: z.string().uuid()
});

export const ChatEvaluateResponseSchema = z.object({
    suggestion: z.string(),
    reasoning: z.string()
});

// --- Note Schemas ---

export const CreateNoteSchema = z.object({
    content: z.string().max(150, "Content must be 150 words or less").min(1, "Content is required"),
    parentId: z.string().uuid().nullable().optional()
});

export const UpdateNoteSchema = z.object({
    content: z.string().max(150).optional(),
    parentId: z.string().uuid().nullable().optional(),
    tagIds: z.array(z.string().uuid()).optional()
});

export const SummarizeChatToNoteSchema = z.object({
    chatId: z.string().uuid()
});

export const SummarizeNotesSchema = z.object({
    noteIds: z.array(z.string().uuid()).max(7, "Max 7 notes").min(2, "Select at least 2 notes")
});

// --- Tag Schemas ---

export const CreateTagSchema = z.object({
    name: z.string().min(1),
    color: z.string().regex(/^#[0-9A-F]{6}$/i, "Invalid hex color")
});

export const UpdateTagSchema = z.object({
    name: z.string().min(1).optional(),
    color: z.string().regex(/^#[0-9A-F]{6}$/i).optional()
});

// --- Settings Schemas ---

export const UpdateSettingsSchema = z.object({
    default_ai_tool: z.enum(['GEMINI', 'CHATGPT', 'GROK'])
});

// --- Folder Schemas ---

export const CreateFolderSchema = z.object({
    name: z.string().min(1)
});

export const UpdateFolderSchema = z.object({
    name: z.string().min(1)
});

export const UpdateChatSchema = z.object({
    title: z.string().optional(),
    folderId: z.string().uuid().nullable().optional(),
    tagIds: z.array(z.string().uuid()).optional()
});

// Export types inferred from Zod schemas
export type ChatRequest = z.infer<typeof ChatRequestSchema>;
export type ChatResponse = z.infer<typeof ChatResponseSchema>;
export type ChatEvaluateRequest = z.infer<typeof ChatEvaluateRequestSchema>;
export type ChatEvaluateResponse = z.infer<typeof ChatEvaluateResponseSchema>;
export type CreateNoteRequest = z.infer<typeof CreateNoteSchema>;
export type UpdateNoteRequest = z.infer<typeof UpdateNoteSchema>;
export type SummarizeChatToNoteRequest = z.infer<typeof SummarizeChatToNoteSchema>;
export type SummarizeNotesRequest = z.infer<typeof SummarizeNotesSchema>;
export type CreateTagRequest = z.infer<typeof CreateTagSchema>;
export type UpdateTagRequest = z.infer<typeof UpdateTagSchema>;
export type UpdateSettingsRequest = z.infer<typeof UpdateSettingsSchema>;
export type CreateFolderRequest = z.infer<typeof CreateFolderSchema>;
export type UpdateFolderRequest = z.infer<typeof UpdateFolderSchema>;
export type UpdateChatRequest = z.infer<typeof UpdateChatSchema>;

export * from './supabase-types';
