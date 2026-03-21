'use client'

import { useState, useRef, useEffect } from 'react'
import { FiSend, FiUser, FiCpu, FiRefreshCw } from 'react-icons/fi'
import { useAuth } from '@/contexts/AuthContext'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

function getAuthHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

export default function ChatPage() {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [sugestoes, setSugestoes] = useState<string[]>([])
  const [error, setError] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

  // Buscar sugestões ao carregar
  useEffect(() => {
    fetchSugestoes()
  }, [])

  const fetchSugestoes = async () => {
    try {
      const res = await fetch(`${API_URL}/chat/sugestoes`, { headers: getAuthHeaders() })
      if (res.ok) {
        const data = await res.json()
        setSugestoes(data.data || [])
      }
    } catch {}
  }

  const handleSendMessage = async (text?: string) => {
    const msg = text || inputMessage.trim()
    if (!msg || isTyping) return

    setError('')
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: msg,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    }

    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInputMessage('')
    setIsTyping(true)

    try {
      const res = await fetch(`${API_URL}/chat/mensagem`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          mensagem: msg,
          historico: updatedMessages.map(m => ({ role: m.role, content: m.content })),
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || 'Erro ao enviar mensagem')
      }

      const data = await res.json()
      const aiResponse = data.data?.resposta || 'Desculpe, não consegui gerar uma resposta.'

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      }])
    } catch (err: any) {
      setError(err.message || 'Erro de conexão')
    } finally {
      setIsTyping(false)
    }
  }

  const clearChat = () => {
    setMessages([])
    setError('')
    fetchSugestoes()
  }

  return (
    <div className="h-[calc(100vh-12rem)] flex flex-col">
      {/* Header */}
      <div className="bg-white rounded-t-xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Chat com IA</h1>
            <p className="text-gray-600 text-sm mt-1">
              Assistente virtual • Respostas baseadas nos seus dados reais
            </p>
          </div>
          <div className="flex items-center gap-3">
            {messages.length > 0 && (
              <button
                onClick={clearChat}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Nova conversa"
              >
                <FiRefreshCw className="w-4 h-4" />
              </button>
            )}
            <div className="flex items-center space-x-2">
              <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-medium text-gray-600">Online</span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 bg-gray-50 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <FiCpu className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Olá{user?.name ? `, ${user.name.split(' ')[0]}` : ''}!
            </h3>
            <p className="text-sm text-gray-500 max-w-md mb-6">
              Sou o assistente de IA da sua contabilidade. Posso ajudar com dúvidas sobre impostos, documentos, prazos e mais.
            </p>
            {sugestoes.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                {sugestoes.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(s)}
                    className="px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-full hover:bg-green-50 hover:border-green-300 hover:text-green-700 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex items-start space-x-3 max-w-[85%] sm:max-w-2xl ${message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
              <div className={`
                flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center
                ${message.role === 'user' ? 'bg-green-100' : 'bg-blue-100'}
              `}>
                {message.role === 'user' ? (
                  <FiUser className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                ) : (
                  <FiCpu className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                )}
              </div>

              <div className={`
                px-4 py-3 rounded-2xl
                ${message.role === 'user'
                  ? 'bg-green-600 text-white rounded-tr-none'
                  : 'bg-white text-gray-900 rounded-tl-none shadow-sm border border-gray-200'
                }
              `}>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                <p className={`
                  text-xs mt-1
                  ${message.role === 'user' ? 'text-green-100' : 'text-gray-400'}
                `}>
                  {message.timestamp}
                </p>
              </div>
            </div>
          </div>
        ))}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="flex items-start space-x-3 max-w-2xl">
              <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <FiCpu className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
              </div>
              <div className="px-4 py-3 rounded-2xl bg-white rounded-tl-none shadow-sm border border-gray-200">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="flex justify-center">
            <div className="bg-red-50 text-red-600 text-xs px-4 py-2 rounded-lg border border-red-200">
              {error}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Sugestões rápidas (quando já tem mensagens) */}
      {messages.length > 0 && messages.length <= 4 && sugestoes.length > 0 && (
        <div className="bg-white border-t border-gray-200 px-4 py-2">
          <div className="flex flex-wrap gap-2">
            {sugestoes.slice(0, 3).map((s, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(s)}
                disabled={isTyping}
                className="px-3 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="bg-white rounded-b-xl shadow-sm border border-gray-200 border-t-0 p-4">
        <div className="flex items-end space-x-3">
          <div className="flex-1 relative">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSendMessage()
                }
              }}
              placeholder="Digite sua pergunta..."
              rows={1}
              disabled={isTyping}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none disabled:opacity-50"
            />
          </div>

          <button
            onClick={() => handleSendMessage()}
            disabled={!inputMessage.trim() || isTyping}
            className="p-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <FiSend className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-gray-400 mt-2">
          Enter para enviar • Shift + Enter para nova linha
        </p>
      </div>
    </div>
  )
}
