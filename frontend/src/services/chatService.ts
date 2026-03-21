/**
 * Chat Service
 * ============
 *
 * Serviço para chat com IA
 */

import api, { ApiResponse } from './api'

export interface Mensagem {
  id: string
  conversa_id: string
  sender: 'user' | 'ai' | 'contador'
  content: string
  timestamp: string
  metadata?: any
}

export interface Conversa {
  id: string
  cliente_id?: string
  titulo?: string
  ultima_mensagem?: string
  ultima_atualizacao: string
  mensagens_count: number
  status: 'ativa' | 'arquivada'
  created_at: string
}

export interface ChatRequest {
  mensagem: string
  conversa_id?: string
  contexto?: any
}

export interface ChatResponse {
  mensagem: Mensagem
  conversa_id: string
}

export const chatService = {
  /**
   * Enviar mensagem para IA
   */
  async enviarMensagem(data: ChatRequest): Promise<ChatResponse> {
    const response = await api.post<ApiResponse<ChatResponse>>('/chat/mensagem', data)
    return response.data.data
  },

  /**
   * Listar conversas
   */
  async listarConversas(filters?: {
    cliente_id?: string
    status?: string
    limit?: number
  }): Promise<Conversa[]> {
    const response = await api.get<ApiResponse<Conversa[]>>('/chat/conversas', {
      params: filters,
    })
    return response.data.data
  },

  /**
   * Buscar conversa por ID
   */
  async buscarConversa(conversa_id: string): Promise<Conversa> {
    const response = await api.get<ApiResponse<Conversa>>(`/chat/conversas/${conversa_id}`)
    return response.data.data
  },

  /**
   * Listar mensagens de uma conversa
   */
  async listarMensagens(conversa_id: string, limit: number = 50): Promise<Mensagem[]> {
    const response = await api.get<ApiResponse<Mensagem[]>>(`/chat/conversas/${conversa_id}/mensagens`, {
      params: { limit },
    })
    return response.data.data
  },

  /**
   * Criar nova conversa
   */
  async criarConversa(titulo?: string): Promise<Conversa> {
    const response = await api.post<ApiResponse<Conversa>>('/chat/conversas', {
      titulo,
    })
    return response.data.data
  },

  /**
   * Arquivar conversa
   */
  async arquivarConversa(conversa_id: string): Promise<void> {
    await api.post(`/chat/conversas/${conversa_id}/arquivar`)
  },

  /**
   * Deletar conversa
   */
  async deletarConversa(conversa_id: string): Promise<void> {
    await api.delete(`/chat/conversas/${conversa_id}`)
  },

  /**
   * Obter sugestões de perguntas rápidas
   */
  async sugestoes(contexto?: string): Promise<string[]> {
    const response = await api.get<ApiResponse<string[]>>('/chat/sugestoes', {
      params: { contexto },
    })
    return response.data.data
  },

  /**
   * Feedback de mensagem (útil/não útil)
   */
  async feedback(mensagem_id: string, positivo: boolean, comentario?: string): Promise<void> {
    await api.post(`/chat/mensagens/${mensagem_id}/feedback`, {
      positivo,
      comentario,
    })
  },
}

export default chatService
