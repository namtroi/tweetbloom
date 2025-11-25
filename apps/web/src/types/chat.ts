export interface Chat {
  id: string
  title: string
  created_at: string
  updated_at: string
  user_id: string
  folder_id?: string | null
  ai_tool?: string
  tags?: Array<{ id: string; name: string; color: string }>
}
