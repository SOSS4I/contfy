/**
 * Declarações Service
 * ===================
 *
 * Serviço para gerenciamento de declarações fiscais
 */

import api, { ApiResponse, PaginatedResponse } from './api'

export interface Declaracao {
  id: string
  cliente_id: string
  cliente_nome?: string
  cliente_cnpj?: string
  tipo: 'DEFIS' | 'DASN' | 'PGDAS' | 'OUTROS'
  ano: string
  descricao: string
  status: 'enviada' | 'processando' | 'pendente' | 'erro'
  data_envio?: string
  recibo?: string
  protocolo?: string
  url_pdf?: string
  dados?: any
  erro_mensagem?: string
  created_at?: string
}

export interface DeclaracaoCreate {
  cliente_id: string
  tipo: string
  ano: string
  dados: any
}

export interface DeclaracaoFilters {
  cliente_id?: string
  tipo?: string
  ano?: string
  status?: string
  page?: number
  per_page?: number
}

export const declaracoesService = {
  /**
   * Listar todas as declarações
   */
  async listar(filters?: DeclaracaoFilters): Promise<PaginatedResponse<Declaracao>> {
    const response = await api.get<PaginatedResponse<Declaracao>>('/declaracoes', {
      params: filters,
    })
    return response.data
  },

  /**
   * Listar minhas declarações (cliente logado)
   */
  async listarMinhas(filters?: Omit<DeclaracaoFilters, 'cliente_id'>): Promise<PaginatedResponse<Declaracao>> {
    const response = await api.get<PaginatedResponse<Declaracao>>('/declaracoes/minhas', {
      params: filters,
    })
    return response.data
  },

  /**
   * Buscar declaração por ID
   */
  async buscar(id: string): Promise<Declaracao> {
    const response = await api.get<ApiResponse<Declaracao>>(`/declaracoes/${id}`)
    return response.data.data
  },

  /**
   * Criar/Enviar declaração
   */
  async criar(data: DeclaracaoCreate): Promise<Declaracao> {
    const response = await api.post<ApiResponse<Declaracao>>('/declaracoes', data)
    return response.data.data
  },

  /**
   * Gerar DEFIS
   */
  async gerarDEFIS(cliente_id: string, ano: number): Promise<Declaracao> {
    const response = await api.post<ApiResponse<Declaracao>>('/declaracoes/defis/gerar', {
      cliente_id,
      ano,
    })
    return response.data.data
  },

  /**
   * Gerar DASN (MEI)
   */
  async gerarDASN(cliente_id: string, ano: number): Promise<Declaracao> {
    const response = await api.post<ApiResponse<Declaracao>>('/declaracoes/dasn/gerar', {
      cliente_id,
      ano,
    })
    return response.data.data
  },

  /**
   * Gerar PGDAS-D (mensal)
   */
  async gerarPGDAS(cliente_id: string, mes: number, ano: number): Promise<Declaracao> {
    const response = await api.post<ApiResponse<Declaracao>>('/declaracoes/pgdas/gerar', {
      cliente_id,
      mes,
      ano,
    })
    return response.data.data
  },

  /**
   * Enviar declaração para Receita Federal (mock)
   */
  async enviar(declaracao_id: string): Promise<Declaracao> {
    const response = await api.post<ApiResponse<Declaracao>>(`/declaracoes/${declaracao_id}/enviar`)
    return response.data.data
  },

  /**
   * Download da declaração (PDF)
   */
  async download(declaracao_id: string): Promise<Blob> {
    const response = await api.get(`/declaracoes/${declaracao_id}/download`, {
      responseType: 'blob',
    })
    return response.data
  },

  /**
   * Retificar declaração
   */
  async retificar(declaracao_id: string, novos_dados: any): Promise<Declaracao> {
    const response = await api.post<ApiResponse<Declaracao>>(`/declaracoes/${declaracao_id}/retificar`, {
      dados: novos_dados,
    })
    return response.data.data
  },

  /**
   * Consultar situação na Receita
   */
  async consultarSituacao(recibo: string): Promise<any> {
    const response = await api.get('/declaracoes/consultar-situacao', {
      params: { recibo },
    })
    return response.data.data
  },

  /**
   * Obter estatísticas de declarações
   */
  async estatisticas(cliente_id?: string, ano?: number): Promise<{
    total: number
    enviadas: number
    processando: number
    pendentes: number
    erros: number
    por_tipo: Record<string, number>
  }> {
    const response = await api.get('/declaracoes/estatisticas', {
      params: { cliente_id, ano },
    })
    return response.data.data
  },

  /**
   * Gerar lote de declarações
   */
  async gerarLote(tipo: string, ano: number, clientes_ids: string[]): Promise<Declaracao[]> {
    const response = await api.post<ApiResponse<Declaracao[]>>('/declaracoes/gerar-lote', {
      tipo,
      ano,
      clientes_ids,
    })
    return response.data.data
  },

  /**
   * Deletar declaração
   */
  async deletar(id: string): Promise<void> {
    await api.delete(`/declaracoes/${id}`)
  },
}

export default declaracoesService
