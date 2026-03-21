/**
 * Clientes Service
 * ================
 *
 * Serviço para gerenciamento de clientes
 */

import api, { ApiResponse, PaginatedResponse } from './api'

export interface Cliente {
  id: string
  cnpj: string
  razao_social: string
  nome_fantasia?: string
  regime_tributario: 'mei' | 'simples_nacional' | 'lucro_presumido' | 'lucro_real'
  anexo?: string
  cnae: string
  cnae_descricao?: string
  email: string
  telefone?: string
  endereco?: {
    logradouro: string
    numero: string
    complemento?: string
    bairro: string
    cidade: string
    uf: string
    cep: string
  }
  dados_fiscais?: {
    receita_bruta_anual: number
    rbt12: number
    numero_funcionarios: number
    data_opcao_simples?: string
  }
  status: 'ativo' | 'inativo' | 'pendente'
  ultimo_acesso?: string
  docs_pendentes?: number
  created_at?: string
  updated_at?: string
}

export interface ClienteCreate {
  cnpj: string
  razao_social: string
  nome_fantasia?: string
  regime_tributario: string
  cnae: string
  email: string
  telefone?: string
  endereco?: any
}

export interface ClienteUpdate extends Partial<ClienteCreate> {}

export interface ClienteFilters {
  search?: string
  regime_tributario?: string
  status?: string
  anexo?: string
  page?: number
  per_page?: number
}

export const clientesService = {
  /**
   * Listar todos os clientes (para contador)
   */
  async listar(filters?: ClienteFilters): Promise<PaginatedResponse<Cliente>> {
    const response = await api.get<PaginatedResponse<Cliente>>('/clientes', {
      params: filters,
    })
    return response.data
  },

  /**
   * Buscar cliente por ID
   */
  async buscar(id: string): Promise<Cliente> {
    const response = await api.get<ApiResponse<Cliente>>(`/clientes/${id}`)
    return response.data.data
  },

  /**
   * Buscar dados do cliente logado
   */
  async meusDados(): Promise<Cliente> {
    const response = await api.get<ApiResponse<Cliente>>('/clientes/me')
    return response.data.data
  },

  /**
   * Criar novo cliente
   */
  async criar(data: ClienteCreate): Promise<Cliente> {
    const response = await api.post<ApiResponse<Cliente>>('/clientes', data)
    return response.data.data
  },

  /**
   * Atualizar cliente
   */
  async atualizar(id: string, data: ClienteUpdate): Promise<Cliente> {
    const response = await api.put<ApiResponse<Cliente>>(`/clientes/${id}`, data)
    return response.data.data
  },

  /**
   * Deletar cliente
   */
  async deletar(id: string): Promise<void> {
    await api.delete(`/clientes/${id}`)
  },

  /**
   * Obter estatísticas de clientes (para contador)
   */
  async estatisticas(): Promise<{
    total: number
    simples_nacional: number
    mei: number
    docs_pendentes: number
    novos_mes: number
  }> {
    const response = await api.get('/clientes/estatisticas')
    // Backend retorna dados diretamente (sem wrapper .data)
    return response.data
  },
}

export default clientesService
