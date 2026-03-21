'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { FiCheckCircle, FiAlertCircle, FiFileText, FiDollarSign, FiCalendar, FiBookOpen, FiHome } from 'react-icons/fi'
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

export default function ResultadosPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const sessionId = searchParams?.get('session') || null

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (sessionId) {
      loadResults()
    }
  }, [sessionId])

  const loadResults = async () => {
    try {
      const savedUser = localStorage.getItem('user')
      if (!savedUser) return

      const user = JSON.parse(savedUser)

      // Buscar status do onboarding
      const token = localStorage.getItem('token')
      const response = await axios.get(`${API_URL}/onboarding/status/${user.id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      })
      setData(response.data.data)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao carregar resultados')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando resultados...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="max-w-2xl mx-auto mt-12">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <FiAlertCircle className="w-8 h-8 text-red-600 mb-2" />
          <h3 className="text-lg font-semibold text-gray-900">Erro ao carregar resultados</h3>
          <p className="text-gray-600 mt-2">{error}</p>
          <button
            onClick={() => router.push('/cliente')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Voltar ao Dashboard
          </button>
        </div>
      </div>
    )
  }

  const { session, legal_research, classification } = data
  const taxRec = legal_research?.taxRecommendations || {}

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header Success */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-8 text-white">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center flex-shrink-0">
            <FiCheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold mb-2">Configuração Concluída!</h1>
            <p className="text-green-100 text-lg">
              Analisamos suas respostas e configuramos sua contabilidade de forma personalizada
            </p>
          </div>
        </div>
      </div>

      {/* Regime Tributário */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <FiDollarSign className="w-6 h-6 text-blue-600" />
          Regime Tributário
        </h2>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="mb-4">
            <span className="text-sm text-gray-600">Regime Identificado:</span>
            <p className="text-2xl font-bold text-blue-900 mt-1">{taxRec.regime || 'N/A'}</p>
            {taxRec.sub_regime && (
              <p className="text-lg text-blue-700 mt-1">Sub-regime: {taxRec.sub_regime}</p>
            )}
          </div>
          {taxRec.reason && (
            <div className="mt-4 pt-4 border-t border-blue-200">
              <span className="text-sm font-medium text-gray-700">Por quê?</span>
              <p className="text-gray-800 mt-2">{taxRec.reason}</p>
            </div>
          )}
        </div>
      </div>

      {/* Obrigações Mensais */}
      {taxRec.monthly_obligations && taxRec.monthly_obligations.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FiCalendar className="w-6 h-6 text-purple-600" />
            Obrigações Mensais
          </h2>
          <div className="space-y-4">
            {taxRec.monthly_obligations.map((obl: any, index: number) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 text-lg">{obl.name}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                  <div>
                    <span className="text-xs text-gray-600">Prazo:</span>
                    <p className="text-sm font-medium text-gray-800">{obl.deadline}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-600">Base de Cálculo:</span>
                    <p className="text-sm font-medium text-gray-800">{obl.base_calculation}</p>
                  </div>
                  <div className="md:col-span-2">
                    <span className="text-xs text-gray-600">Alíquota:</span>
                    <p className="text-sm font-medium text-gray-800">{obl.aliquot}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Obrigações Anuais */}
      {taxRec.annual_obligations && taxRec.annual_obligations.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FiFileText className="w-6 h-6 text-orange-600" />
            Obrigações Anuais
          </h2>
          <div className="space-y-4">
            {taxRec.annual_obligations.map((obl: any, index: number) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 text-lg">{obl.name}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                  <div>
                    <span className="text-xs text-gray-600">Prazo:</span>
                    <p className="text-sm font-medium text-gray-800">{obl.deadline}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-600">Informações Necessárias:</span>
                    <p className="text-sm font-medium text-gray-800">{obl.required_info}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Documentos Necessários */}
      {classification?.customConfig?.document_types_required &&
       classification.customConfig.document_types_required.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FiFileText className="w-6 h-6 text-indigo-600" />
            Documentos Necessários
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {classification.customConfig.document_types_required.map((doc: string, index: number) => (
              <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <FiCheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <span className="text-sm text-gray-800">{doc.replace(/_/g, ' ').toUpperCase()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Erros Comuns */}
      {taxRec.common_mistakes && taxRec.common_mistakes.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FiAlertCircle className="w-6 h-6 text-red-600" />
            Erros Comuns a Evitar
          </h2>
          <div className="space-y-4">
            {taxRec.common_mistakes.map((mistake: any, index: number) => (
              <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <FiAlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-red-900">❌ {mistake.mistake}</h3>
                    <p className="text-sm text-red-700 mt-2">
                      <strong>Por que está errado:</strong> {mistake.why_wrong}
                    </p>
                    <p className="text-sm text-green-700 mt-2">
                      <strong>✅ Correto:</strong> {mistake.correct}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recomendação Profissional */}
      {taxRec.professional_advice && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FiBookOpen className="w-6 h-6 text-green-600" />
            Orientação Profissional
          </h2>
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <p className="text-gray-800 leading-relaxed">{taxRec.professional_advice}</p>
          </div>
        </div>
      )}

      {/* Leis Aplicáveis */}
      {legal_research?.applicableLaws && legal_research.applicableLaws.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FiBookOpen className="w-6 h-6 text-gray-600" />
            Leis e Normas Aplicáveis
          </h2>
          <div className="space-y-3">
            {legal_research.applicableLaws.map((law: any, index: number) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900">{law.law}</h3>
                {law.article && <p className="text-sm text-gray-600 mt-1">{law.article}</p>}
                <p className="text-sm text-gray-700 mt-2">{law.summary}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confidence Score */}
      {legal_research?.confidenceScore && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Nível de Confiança da Análise</h2>
          <div className="flex items-center gap-4">
            <div className="flex-1 bg-gray-200 rounded-full h-3">
              <div
                className="bg-green-600 h-3 rounded-full transition-all"
                style={{ width: `${(legal_research.confidenceScore * 100).toFixed(0)}%` }}
              />
            </div>
            <span className="text-2xl font-bold text-green-600">
              {(legal_research.confidenceScore * 100).toFixed(0)}%
            </span>
          </div>
        </div>
      )}

      {/* Botão Voltar */}
      <div className="flex justify-center pb-8">
        <button
          onClick={() => router.push('/cliente')}
          className="flex items-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-lg"
        >
          <FiHome className="w-5 h-5" />
          Ir para Dashboard
        </button>
      </div>
    </div>
  )
}
