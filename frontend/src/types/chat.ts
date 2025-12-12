// AI聊天相关类型定义

// 聊天消息
export interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

// 对话
export interface Conversation {
  id: number
  session_id: string
  title: string
  created_at: string
  updated_at: string
}

// AI角色
export interface AICharacter {
  id: number
  name: string
  description: string
  avatar?: string
  greeting_message: string
  personality_tags?: string[]
  is_active: boolean
}

// AI模型
export interface AIModel {
  name: string
  model: string
  display_name: string
}

// 聊天请求
export interface ChatRequest {
  message: string
  character_id?: number
  provider?: string
  session_id: string
  conversation_id?: number
}

// 聊天响应
export interface ChatResponse {
  reply: string
  session_id: string
  conversation_id: number
  model: string
  token_usage: {
    prompt: number
    completion: number
    total: number
  }
}

// 历史消息
export interface HistoryMessage {
  id: number
  session_id: string
  character_id: number
  message_type: 'user' | 'assistant' | 'system'
  content: string
  token_count: number
  created_at: string
}

// API响应包装
export interface APIResponse<T> {
  data?: T
  error?: string
}

// 角色列表响应
export interface CharactersResponse {
  characters: AICharacter[]
}

// 模型列表响应
export interface ModelsResponse {
  models: AIModel[]
}

// 历史记录响应
export interface HistoryResponse {
  messages: HistoryMessage[]
}

// 对话列表响应
export interface ConversationsResponse {
  conversations: Conversation[]
}

// 对话详情响应
export interface ConversationDetailResponse {
  conversation: Conversation
  messages: HistoryMessage[]
}
