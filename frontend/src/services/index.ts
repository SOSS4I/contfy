/**
 * Services Index
 * ==============
 *
 * Exporta todos os serviços da aplicação
 */

export { default as api } from './api'
export { default as authService } from './authService'
export { default as clientesService } from './clientesService'
export { default as documentosService } from './documentosService'
export { default as impostosService } from './impostosService'
export { default as declaracoesService } from './declaracoesService'
export { default as agentesService } from './agentesService'
export { default as chatService } from './chatService'

// Export types
export type { ApiResponse, PaginatedResponse, ApiError } from './api'
export type { LoginRequest, LoginResponse, User } from './authService'
export type { Cliente, ClienteCreate, ClienteUpdate, ClienteFilters } from './clientesService'
export type { Documento, DocumentoFilters } from './documentosService'
export type { Imposto, ImpostoCalcular, ImpostoFilters } from './impostosService'
export type { Declaracao, DeclaracaoCreate, DeclaracaoFilters } from './declaracoesService'
export type { Agente, AgenteTarefa, AgenteEstatisticas } from './agentesService'
export type { Mensagem, Conversa, ChatRequest, ChatResponse } from './chatService'
