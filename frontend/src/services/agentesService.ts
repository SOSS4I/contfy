/**
 * Agentes Service
 * ===============
 *
 * Serviço para monitoramento dos agentes de IA
 */

import api, { ApiResponse } from './api'

export interface Agente {
  id: string
  nome: string
  tipo: string
  status: 'ativo' | 'inativo' | 'erro' | 'manutencao'
  tarefas_processadas: number
  tarefas_sucesso: number
  tarefas_erro: number
  uptime: number // porcentagem
  ultima_execucao?: string
  tempo_medio_execucao?: number // segundos
  created_at?: string
}

export interface AgenteTarefa {
  id: string
  agente_id: string
  agente_nome: string
  tipo: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  dados_entrada: any
  dados_saida?: any
  erro_mensagem?: string
  tempo_execucao?: number
  created_at: string
  started_at?: string
  completed_at?: string
}

export interface AgenteEstatisticas {
  total_agentes: number
  agentes_ativos: number
  tarefas_hoje: number
  tarefas_mes: number
  uptime_medio: number
  taxa_sucesso: number
  tempo_medio: number
  por_agente: Record<string, {
    tarefas: number
    sucesso: number
    erro: number
    uptime: number
  }>
}

export const agentesService = {
  /**
   * Listar todos os agentes
   */
  async listar(): Promise<Agente[]> {
    const response = await api.get<ApiResponse<Agente[]>>('/agentes')
    return response.data.data
  },

  /**
   * Buscar agente por ID
   */
  async buscar(id: string): Promise<Agente> {
    const response = await api.get<ApiResponse<Agente>>(`/agentes/${id}`)
    return response.data.data
  },

  /**
   * Obter status de um agente
   */
  async status(id: string): Promise<{
    status: string
    uptime: number
    memoria_uso: number
    cpu_uso: number
    ultima_execucao: string
  }> {
    const response = await api.get(`/agentes/${id}/status`)
    return response.data.data
  },

  /**
   * Listar tarefas de um agente
   */
  async tarefas(agente_id: string, limit: number = 50): Promise<AgenteTarefa[]> {
    const response = await api.get<ApiResponse<AgenteTarefa[]>>(`/agentes/${agente_id}/tarefas`, {
      params: { limit },
    })
    return response.data.data
  },

  /**
   * Listar todas as tarefas (qualquer agente)
   */
  async todasTarefas(filters?: {
    agente_id?: string
    status?: string
    data_inicio?: string
    data_fim?: string
    limit?: number
  }): Promise<AgenteTarefa[]> {
    const response = await api.get<ApiResponse<AgenteTarefa[]>>('/agentes/tarefas', {
      params: filters,
    })
    return response.data.data
  },

  /**
   * Buscar tarefa por ID
   */
  async buscarTarefa(tarefa_id: string): Promise<AgenteTarefa> {
    const response = await api.get<ApiResponse<AgenteTarefa>>(`/agentes/tarefas/${tarefa_id}`)
    return response.data.data
  },

  /**
   * Criar nova tarefa para um agente
   */
  async criarTarefa(agente_id: string, tipo: string, dados: any): Promise<AgenteTarefa> {
    const response = await api.post<ApiResponse<AgenteTarefa>>(`/agentes/${agente_id}/tarefas`, {
      tipo,
      dados,
    })
    return response.data.data
  },

  /**
   * Reprocessar tarefa com erro
   */
  async reprocessarTarefa(tarefa_id: string): Promise<AgenteTarefa> {
    const response = await api.post<ApiResponse<AgenteTarefa>>(`/agentes/tarefas/${tarefa_id}/reprocessar`)
    return response.data.data
  },

  /**
   * Cancelar tarefa em andamento
   */
  async cancelarTarefa(tarefa_id: string): Promise<void> {
    await api.post(`/agentes/tarefas/${tarefa_id}/cancelar`)
  },

  /**
   * Obter estatísticas gerais dos agentes
   */
  async estatisticas(periodo?: 'hoje' | 'semana' | 'mes' | 'ano'): Promise<AgenteEstatisticas> {
    const response = await api.get<ApiResponse<AgenteEstatisticas>>('/agentes/estatisticas', {
      params: { periodo },
    })
    return response.data.data
  },

  /**
   * Reiniciar agente (para manutenção)
   */
  async reiniciar(agente_id: string): Promise<void> {
    await api.post(`/agentes/${agente_id}/reiniciar`)
  },

  /**
   * Pausar agente
   */
  async pausar(agente_id: string): Promise<void> {
    await api.post(`/agentes/${agente_id}/pausar`)
  },

  /**
   * Retomar agente pausado
   */
  async retomar(agente_id: string): Promise<void> {
    await api.post(`/agentes/${agente_id}/retomar`)
  },

  /**
   * Obter logs de um agente
   */
  async logs(agente_id: string, limit: number = 100): Promise<string[]> {
    const response = await api.get(`/agentes/${agente_id}/logs`, {
      params: { limit },
    })
    return response.data.data
  },
}

export default agentesService
