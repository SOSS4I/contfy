import { useState, useEffect } from 'react'
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

function getAuthHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export interface OnboardingQuestion {
  id: number
  questionKey: string
  questionText: string
  questionType: 'TEXT' | 'SELECT' | 'MULTISELECT' | 'BOOLEAN' | 'NUMBER'
  options?: {
    choices?: Array<{ value: string; label: string }>
  }
  orderIndex: number
  isConditional: boolean
  conditionLogic?: any
}

export interface OnboardingSession {
  id: number
  clientId: number
  status: 'IN_PROGRESS' | 'COMPLETED' | 'ANALYZING' | 'ERROR'
  currentStep: number
  totalSteps: number
}

export function useOnboarding() {
  const [loading, setLoading] = useState(true)
  const [questions, setQuestions] = useState<OnboardingQuestion[]>([])
  const [session, setSession] = useState<OnboardingSession | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    loadQuestions()
  }, [])

  const loadQuestions = async () => {
    try {
      const response = await axios.get(`${API_URL}/onboarding/questions`, { headers: getAuthHeaders() })
      setQuestions(response.data.data)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao carregar perguntas')
    } finally {
      setLoading(false)
    }
  }

  const startOnboarding = async (clientId: number) => {
    try {
      const response = await axios.post(`${API_URL}/onboarding/start`, { client_id: clientId }, { headers: getAuthHeaders() })
      const sessionData = response.data.data
      setSession(sessionData)
      // Retorna dados + flag de already_completed para o componente tratar
      return { ...sessionData, already_completed: response.data.already_completed }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao iniciar onboarding')
      throw err
    }
  }

  const saveResponse = async (sessionId: number, questionId: number, value: any) => {
    try {
      await axios.post(`${API_URL}/onboarding/response`, {
        session_id: sessionId,
        question_id: questionId,
        response_value: value
      }, { headers: getAuthHeaders() })
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao salvar resposta')
      throw err
    }
  }

  const completeOnboarding = async (sessionId: number) => {
    try {
      const response = await axios.post(`${API_URL}/onboarding/complete`, { session_id: sessionId }, { headers: getAuthHeaders() })
      return response.data
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao completar onboarding')
      throw err
    }
  }

  const getStatus = async (clientId: number) => {
    try {
      const response = await axios.get(`${API_URL}/onboarding/status/${clientId}`, { headers: getAuthHeaders() })
      return response.data.data
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao buscar status')
      throw err
    }
  }

  return {
    loading,
    questions,
    session,
    error,
    startOnboarding,
    saveResponse,
    completeOnboarding,
    getStatus
  }
}
