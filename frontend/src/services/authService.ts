/**
 * Auth Service
 * ============
 *
 * Serviço de autenticação com JWT
 */

import api, { ApiResponse } from './api'

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  access_token: string
  token_type: string
  user: {
    id: string
    email: string
    name: string
    role: 'contador' | 'cliente'
    cliente_id?: string
  }
}

export interface User {
  id: string
  email: string
  name: string
  role: 'contador' | 'cliente'
  cliente_id?: string
}

export const authService = {
  /**
   * Login
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const formData = new FormData()
    formData.append('username', credentials.email)
    formData.append('password', credentials.password)

    const response = await api.post<LoginResponse>('/auth/login', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })

    // Salvar token e usuário no localStorage
    if (response.data.access_token) {
      localStorage.setItem('token', response.data.access_token)
      localStorage.setItem('user', JSON.stringify(response.data.user))
    }

    return response.data
  },

  /**
   * Logout
   */
  async logout(): Promise<void> {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.location.href = '/login'
  },

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user')
    if (!userStr) return null

    try {
      return JSON.parse(userStr)
    } catch {
      return null
    }
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const token = localStorage.getItem('token')
    const user = this.getCurrentUser()
    return !!token && !!user
  },

  /**
   * Get user role
   */
  getUserRole(): 'contador' | 'cliente' | null {
    const user = this.getCurrentUser()
    return user?.role || null
  },

  /**
   * Verify token (call backend)
   */
  async verifyToken(): Promise<boolean> {
    try {
      await api.get('/auth/verify')
      return true
    } catch {
      return false
    }
  },
}

export default authService
