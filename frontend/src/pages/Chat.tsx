import { useState, useEffect, useRef, useCallback } from 'react'
import api from '../services/api'
import type { 
  Message, 
  AICharacter, 
  AIModel, 
  ChatResponse, 
  CharactersResponse, 
  ModelsResponse,
  Conversation,
  ConversationsResponse,
  ConversationDetailResponse
} from '../types/chat'

// SVG 图标组件
const Icons = {
  chat: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  ),
  edit: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  ),
  trash: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
    </svg>
  ),
  send: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13"/>
      <polygon points="22 2 15 22 11 13 2 9 22 2"/>
    </svg>
  ),
  plus: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  sparkle: () => (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707"/>
      <circle cx="12" cy="12" r="4"/>
    </svg>
  ),
  menu: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="12" x2="21" y2="12"/>
      <line x1="3" y1="6" x2="21" y2="6"/>
      <line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  ),
  close: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  )
}


// 生成会话ID
const generateSessionId = (): string => {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
}

// 从localStorage获取或创建会话ID
const getOrCreateSessionId = (): string => {
  const stored = localStorage.getItem('chat_session_id')
  if (stored) return stored
  const newId = generateSessionId()
  localStorage.setItem('chat_session_id', newId)
  return newId
}

export default function Chat() {
  // 状态
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId] = useState(getOrCreateSessionId)
  
  // 对话管理
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null)
  
  // AI配置
  const [characters, setCharacters] = useState<AICharacter[]>([])
  const [models, setModels] = useState<AIModel[]>([])
  const [selectedCharacter, setSelectedCharacter] = useState<AICharacter | null>(null)
  const [selectedModel, setSelectedModel] = useState<AIModel | null>(null)
  
  // UI状态
  const [error, setError] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState<number | null>(null)
  const [newTitle, setNewTitle] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [navMenuOpen, setNavMenuOpen] = useState(false)
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // 加载对话列表
  const loadConversations = useCallback(async () => {
    try {
      const data = await api.get(`/conversations?session_id=${sessionId}`) as ConversationsResponse
      setConversations(data.conversations || [])
    } catch (err) {
      console.error('加载对话列表失败:', err)
    }
  }, [sessionId])


  // 加载角色列表
  const loadCharacters = useCallback(async () => {
    try {
      const data = await api.get('/ai/characters') as CharactersResponse
      setCharacters(data.characters || [])
      if (data.characters && data.characters.length > 0 && !selectedCharacter) {
        setSelectedCharacter(data.characters[0])
      }
    } catch (err) {
      console.error('加载角色失败:', err)
    }
  }, [selectedCharacter])

  // 加载模型列表
  const loadModels = useCallback(async () => {
    try {
      const data = await api.get('/ai/models') as ModelsResponse
      setModels(data.models || [])
      if (data.models && data.models.length > 0 && !selectedModel) {
        const deepseek = data.models.find(m => m.name === 'deepseek')
        setSelectedModel(deepseek || data.models[0])
      }
    } catch (err) {
      console.error('加载模型失败:', err)
    }
  }, [selectedModel])

  // 初始化
  useEffect(() => {
    loadCharacters()
    loadModels()
    loadConversations()
  }, [loadCharacters, loadModels, loadConversations])

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])



  // 选择对话
  const selectConversation = async (conv: Conversation) => {
    try {
      const data = await api.get(`/conversations/${conv.id}`) as ConversationDetailResponse
      setCurrentConversation(data.conversation)
      const msgs: Message[] = (data.messages || []).map(m => ({
        role: m.message_type as 'user' | 'assistant',
        content: m.content,
        timestamp: new Date(m.created_at)
      }))
      setMessages(msgs)
    } catch (err) {
      setError('加载对话失败')
    }
  }


  // 新建对话
  const createNewConversation = () => {
    setCurrentConversation(null)
    setMessages([])
    inputRef.current?.focus()
  }

  // 删除对话
  const deleteConversation = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('确定删除这个对话吗？')) return
    
    try {
      await api.delete(`/conversations/${id}`)
      setConversations(prev => prev.filter(c => c.id !== id))
      if (currentConversation?.id === id) {
        createNewConversation()
      }
    } catch (err) {
      setError('删除失败')
    }
  }

  // 开始编辑标题
  const startEditTitle = (conv: Conversation, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingTitle(conv.id)
    setNewTitle(conv.title)
  }

  // 保存标题
  const saveTitle = async (id: number) => {
    if (!newTitle.trim()) {
      setEditingTitle(null)
      return
    }
    try {
      await api.put(`/conversations/${id}`, { title: newTitle.trim() })
      setConversations(prev => prev.map(c => 
        c.id === id ? { ...c, title: newTitle.trim() } : c
      ))
      if (currentConversation?.id === id) {
        setCurrentConversation(prev => prev ? { ...prev, title: newTitle.trim() } : null)
      }
    } catch (err) {
      setError('更新失败')
    }
    setEditingTitle(null)
  }


  // 发送消息
  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    setError(null)

    try {
      const data = await api.post('/ai/chat', {
        message: userMessage.content,
        character_id: selectedCharacter?.id || 0,
        provider: selectedModel?.name || '',
        session_id: sessionId,
        conversation_id: currentConversation?.id || 0,
      }) as ChatResponse

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.reply,
        timestamp: new Date(),
      }

      setMessages(prev => [...prev, assistantMessage])

      if (!currentConversation && data.conversation_id) {
        loadConversations()
        setCurrentConversation({
          id: data.conversation_id,
          session_id: sessionId,
          title: userMessage.content.slice(0, 30) + (userMessage.content.length > 30 ? '...' : ''),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
      }
    } catch (err: any) {
      setError(err.message || '发送失败')
    } finally {
      setIsLoading(false)
      inputRef.current?.focus()
    }
  }

  // 键盘事件
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // 格式化时间
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }


  return (
    <div className="chat-app">
      <style>{`
        .chat-app {
          display: flex;
          height: 100vh;
          background: #0a0a0f;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          color: #e4e4e7;
        }
        
        /* 侧边栏 */
        .sidebar {
          width: 280px;
          background: linear-gradient(180deg, #12121a 0%, #0d0d12 100%);
          border-right: 1px solid rgba(255,255,255,0.06);
          display: flex;
          flex-direction: column;
          animation: slideInLeft 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        .sidebar-header {
          padding: 1rem;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        
        .new-chat-btn {
          width: 100%;
          padding: 0.75rem 1rem;
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          border: none;
          border-radius: 10px;
          color: white;
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
          overflow: hidden;
        }
        
        .new-chat-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          transition: left 0.5s;
        }
        
        .new-chat-btn:hover::before {
          left: 100%;
        }
        
        .new-chat-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(99,102,241,0.4);
        }
        
        .new-chat-btn:active {
          transform: translateY(0);
        }

        
        .conversations-list {
          flex: 1;
          overflow-y: auto;
          padding: 0.5rem;
        }
        
        .conversations-list::-webkit-scrollbar {
          width: 4px;
        }
        
        .conversations-list::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.1);
          border-radius: 2px;
        }
        
        .conv-item {
          padding: 0.75rem 1rem;
          border-radius: 10px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.25rem;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
          animation: fadeInUp 0.3s ease forwards;
          opacity: 0;
        }
        
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .conv-item:nth-child(1) { animation-delay: 0.05s; }
        .conv-item:nth-child(2) { animation-delay: 0.1s; }
        .conv-item:nth-child(3) { animation-delay: 0.15s; }
        .conv-item:nth-child(4) { animation-delay: 0.2s; }
        .conv-item:nth-child(5) { animation-delay: 0.25s; }
        
        .conv-item:hover {
          background: rgba(255,255,255,0.05);
          transform: translateX(4px);
        }
        
        .conv-item.active {
          background: rgba(99,102,241,0.15);
          border-left: 3px solid #6366f1;
        }
        
        .conv-icon {
          opacity: 0.6;
          display: flex;
          align-items: center;
          transition: all 0.2s;
        }
        
        .conv-item:hover .conv-icon {
          opacity: 1;
          color: #6366f1;
        }
        
        .conv-title {
          flex: 1;
          font-size: 0.85rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .conv-title-input {
          flex: 1;
          background: rgba(0,0,0,0.3);
          border: 1px solid rgba(99,102,241,0.5);
          border-radius: 6px;
          padding: 0.25rem 0.5rem;
          color: #e4e4e7;
          font-size: 0.85rem;
          outline: none;
          transition: all 0.2s;
        }
        
        .conv-title-input:focus {
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99,102,241,0.2);
        }
        
        .conv-actions {
          display: flex;
          gap: 0.25rem;
          opacity: 0;
          transform: translateX(10px);
          transition: all 0.2s;
        }
        
        .conv-item:hover .conv-actions {
          opacity: 1;
          transform: translateX(0);
        }
        
        .conv-action-btn {
          padding: 0.35rem;
          background: transparent;
          border: none;
          color: #71717a;
          cursor: pointer;
          border-radius: 6px;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .conv-action-btn:hover {
          background: rgba(255,255,255,0.1);
          color: #e4e4e7;
          transform: scale(1.1);
        }
        
        .conv-action-btn.delete:hover {
          color: #f87171;
          background: rgba(248,113,113,0.1);
        }

        
        /* 设置区域 */
        .sidebar-settings {
          padding: 1rem;
          border-top: 1px solid rgba(255,255,255,0.06);
          animation: fadeIn 0.5s ease 0.3s forwards;
          opacity: 0;
        }
        
        @keyframes fadeIn {
          to { opacity: 1; }
        }
        
        .section-title {
          font-size: 0.7rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #52525b;
          margin-bottom: 0.5rem;
        }
        
        .select-wrapper {
          position: relative;
          margin-bottom: 0.75rem;
        }
        
        .select-wrapper select {
          width: 100%;
          padding: 0.6rem 0.75rem;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 8px;
          color: #e4e4e7;
          font-size: 0.8rem;
          cursor: pointer;
          appearance: none;
          transition: all 0.2s;
        }
        
        .select-wrapper select:hover {
          border-color: rgba(255,255,255,0.15);
        }
        
        .select-wrapper select:focus {
          outline: none;
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99,102,241,0.15);
        }
        
        .select-wrapper::after {
          content: '';
          position: absolute;
          right: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
          width: 0;
          height: 0;
          border-left: 4px solid transparent;
          border-right: 4px solid transparent;
          border-top: 5px solid #52525b;
          pointer-events: none;
          transition: transform 0.2s;
        }
        
        .select-wrapper:focus-within::after {
          transform: translateY(-50%) rotate(180deg);
        }
        
        /* 主聊天区域 */
        .chat-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          background: linear-gradient(180deg, #0f0f14 0%, #0a0a0f 100%);
          animation: fadeIn 0.5s ease;
        }
        
        .chat-header {
          padding: 1rem 1.5rem;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          background: rgba(0,0,0,0.2);
          backdrop-filter: blur(10px);
        }
        
        .chat-header h1 {
          font-size: 1rem;
          font-weight: 600;
          margin: 0;
          color: #fafafa;
          background: linear-gradient(135deg, #fff 0%, #a5b4fc 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        
        .chat-header p {
          font-size: 0.8rem;
          color: #71717a;
          margin: 0.25rem 0 0;
        }

        
        /* 消息区域 */
        .messages-container {
          flex: 1;
          overflow-y: auto;
          padding: 1.5rem;
        }
        
        .messages-container::-webkit-scrollbar {
          width: 6px;
        }
        
        .messages-container::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.1);
          border-radius: 3px;
        }
        
        .welcome-screen {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          text-align: center;
          padding: 2rem;
          animation: welcomeFade 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }
        
        @keyframes welcomeFade {
          from { opacity: 0; transform: scale(0.95) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        
        .welcome-icon {
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(139,92,246,0.2) 100%);
          border-radius: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.5rem;
          box-shadow: 0 0 60px rgba(99,102,241,0.3);
          animation: iconPulse 3s ease-in-out infinite;
          color: #a5b4fc;
        }
        
        @keyframes iconPulse {
          0%, 100% { box-shadow: 0 0 40px rgba(99,102,241,0.3); transform: scale(1); }
          50% { box-shadow: 0 0 60px rgba(99,102,241,0.5); transform: scale(1.05); }
        }
        
        .welcome-title {
          font-size: 1.5rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
          background: linear-gradient(135deg, #fff 0%, #a1a1aa 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        
        .welcome-subtitle {
          color: #71717a;
          font-size: 0.95rem;
          max-width: 400px;
          line-height: 1.6;
        }
        
        /* 消息样式 */
        .message {
          display: flex;
          margin-bottom: 1.25rem;
          animation: messageSlide 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        
        @keyframes messageSlide {
          from { opacity: 0; transform: translateY(20px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        
        .message.user {
          justify-content: flex-end;
        }
        
        .message-wrapper {
          max-width: 70%;
        }
        
        .message-bubble {
          padding: 1rem 1.25rem;
          border-radius: 16px;
          line-height: 1.6;
          font-size: 0.925rem;
          transition: all 0.2s;
        }
        
        .message-bubble:hover {
          transform: scale(1.01);
        }
        
        .message.user .message-bubble {
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          color: white;
          border-bottom-right-radius: 4px;
          box-shadow: 0 4px 15px rgba(99,102,241,0.3);
        }
        
        .message.assistant .message-bubble {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          color: #e4e4e7;
          border-bottom-left-radius: 4px;
        }
        
        .message-content {
          white-space: pre-wrap;
          word-break: break-word;
        }
        
        .message-time {
          font-size: 0.7rem;
          color: #52525b;
          margin-top: 0.5rem;
          padding: 0 0.25rem;
          opacity: 0;
          transition: opacity 0.2s;
        }
        
        .message:hover .message-time {
          opacity: 1;
        }
        
        .message.user .message-time {
          text-align: right;
        }

        
        /* 加载动画 */
        .typing-indicator {
          display: flex;
          gap: 5px;
          padding: 1rem 1.25rem;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          border-bottom-left-radius: 4px;
        }
        
        .typing-dot {
          width: 8px;
          height: 8px;
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          border-radius: 50%;
          animation: typingBounce 1.4s infinite ease-in-out;
        }
        
        .typing-dot:nth-child(1) { animation-delay: 0s; }
        .typing-dot:nth-child(2) { animation-delay: 0.2s; }
        .typing-dot:nth-child(3) { animation-delay: 0.4s; }
        
        @keyframes typingBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-10px); opacity: 1; }
        }
        
        /* 输入区域 */
        .input-area {
          padding: 1rem 1.5rem 1.5rem;
          background: linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.4) 100%);
          animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        }
        
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .error-toast {
          background: rgba(239,68,68,0.1);
          border: 1px solid rgba(239,68,68,0.2);
          color: #f87171;
          padding: 0.75rem 1rem;
          border-radius: 10px;
          font-size: 0.85rem;
          margin-bottom: 1rem;
          animation: shakeError 0.5s ease;
        }
        
        @keyframes shakeError {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-5px); }
          40%, 80% { transform: translateX(5px); }
        }
        
        .input-wrapper {
          display: flex;
          gap: 0.75rem;
          align-items: flex-end;
        }
        
        .input-container {
          flex: 1;
          position: relative;
        }
        
        .chat-input {
          width: 100%;
          padding: 1rem 1.25rem;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 14px;
          color: #fafafa;
          font-size: 0.95rem;
          font-family: inherit;
          resize: none;
          min-height: 52px;
          max-height: 150px;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        
        .chat-input::placeholder {
          color: #52525b;
        }
        
        .chat-input:focus {
          outline: none;
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99,102,241,0.15), 0 8px 25px rgba(0,0,0,0.3);
          background: rgba(255,255,255,0.05);
          transform: translateY(-2px);
        }
        
        .send-btn {
          width: 52px;
          height: 52px;
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          border: none;
          border-radius: 14px;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          flex-shrink: 0;
          position: relative;
          overflow: hidden;
        }
        
        .send-btn::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          background: rgba(255,255,255,0.3);
          border-radius: 50%;
          transform: translate(-50%, -50%);
          transition: width 0.4s, height 0.4s;
        }
        
        .send-btn:hover:not(:disabled)::before {
          width: 100px;
          height: 100px;
        }
        
        .send-btn:hover:not(:disabled) {
          transform: translateY(-3px) scale(1.05);
          box-shadow: 0 10px 30px rgba(99,102,241,0.5);
        }
        
        .send-btn:active:not(:disabled) {
          transform: translateY(0) scale(0.98);
        }
        
        .send-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .input-hint {
          font-size: 0.7rem;
          color: #52525b;
          margin-top: 0.5rem;
          padding-left: 0.25rem;
        }
        
        .empty-state {
          padding: 2rem 1rem;
          color: #52525b;
          font-size: 0.85rem;
          text-align: center;
          animation: fadeIn 0.5s ease;
        }
        
        /* 移动端菜单按钮 */
        .mobile-menu-btn {
          display: none;
          width: 40px;
          height: 40px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px;
          color: #e4e4e7;
          cursor: pointer;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        
        .mobile-menu-btn:hover {
          background: rgba(255,255,255,0.1);
        }
        
        /* 侧边栏遮罩 */
        .sidebar-overlay {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.6);
          z-index: 99;
          backdrop-filter: blur(4px);
        }
        
        .sidebar-overlay.active {
          display: block;
          animation: fadeIn 0.3s ease;
        }
        
        /* 导航菜单按钮 */
        .nav-menu-btn {
          width: 40px;
          height: 40px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px;
          color: #e4e4e7;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        
        .nav-menu-btn:hover {
          background: rgba(255,255,255,0.1);
        }
        
        /* 导航菜单遮罩 */
        .nav-menu-overlay {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.6);
          z-index: 999;
          backdrop-filter: blur(4px);
        }
        
        .nav-menu-overlay.active {
          display: block;
          animation: fadeIn 0.3s ease;
        }
        
        /* 导航菜单侧边栏 */
        .nav-menu {
          position: fixed;
          top: 0;
          right: 0;
          width: 280px;
          height: 100vh;
          background: linear-gradient(180deg, #12121a 0%, #0d0d12 100%);
          z-index: 1000;
          transform: translateX(100%);
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          display: flex;
          flex-direction: column;
        }
        
        .nav-menu.open {
          transform: translateX(0);
        }
        
        .nav-menu-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        
        .nav-menu-title {
          font-size: 1rem;
          font-weight: 600;
          color: #e4e4e7;
        }
        
        .nav-menu-close {
          width: 40px;
          height: 40px;
          background: transparent;
          border: none;
          color: #71717a;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          transition: all 0.2s;
        }
        
        .nav-menu-close:hover {
          background: rgba(255,255,255,0.05);
          color: #e4e4e7;
        }
        
        .nav-menu-links {
          flex: 1;
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        
        .nav-menu-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem;
          color: #a1a1aa;
          text-decoration: none;
          border-radius: 12px;
          transition: all 0.2s;
          font-size: 0.9rem;
        }
        
        .nav-menu-item:hover {
          background: rgba(255,255,255,0.05);
          color: #e4e4e7;
        }
        
        .nav-menu-item svg {
          width: 20px;
          height: 20px;
        }

        /* 移动端适配 */
        @media (max-width: 768px) {
          .sidebar {
            position: fixed;
            left: 0;
            top: 0;
            bottom: 0;
            z-index: 100;
            transform: translateX(-100%);
            transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          }
          
          .sidebar.open {
            transform: translateX(0);
          }
          
          .mobile-menu-btn {
            display: flex;
          }
          
          .chat-header {
            display: flex;
            align-items: center;
            gap: 0.75rem;
          }
          
          .chat-header-info {
            flex: 1;
          }
          
          .message-wrapper {
            max-width: 85%;
          }
          
          .messages-container {
            padding: 1rem;
          }
          
          .input-area {
            padding: 0.75rem 1rem 1rem;
          }
          
          .chat-input {
            padding: 0.875rem 1rem;
            font-size: 16px; /* 防止iOS缩放 */
          }
          
          .send-btn {
            width: 48px;
            height: 48px;
          }
          
          .input-hint {
            display: none;
          }
          
          .welcome-screen {
            padding: 1.5rem;
          }
          
          .welcome-icon {
            width: 60px;
            height: 60px;
          }
          
          .welcome-title {
            font-size: 1.25rem;
          }
          
          .welcome-subtitle {
            font-size: 0.875rem;
          }
        }
        
        @media (max-width: 480px) {
          .message-bubble {
            padding: 0.75rem 1rem;
            font-size: 0.875rem;
          }
          
          .sidebar {
            width: 100%;
          }
        }
      `}</style>


      {/* 移动端遮罩 */}
      <div 
        className={`sidebar-overlay ${sidebarOpen ? 'active' : ''}`} 
        onClick={() => setSidebarOpen(false)}
      />

      {/* 侧边栏 */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <button className="new-chat-btn" onClick={() => { createNewConversation(); setSidebarOpen(false); }}>
            <Icons.plus /> 新对话
          </button>
        </div>

        <div className="conversations-list">
          {conversations.map(conv => (
            <div 
              key={conv.id} 
              className={`conv-item ${currentConversation?.id === conv.id ? 'active' : ''}`}
              onClick={() => { selectConversation(conv); setSidebarOpen(false); }}
            >
              <span className="conv-icon"><Icons.chat /></span>
              {editingTitle === conv.id ? (
                <input
                  className="conv-title-input"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  onBlur={() => saveTitle(conv.id)}
                  onKeyDown={(e) => e.key === 'Enter' && saveTitle(conv.id)}
                  onClick={(e) => e.stopPropagation()}
                  autoFocus
                />
              ) : (
                <span className="conv-title">{conv.title}</span>
              )}
              <div className="conv-actions">
                <button 
                  className="conv-action-btn" 
                  onClick={(e) => startEditTitle(conv, e)}
                  title="编辑"
                >
                  <Icons.edit />
                </button>
                <button 
                  className="conv-action-btn delete" 
                  onClick={(e) => deleteConversation(conv.id, e)}
                  title="删除"
                >
                  <Icons.trash />
                </button>
              </div>
            </div>
          ))}
          {conversations.length === 0 && (
            <div className="empty-state">
              暂无对话记录
            </div>
          )}
        </div>


        {/* 当有多个角色或模型时才显示选择器 */}
        {(characters.length > 1 || models.length > 1) && (
          <div className="sidebar-settings">
            {characters.length > 1 && (
              <>
                <div className="section-title">AI 角色</div>
                <div className="select-wrapper">
                  <select
                    value={selectedCharacter?.id || ''}
                    onChange={(e) => {
                      const char = characters.find(c => c.id === Number(e.target.value))
                      if (char) setSelectedCharacter(char)
                    }}
                  >
                    {characters.map(char => (
                      <option key={char.id} value={char.id}>{char.name}</option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {models.length > 1 && (
              <>
                <div className="section-title">AI 模型</div>
                <div className="select-wrapper">
                  <select
                    value={selectedModel?.name || ''}
                    onChange={(e) => {
                      const model = models.find(m => m.name === e.target.value)
                      if (model) setSelectedModel(model)
                    }}
                  >
                    {models.map(model => (
                      <option key={model.name} value={model.name}>{model.display_name}</option>
                    ))}
                  </select>
                </div>
              </>
            )}
          </div>
        )}
      </aside>


      {/* 主聊天区 */}
      <main className="chat-main">
        <header className="chat-header">
          <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)}>
            <Icons.menu />
          </button>
          <div className="chat-header-info">
            <h1>{selectedCharacter?.name || '莫诺'}</h1>
            <p>{currentConversation?.title || '新对话'}</p>
          </div>
          <button className="nav-menu-btn" onClick={() => setNavMenuOpen(true)} title="导航菜单">
            <Icons.menu />
          </button>
        </header>

        {/* 导航菜单遮罩 */}
        <div 
          className={`nav-menu-overlay ${navMenuOpen ? 'active' : ''}`}
          onClick={() => setNavMenuOpen(false)}
        />
        
        {/* 导航菜单 */}
        <div className={`nav-menu ${navMenuOpen ? 'open' : ''}`}>
          <div className="nav-menu-header">
            <span className="nav-menu-title">导航</span>
            <button className="nav-menu-close" onClick={() => setNavMenuOpen(false)}>
              <Icons.close />
            </button>
          </div>
          <div className="nav-menu-links">
            <a href="/" className="nav-menu-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
              首页
            </a>
            <a href="/articles" className="nav-menu-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
              文章
            </a>
            <a href="/projects" className="nav-menu-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 18 22 12 16 6"/>
                <polyline points="8 6 2 12 8 18"/>
              </svg>
              项目
            </a>
          </div>
        </div>

        <div className="messages-container">
          {messages.length === 0 ? (
            <div className="welcome-screen">
              <div className="welcome-icon">
                <Icons.sparkle />
              </div>
              <h2 className="welcome-title">
                {selectedCharacter?.greeting_message?.replace(/\$/g, ' ') || '嗯 有什么事吗'}
              </h2>
              <p className="welcome-subtitle">
                {selectedCharacter?.description || '输入消息开始对话吧'}
              </p>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div key={idx} className={`message ${msg.role}`}>
                <div className="message-wrapper">
                  <div className="message-bubble">
                    <div className="message-content">{msg.content.replace(/\$/g, '\n')}</div>
                  </div>
                  <div className="message-time">{formatTime(msg.timestamp)}</div>
                </div>
              </div>
            ))
          )}

          {isLoading && (
            <div className="message assistant">
              <div className="message-wrapper">
                <div className="typing-indicator">
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>


        <div className="input-area">
          {error && <div className="error-toast">{error}</div>}
          <div className="input-wrapper">
            <div className="input-container">
              <textarea
                ref={inputRef}
                className="chat-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="输入消息..."
                disabled={isLoading}
                maxLength={10000}
                rows={1}
              />
            </div>
            <button
              className="send-btn"
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
            >
              <Icons.send />
            </button>
          </div>
          <div className="input-hint">Enter 发送 / Shift + Enter 换行</div>
        </div>
      </main>
    </div>
  )
}
