'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import type { User, AuthContextType } from '@/types/auth'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    console.log('[AuthContext] useEffect inicial executando...')
    // Verificar se há usuário salvo no localStorage
    const savedUser = localStorage.getItem('user')
    const token = localStorage.getItem('token')

    console.log('[AuthContext] savedUser:', savedUser)
    console.log('[AuthContext] token:', token ? 'presente' : 'ausente')

    if (savedUser && token) {
      const parsedUser = JSON.parse(savedUser)
      console.log('[AuthContext] Restaurando usuário do localStorage:', parsedUser)

      // Verificar se o token ainda é válido
      verifyToken(token).then(isValid => {
        if (isValid) {
          setUser(parsedUser)
        } else {
          console.log('[AuthContext] Token inválido ou expirado, fazendo logout')
          localStorage.removeItem('user')
          localStorage.removeItem('token')
        }
        setIsLoading(false)
      })
    } else {
      console.log('[AuthContext] Nenhum usuário salvo encontrado')
      setIsLoading(false)
    }
  }, [])

  // Verificar validade do token no backend
  const verifyToken = async (token: string): Promise<boolean> => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'
      const response = await fetch(`${API_URL}/auth/verify`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      return response.ok
    } catch (error) {
      console.error('[AuthContext] Erro ao verificar token:', error)
      return false
    }
  }

  const login = async (email: string, password: string) => {
    console.log('[AuthContext] login() chamado com email:', email)
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

      // Fazer login no backend (endpoint genérico aceita contador e cliente)
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()

      if (!response.ok) {
        // Erros de autenticação
        throw new Error(data.message || 'Erro ao fazer login')
      }

      if (!data.success || !data.data) {
        throw new Error(data.message || 'Resposta inválida do servidor')
      }

      const { token, user: userData } = data.data

      console.log('[AuthContext] Login bem-sucedido:', userData)

      // Salvar no localStorage
      localStorage.setItem('user', JSON.stringify(userData))
      localStorage.setItem('token', token)

      console.log('[AuthContext] Setando user no estado:', userData)
      setUser(userData)

      // Redirecionar baseado no role
      if (userData.role === 'contador') {
        router.push('/contador')
      } else {
        router.push('/cliente')
      }

    } catch (error: any) {
      console.error('[AuthContext] Erro no login:', error)
      throw error
    }
  }

  const logout = () => {
    console.log('[AuthContext] logout() chamado')
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    setUser(null)
    router.push('/login')
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
