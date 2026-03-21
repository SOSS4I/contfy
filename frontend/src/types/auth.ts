// Tipos de autenticação

export type UserRole = 'contador' | 'cliente'

export interface User {
  id: number
  name: string
  email: string
  role: UserRole
  avatar?: string
  clientId?: number // Se for cliente, ID do cliente
  cnpj?: string
  phone?: string
  taxRegime?: string
  crc?: string // CRC do contador
  codigoContador?: string // Código para vincular clientes
}

export interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface AuthResponse {
  user: User
  token: string
}
