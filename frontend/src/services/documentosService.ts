/**
 * Documentos Service
 * ==================
 *
 * Serviço para gerenciamento de documentos
 */

import api, { ApiResponse, PaginatedResponse } from './api'

export interface Documento {
  id: string
  cliente_id: string
  cliente_nome?: string
  cliente_cnpj?: string
  nome: string
  tipo: 'nfe' | 'recibo' | 'contrato' | 'outro'
  tamanho: number
  status: 'processado' | 'processando' | 'erro' | 'pendente'
  data_upload: string
  url?: string
  dados_extraidos?: {
    chave_acesso?: string
    cfop?: string
    ncm?: string
    valor_total?: number
    data_emissao?: string
    [key: string]: any
  }
  erro_mensagem?: string
  created_at?: string
}

export interface DocumentoFilters {
  cliente_id?: string
  tipo?: string
  status?: string
  data_inicio?: string
  data_fim?: string
  search?: string
  page?: number
  per_page?: number
}

export const documentosService = {
  /**
   * Listar todos os documentos (contador) ou documentos do cliente
   */
  async listar(filters?: DocumentoFilters): Promise<PaginatedResponse<Documento>> {
    const response = await api.get<PaginatedResponse<Documento>>('/documentos', {
      params: filters,
    })
    return response.data
  },

  /**
   * Listar meus documentos (cliente logado)
   */
  async listarMeus(filters?: Omit<DocumentoFilters, 'cliente_id'>): Promise<PaginatedResponse<Documento>> {
    const response = await api.get<PaginatedResponse<Documento>>('/documentos/meus', {
      params: filters,
    })
    return response.data
  },

  /**
   * Buscar documento por ID
   */
  async buscar(id: string): Promise<Documento> {
    const response = await api.get<ApiResponse<Documento>>(`/documentos/${id}`)
    return response.data.data
  },

  /**
   * Upload de documento(s)
   */
  async upload(files: FileList | File[], cliente_id?: string): Promise<Documento[]> {
    const formData = new FormData()

    // Adicionar arquivos
    const fileArray = Array.isArray(files) ? files : Array.from(files)
    fileArray.forEach((file) => {
      formData.append('files', file)
    })

    // Adicionar cliente_id se fornecido (para contador)
    if (cliente_id) {
      formData.append('cliente_id', cliente_id)
    }

    const response = await api.post<ApiResponse<Documento[]>>('/documentos/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 120000, // 2 minutos para upload
    })

    return response.data.data
  },

  /**
   * Download de documento
   */
  async download(id: string): Promise<Blob> {
    const response = await api.get(`/documentos/${id}/download`, {
      responseType: 'blob',
    })
    return response.data
  },

  /**
   * Reprocessar documento com erro
   */
  async reprocessar(id: string): Promise<Documento> {
    const response = await api.post<ApiResponse<Documento>>(`/documentos/${id}/reprocessar`)
    return response.data.data
  },

  /**
   * Deletar documento
   */
  async deletar(id: string): Promise<void> {
    await api.delete(`/documentos/${id}`)
  },

  /**
   * Obter estatísticas de documentos
   */
  async estatisticas(cliente_id?: string): Promise<{
    total: number
    processados: number
    processando: number
    erros: number
    pendentes: number
    este_mes: number
  }> {
    const response = await api.get('/documentos/estatisticas', {
      params: { cliente_id },
    })

    // Backend retorna dados diretamente (sem wrapper .data)
    const data = response.data

    // Mapear campos do backend para o formato esperado pelo frontend
    return {
      total: data.total || 0,
      processados: data.aprovados || 0, // aprovados = processados
      processando: data.processando || 0,
      erros: data.rejeitados || 0, // rejeitados = erros
      pendentes: data.pendentes || 0,
      este_mes: data.total || 0, // usar total como este_mes por enquanto
    }
  },

  /**
   * Processar documento manualmente (force)
   */
  async processar(id: string): Promise<Documento> {
    const response = await api.post<ApiResponse<Documento>>(`/documentos/${id}/processar`)
    return response.data.data
  },
}

export default documentosService
