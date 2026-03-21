'use client'

import { useState, useEffect } from 'react'
import { FiCheckCircle, FiAlertCircle, FiChevronRight, FiChevronLeft } from 'react-icons/fi'
import { useOnboarding, OnboardingQuestion } from '@/hooks/useOnboarding'
import { useRouter } from 'next/navigation'
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

export default function OnboardingPage() {
  const router = useRouter()
  const { loading, questions, startOnboarding, saveResponse, completeOnboarding, error } = useOnboarding()

  const [currentStep, setCurrentStep] = useState(0)
  const [sessionId, setSessionId] = useState<number | null>(null)
  const [responses, setResponses] = useState<Record<string, any>>({})
  const [saving, setSaving] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [localError, setLocalError] = useState('')
  const [alreadyCompleted, setAlreadyCompleted] = useState(false)

  useEffect(() => {
    initOnboarding()
  }, [])

  const initOnboarding = async () => {
    try {
      const savedUser = localStorage.getItem('user')
      if (!savedUser) {
        router.push('/login')
        return
      }

      const user = JSON.parse(savedUser)

      // Primeiro checar status do onboarding
      try {
        const token = localStorage.getItem('token')
        const statusRes = await axios.get(`${API_URL}/onboarding/status/${user.id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        })
        const statusData = statusRes.data

        if (statusData.has_onboarding && statusData.data?.session?.status === 'COMPLETED') {
          // Onboarding já completo - redirecionar para dashboard
          setAlreadyCompleted(true)
          return
        }
      } catch (err) {
        // Se falhar, continuar normalmente
      }

      const result = await startOnboarding(user.id)

      // Checar se a resposta indica que já foi completado
      if (result.already_completed || result.status === 'COMPLETED') {
        setAlreadyCompleted(true)
        return
      }

      setSessionId(result.id)
    } catch (err) {
      // Erro silencioso ao iniciar onboarding
    }
  }

  // Função para verificar se uma pergunta deve ser exibida com base na lógica condicional
  const shouldShowQuestion = (question: OnboardingQuestion): boolean => {
    if (!question.isConditional || !question.conditionLogic) {
      return true
    }

    try {
      const condition = typeof question.conditionLogic === 'string'
        ? JSON.parse(question.conditionLogic)
        : question.conditionLogic

      const fieldValue = responses[condition.field]

      // Se o campo pai ainda não foi respondido, não mostrar a condicional
      if (fieldValue === undefined || fieldValue === null || fieldValue === '') {
        return false
      }

      switch (condition.operator) {
        case 'equals':
          // Comparação flexível para BOOLEAN (string "true"/"false" vs boolean true/false)
          if (condition.value === true || condition.value === false) {
            return fieldValue === condition.value ||
                   fieldValue === String(condition.value) ||
                   fieldValue === 'sim' || fieldValue === 'yes'
          }
          return fieldValue === condition.value
        case 'not_equals':
          if (condition.value === true || condition.value === false) {
            const isEqual = fieldValue === condition.value ||
                           fieldValue === String(condition.value) ||
                           fieldValue === 'sim' || fieldValue === 'yes'
            return !isEqual
          }
          return fieldValue !== condition.value
        case 'includes':
        case 'contains':
          // Para MULTISELECT: verifica se o array contém o valor
          return Array.isArray(fieldValue) && fieldValue.includes(condition.value)
        case 'not_includes':
        case 'not_contains':
          return Array.isArray(fieldValue) && !fieldValue.includes(condition.value)
        default:
          return true
      }
    } catch (err) {
      return true
    }
  }

  // Encontrar próxima pergunta válida (que deve ser exibida)
  const findNextValidStep = (fromStep: number): number => {
    for (let i = fromStep + 1; i < questions.length; i++) {
      if (shouldShowQuestion(questions[i])) {
        return i
      }
    }
    return questions.length // Se não encontrar, retorna length (fim)
  }

  // Encontrar pergunta anterior válida
  const findPreviousValidStep = (fromStep: number): number => {
    for (let i = fromStep - 1; i >= 0; i--) {
      if (shouldShowQuestion(questions[i])) {
        return i
      }
    }
    return 0
  }

  const currentQuestion = questions[currentStep]

  const handleNext = async () => {
    if (!currentQuestion || !sessionId) return

    const currentValue = responses[currentQuestion.questionKey]

    // Validação básica
    if (currentValue === undefined || currentValue === null || currentValue === '' ||
        (Array.isArray(currentValue) && currentValue.length === 0)) {
      setLocalError('Por favor, responda a pergunta antes de continuar')
      return
    }

    setLocalError('')
    setSaving(true)

    try {
      // Salvar resposta no backend
      await saveResponse(sessionId, currentQuestion.id, currentValue)

      // Avançar para próxima pergunta VÁLIDA
      const nextStep = findNextValidStep(currentStep)
      if (nextStep < questions.length) {
        setCurrentStep(nextStep)
      }
    } catch (err) {
      setLocalError('Erro ao salvar resposta')
    } finally {
      setSaving(false)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      const prevStep = findPreviousValidStep(currentStep)
      setCurrentStep(prevStep)
      setLocalError('')
    }
  }

  const handleComplete = async () => {
    if (!sessionId) return

    const currentValue = responses[currentQuestion.questionKey]
    if (currentValue === undefined || currentValue === null || currentValue === '' ||
        (Array.isArray(currentValue) && currentValue.length === 0)) {
      setLocalError('Por favor, responda a pergunta antes de finalizar')
      return
    }

    setCompleting(true)
    setLocalError('')

    try {
      // Salvar última resposta
      await saveResponse(sessionId, currentQuestion.id, currentValue)

      // Completar onboarding (executar agentes de IA)
      await completeOnboarding(sessionId)

      // Redirecionar para dashboard do cliente
      router.push('/cliente')
    } catch (err) {
      setLocalError('Erro ao processar suas respostas. Tente novamente.')
    } finally {
      setCompleting(false)
    }
  }

  const renderInput = () => {
    if (!currentQuestion) return null

    const value = responses[currentQuestion.questionKey]

    switch (currentQuestion.questionType) {
      case 'TEXT':
        return (
          <textarea
            value={value || ''}
            onChange={(e) => setResponses({ ...responses, [currentQuestion.questionKey]: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg resize-none"
            placeholder="Digite sua resposta..."
            rows={currentQuestion.questionKey === 'additional_info' ? 6 : 3}
          />
        )

      case 'NUMBER':
        return (
          <input
            type="number"
            value={value ?? ''}
            onChange={(e) => setResponses({ ...responses, [currentQuestion.questionKey]: parseInt(e.target.value) || 0 })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
            placeholder="Digite um número..."
            min="0"
          />
        )

      case 'BOOLEAN':
        return (
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => setResponses({ ...responses, [currentQuestion.questionKey]: true })}
              className={`w-full px-6 py-4 rounded-lg border-2 transition text-left ${
                value === true
                  ? 'border-blue-600 bg-blue-50 text-blue-900'
                  : 'border-gray-300 hover:border-blue-400'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-lg font-medium">Sim</span>
                {value === true && <FiCheckCircle className="w-6 h-6 text-blue-600" />}
              </div>
            </button>
            <button
              type="button"
              onClick={() => setResponses({ ...responses, [currentQuestion.questionKey]: false })}
              className={`w-full px-6 py-4 rounded-lg border-2 transition text-left ${
                value === false
                  ? 'border-blue-600 bg-blue-50 text-blue-900'
                  : 'border-gray-300 hover:border-blue-400'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-lg font-medium">Não</span>
                {value === false && <FiCheckCircle className="w-6 h-6 text-blue-600" />}
              </div>
            </button>
          </div>
        )

      case 'SELECT':
        const optionsData = typeof currentQuestion.options === 'string'
          ? JSON.parse(currentQuestion.options)
          : currentQuestion.options
        const choices = optionsData?.choices || []

        return (
          <div className="space-y-3">
            {choices.map((choice: any) => (
              <button
                key={choice.value}
                type="button"
                onClick={() => setResponses({ ...responses, [currentQuestion.questionKey]: choice.value })}
                className={`w-full px-6 py-4 rounded-lg border-2 transition text-left ${
                  (value || '') === choice.value
                    ? 'border-blue-600 bg-blue-50 text-blue-900'
                    : 'border-gray-300 hover:border-blue-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-lg font-medium">{choice.label}</span>
                  {(value || '') === choice.value && <FiCheckCircle className="w-6 h-6 text-blue-600" />}
                </div>
              </button>
            ))}
          </div>
        )

      case 'MULTISELECT':
        const multiOptionsData = typeof currentQuestion.options === 'string'
          ? JSON.parse(currentQuestion.options)
          : currentQuestion.options
        const multiChoices = multiOptionsData?.choices || []
        const selectedValues = Array.isArray(value) ? value : []

        return (
          <div className="space-y-3">
            <p className="text-sm text-gray-500 mb-2">Selecione todas as opções que se aplicam</p>
            {multiChoices.map((choice: any) => {
              const isSelected = selectedValues.includes(choice.value)
              return (
                <button
                  key={choice.value}
                  type="button"
                  onClick={() => {
                    const newValues = isSelected
                      ? selectedValues.filter((v: any) => v !== choice.value)
                      : [...selectedValues, choice.value]
                    setResponses({ ...responses, [currentQuestion.questionKey]: newValues })
                  }}
                  className={`w-full px-6 py-4 rounded-lg border-2 transition text-left ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50 text-blue-900'
                      : 'border-gray-300 hover:border-blue-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-medium">{choice.label}</span>
                    {isSelected && <FiCheckCircle className="w-6 h-6 text-blue-600" />}
                  </div>
                </button>
              )
            })}
          </div>
        )

      default:
        return null
    }
  }

  // Se já completou, mostrar mensagem e redirecionar
  if (alreadyCompleted) {
    return (
      <div className="max-w-2xl mx-auto mt-12">
        <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
          <FiCheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Configuração Concluída!</h2>
          <p className="text-gray-600 mb-6">
            Seu questionário já foi preenchido e processado com sucesso.
            Aguarde seu contador revisar e aprovar sua configuração contábil.
            Após a aprovação, você receberá notificações para enviar seus documentos mensais.
          </p>
          <button
            onClick={() => router.push('/cliente')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Voltar ao Painel
          </button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando questionário...</p>
        </div>
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="max-w-2xl mx-auto mt-12">
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <FiAlertCircle className="w-8 h-8 text-yellow-600 mb-2" />
          <h3 className="text-lg font-semibold text-gray-900">Nenhuma pergunta disponível</h3>
          <p className="text-gray-600 mt-2">Entre em contato com o suporte.</p>
        </div>
      </div>
    )
  }

  // Calcular quantas perguntas serão exibidas (excluindo condicionais não aplicáveis)
  const visibleQuestions = questions.filter(q => shouldShowQuestion(q))
  const currentVisibleIndex = visibleQuestions.findIndex(q => q.id === currentQuestion?.id) + 1
  const progress = (currentVisibleIndex / visibleQuestions.length) * 100
  const isLastQuestion = findNextValidStep(currentStep) >= questions.length

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Configuração Inicial</h1>
        <p className="text-gray-600">
          Vamos conhecer melhor seu negócio para configurar sua contabilidade de forma personalizada
        </p>
      </div>

      {/* Progress Bar */}
      <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-600">
            Pergunta {currentVisibleIndex} de {visibleQuestions.length}
          </span>
          <span className="text-sm font-medium text-blue-600">{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Error Messages */}
      {(error || localError) && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <FiAlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-700">{localError || error}</p>
        </div>
      )}

      {/* Question Card */}
      <div className="bg-white rounded-xl shadow-sm border p-8 mb-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">
          {currentQuestion?.questionText}
        </h2>

        {renderInput()}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleBack}
          disabled={currentStep === 0}
          className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          <FiChevronLeft className="w-5 h-5" />
          Voltar
        </button>

        {isLastQuestion ? (
          <button
            onClick={handleComplete}
            disabled={completing || saving}
            className="flex items-center gap-2 px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
          >
            {completing ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Processando...
              </>
            ) : (
              <>
                Finalizar
                <FiCheckCircle className="w-5 h-5" />
              </>
            )}
          </button>
        ) : (
          <button
            onClick={handleNext}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Salvando...
              </>
            ) : (
              <>
                Próxima
                <FiChevronRight className="w-5 h-5" />
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
