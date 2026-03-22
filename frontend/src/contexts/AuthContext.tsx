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
    // Verificar se há usuário salvo no localStorage
    const savedUser = localStorage.getItem('user')
    const token = localStorage.getItem('token')

    if (savedUser && token) {
      const parsedUser = JSON.parse(savedUser)

      // Verificar se o token ainda é válido
      verifyToken(token).then(isValid => {
        if (isValid) {
          setUser(parsedUser)
        } else {
          localStorage.removeItem('user')
          localStorage.removeItem('token')
        }
        setIsLoading(false)
      })
    } else {
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
    } catch {
      return false
    }
  }

  const login = async (email: string, password: string) => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'
      const loginURL = `${API_URL}/auth/login`

      let response: Response
      try {
        response = await fetch(loginURL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        })
      } catch (fetchError: any) {
        throw new Error(`Erro de rede: ${fetchError?.message || 'Não foi possível conectar ao servidor'}`)
      }

      let data: any
      try {
        data = await response.json()
      } catch {
        throw new Error('Resposta inválida do servidor (não é JSON)')
      }

      if (!response.ok) {
        throw new Error(data.message || `Erro ${response.status}`)
      }

      if (!data.success || !data.data) {
        throw new Error(data.message || 'Resposta inválida do servidor')
      }

      const { token, user: userData } = data.data

      // Salvar no localStorage
      localStorage.setItem('user', JSON.stringify(userData))
      localStorage.setItem('token', token)

      setUser(userData)

      // Redirecionar baseado no role
      if (userData.role === 'contador') {
        router.push('/contador')
      } else {
        router.push('/cliente')
      }

    } catch (error: any) {
      throw error
    }
  }

  const logout = () => {
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
