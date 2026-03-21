/**
 * Impostos Service
 * ================
 *
 * Serviço para cálculos de impostos e DAS
 */

import api, { ApiResponse, PaginatedResponse } from './api'

export interface Imposto {
  id: string
  cliente_id: string
  cliente_nome?: string
  cliente_cnpj?: string
  competencia: string // MM/YYYY
  tipo: 'DAS' | 'MEI' | 'DEFIS' | 'DASN'
  regime: 'mei' | 'simples_nacional'
  anexo?: string
  receita_bruta_mensal: number
  rbt12?: number
  aliquota_nominal?: number
  aliquota_efetiva?: number
  parcela_deduzir?: number
  valor_devido: number
  valor_pago?: number
  vencimento: string
  status: 'calculado' | 'gerado' | 'pago' | 'vencido'
  codigo_barras?: string
  das_id?: string
  recibo_pgdas?: string
  detalhamento?: {
    inss?: number
    icms?: number
    iss?: number
    [key: string]: any
  }
  created_at?: string
}

export interface ImpostoCalcular {
  cliente_id: string
  mes: number
  ano: number
  receita_bruta_mensal: number
}

export interface ImpostoFilters {
  cliente_id?: string
  competencia?: string
  status?: string
  tipo?: string
  data_inicio?: string
  data_fim?: string
  page?: number
  per_page?: number
}

export const impostosService = {
  /**
   * Listar todos os impostos
   */
  async listar(filters?: ImpostoFilters): Promise<PaginatedResponse<Imposto>> {
    const response = await api.get<PaginatedResponse<Imposto>>('/impostos', {
      params: filters,
    })
    return response.data
  },

  /**
   * Listar meus impostos (cliente logado)
   */
  async listarMeus(filters?: Omit<ImpostoFilters, 'cliente_id'>): Promise<PaginatedResponse<Imposto>> {
    const response = await api.get<PaginatedResponse<Imposto>>('/impostos/meus', {
      params: filters,
    })
    return response.data
  },

  /**
   * Buscar imposto por ID
   */
  async buscar(id: string): Promise<Imposto> {
    const response = await api.get<ApiResponse<Imposto>>(`/impostos/${id}`)
    return response.data.data
  },

  /**
   * Calcular imposto
   */
  async calcular(data: ImpostoCalcular): Promise<Imposto> {
    const response = await api.post<ApiResponse<Imposto>>('/impostos/calcular', data)
    return response.data.data
  },

  /**
   * Gerar DAS
   */
  async gerarDAS(imposto_id: string): Promise<Imposto> {
    const response = await api.post<ApiResponse<Imposto>>(`/impostos/${imposto_id}/gerar-das`)
    return response.data.data
  },

  /**
   * Download DAS (PDF)
   */
  async downloadDAS(imposto_id: string): Promise<Blob> {
    const response = await api.get(`/impostos/${imposto_id}/das/download`, {
      responseType: 'blob',
    })
    return response.data
  },

  /**
   * Consultar DAS na Receita (mock)
   */
  async consultarDAS(cnpj: string, competencia: string): Promise<any> {
    const response = await api.get('/impostos/consultar-das', {
      params: { cnpj, competencia },
    })
    return response.data.data
  },

  /**
   * Marcar como pago
   */
  async marcarPago(imposto_id: string, data_pagamento: string, valor_pago: number): Promise<Imposto> {
    const response = await api.post<ApiResponse<Imposto>>(`/impostos/${imposto_id}/marcar-pago`, {
      data_pagamento,
      valor_pago,
    })
    return response.data.data
  },

  /**
   * Obter estatísticas de impostos
   */
  async estatisticas(cliente_id?: string, ano?: number): Promise<{
    total_pendente: number
    total_pago_ano: number
    total_vencido: number
    media_mensal: number
    proximo_vencimento: {
      data: string
      valor: number
    } | null
  }> {
    const response = await api.get('/impostos/estatisticas', {
      params: { cliente_id, ano },
    })
    return response.data.data
  },

  /**
   * Calcular lote (para vários clientes)
   */
  async calcularLote(dados: ImpostoCalcular[]): Promise<Imposto[]> {
    const response = await api.post<ApiResponse<Imposto[]>>('/impostos/calcular-lote', {
      calculos: dados,
    })
    return response.data.data
  },
}

export default impostosService
