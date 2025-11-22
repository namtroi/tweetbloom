export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            chats: {
                Row: {
                    id: string
                    user_id: string
                    folder_id: string | null
                    title: string
                    ai_tool: 'GEMINI' | 'CHATGPT' | 'GROK'
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    folder_id?: string | null
                    title: string
                    ai_tool: 'GEMINI' | 'CHATGPT' | 'GROK'
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    folder_id?: string | null
                    title?: string
                    ai_tool?: 'GEMINI' | 'CHATGPT' | 'GROK'
                    created_at?: string
                    updated_at?: string
                }
            }
            chat_tags: {
                Row: {
                    chat_id: string
                    tag_id: string
                }
                Insert: {
                    chat_id: string
                    tag_id: string
                }
                Update: {
                    chat_id?: string
                    tag_id?: string
                }
            }
            folders: {
                Row: {
                    id: string
                    user_id: string
                    name: string
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    name: string
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    name?: string
                    created_at?: string
                    updated_at?: string
                }
            }
            messages: {
                Row: {
                    id: string
                    chat_id: string
                    role: 'user' | 'assistant' | 'system'
                    content: string
                    type: 'text' | 'suggestion' | 'response'
                    metadata: Json
                    created_at: string
                }
                Insert: {
                    id?: string
                    chat_id: string
                    role: 'user' | 'assistant' | 'system'
                    content: string
                    type?: 'text' | 'suggestion' | 'response'
                    metadata?: Json
                    created_at?: string
                }
                Update: {
                    id?: string
                    chat_id?: string
                    role?: 'user' | 'assistant' | 'system'
                    content?: string
                    type?: 'text' | 'suggestion' | 'response'
                    metadata?: Json
                    created_at?: string
                }
            }
            note_tags: {
                Row: {
                    note_id: string
                    tag_id: string
                }
                Insert: {
                    note_id: string
                    tag_id: string
                }
                Update: {
                    note_id?: string
                    tag_id?: string
                }
            }
            notes: {
                Row: {
                    id: string
                    user_id: string
                    parent_id: string | null
                    content: string
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    parent_id?: string | null
                    content: string
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    parent_id?: string | null
                    content?: string
                    created_at?: string
                    updated_at?: string
                }
            }
            tags: {
                Row: {
                    id: string
                    user_id: string
                    name: string
                    color: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    name: string
                    color: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    name?: string
                    color?: string
                    created_at?: string
                }
            }
            user_settings: {
                Row: {
                    user_id: string
                    default_ai_tool: 'GEMINI' | 'CHATGPT' | 'GROK'
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    user_id: string
                    default_ai_tool?: 'GEMINI' | 'CHATGPT' | 'GROK'
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    user_id?: string
                    default_ai_tool?: 'GEMINI' | 'CHATGPT' | 'GROK'
                    created_at?: string
                    updated_at?: string
                }
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}
