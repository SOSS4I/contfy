'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  FileText,
  Building2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Sparkles
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { humanizeQuizResponses, formatCNPJ, formatCPF } from '@/utils/humanizeQuizResponses'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

interface NotificationDetails {
  id: number
  client_id: number
  type: 'READY_TO_REVIEW' | 'NEEDS_ANALYSIS'
  status: string
  title: string
  message: string
  severity: string
  regime: string
  confidence_score: string
  client_name: string
  client_email: string
  client_phone?: string
  cnpj?: string
  cpf?: string
  address?: string
  created_at: string
  completed_at: string
  classification_data?: any
  applicable_laws?: any[]
  tax_recommendations?: any
  legal_confidence?: string
  questionnaire_responses?: Array<{
    question_text: string
    question_key: string
    response_value: string
  }>
}

export default function NotificationDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const [notification, setNotification] = useState<NotificationDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  // Configuração do contador
  const [regimeTributario, setRegimeTributario] = useState('SIMPLES_NACIONAL')
  const [anexoSimples, setAnexoSimples] = useState('I')
  const [contadorInstructions, setContadorInstructions] = useState('')
  const [documentsDeadlineDay, setDocumentsDeadlineDay] = useState(10)
  const [feedbackMsg, setFeedbackMsg] = useState('')
  const [feedbackType, setFeedbackType] = useState<'success' | 'error'>('success')
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  useEffect(() => {
    fetchNotificationDetails()
  }, [params?.id])

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token')
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }

  const fetchNotificationDetails = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/notifications/${params?.id}`, {
        headers: getAuthHeaders()
      })
      const data = await res.json()
      setNotification(data.data)

      // Pre-preencher com recomendação da IA
      if (data.data.regime) {
        if (data.data.regime.includes('Simples')) {
          setRegimeTributario('SIMPLES_NACIONAL')
        } else if (data.data.regime.includes('Presumido')) {
          setRegimeTributario('LUCRO_PRESUMIDO')
        } else if (data.data.regime.includes('Real')) {
          setRegimeTributario('LUCRO_REAL')
        }
      }
    } catch (error) {
      // Erro ao buscar detalhes
    } finally {
      setLoading(false)
    }
  }

  const contadorId = user?.id || null

  const handleApprove = async () => {
    setActionLoading(true)
    try {
      // Primeiro, salvar configuração do cliente
      await fetch(`${API_URL}/clients/${notification!.client_id}/accounting-config`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          regime_tributario: regimeTributario,
          anexo_simples: regimeTributario === 'SIMPLES_NACIONAL' ? anexoSimples : null,
          contador_instructions: contadorInstructions,
          documents_deadline_day: documentsDeadlineDay,
          approved_by: contadorId
        })
      })

      // Depois, marcar notificação como aprovada
      await fetch(`${API_URL}/admin/notifications/${params?.id}/review`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          status: 'APPROVED',
          contador_notes: `Regime: ${regimeTributario}${regimeTributario === 'SIMPLES_NACIONAL' ? ` - Anexo ${anexoSimples}` : ''}. Prazo docs: dia ${documentsDeadlineDay}`,
          contador_id: contadorId
        })
      })

      router.push('/contador/notificacoes')
    } catch {
      setFeedbackMsg('Erro ao aprovar cliente. Tente novamente.')
      setFeedbackType('error')
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async () => {
    setShowRejectModal(true)
  }

  const confirmReject = async () => {
    if (!rejectReason.trim()) return

    setActionLoading(true)
    setShowRejectModal(false)
    try {
      await fetch(`${API_URL}/admin/notifications/${params?.id}/review`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          status: 'REJECTED',
          contador_notes: rejectReason,
          contador_id: contadorId
        })
      })
      router.push('/contador/notificacoes')
    } catch {
      setFeedbackMsg('Erro ao rejeitar. Tente novamente.')
      setFeedbackType('error')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
      </div>
    )
  }

  if (!notification) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Notificação não encontrada</p>
        </div>
      </div>
    )
  }

  const isGreen = notification.type === 'READY_TO_REVIEW'

  // Converter respostas do questionário em objeto
  const responsesObj: Record<string, any> = {}
  notification.questionnaire_responses?.forEach((response) => {
    responsesObj[response.question_key] = response.response_value
  })

  const humanizedResponses = humanizeQuizResponses(responsesObj)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <button
          onClick={() => router.push('/contador/notificacoes')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Voltar para Notificações</span>
        </button>

        {/* Alert Banner */}
        <div className={`mb-6 p-4 rounded-xl border-l-4 ${
          isGreen
            ? 'bg-green-50 border-green-500'
            : 'bg-red-50 border-red-500'
        }`}>
          <div className="flex items-center gap-3">
            {isGreen ? (
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
            )}
            <div className="flex-1">
              <h2 className={`font-bold text-lg ${isGreen ? 'text-green-900' : 'text-red-900'}`}>
                {notification.title}
              </h2>
              <p className={`text-sm ${isGreen ? 'text-green-700' : 'text-red-700'}`}>
                {notification.message}
              </p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              notification.status === 'PENDING'
                ? 'bg-orange-100 text-orange-700'
                : notification.status === 'APPROVED'
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            }`}>
              {notification.status}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Client Info & AI Analysis */}
          <div className="lg:col-span-2 space-y-6">
            {/* Client Information Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-6 h-6 text-blue-600" />
                Informações do Cliente
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Nome</p>
                    <p className="font-semibold text-gray-900 truncate">{notification.client_name}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Email</p>
                    <p className="font-semibold text-gray-900 truncate">{notification.client_email}</p>
                  </div>
                </div>
                {notification.client_phone && (
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <Phone className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Telefone</p>
                      <p className="font-semibold text-gray-900">{notification.client_phone}</p>
                    </div>
                  </div>
                )}
                {notification.cnpj && (
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-5 h-5 text-orange-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 uppercase tracking-wide">CNPJ</p>
                      <p className="font-semibold text-gray-900">{formatCNPJ(notification.cnpj)}</p>
                    </div>
                  </div>
                )}
                {notification.cpf && (
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-pink-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 uppercase tracking-wide">CPF</p>
                      <p className="font-semibold text-gray-900">{formatCPF(notification.cpf)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* AI Analysis Card */}
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl shadow-sm border border-purple-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-purple-600" />
                Análise da Inteligência Artificial
              </h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-purple-700 font-medium mb-2">Regime Tributário Recomendado</p>
                  <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-purple-200">
                    <p className="text-xl font-bold text-purple-900">{notification.regime}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-purple-700 font-medium mb-2">Confiança da Análise</p>
                  <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-purple-200">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-purple-200 rounded-full h-4">
                        <div
                          className="bg-gradient-to-r from-purple-500 to-indigo-600 h-4 rounded-full transition-all duration-500"
                          style={{ width: `${parseFloat(notification.confidence_score) * 100}%` }}
                        />
                      </div>
                      <span className="text-2xl font-bold text-purple-900">
                        {(parseFloat(notification.confidence_score) * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>

                {notification.applicable_laws && notification.applicable_laws.length > 0 && (
                  <div>
                    <p className="text-sm text-purple-700 font-medium mb-2">Leis Aplicáveis Identificadas</p>
                    <div className="space-y-2">
                      {notification.applicable_laws.slice(0, 3).map((law: any, idx: number) => (
                        <div key={idx} className="bg-white/70 backdrop-blur-sm rounded-lg p-3 border border-purple-200">
                          <p className="font-semibold text-purple-900 text-sm">{law.law_name}</p>
                          <p className="text-xs text-purple-700 mt-1">{law.description}</p>
                        </div>
                      ))}
                      {notification.applicable_laws.length > 3 && (
                        <p className="text-xs text-purple-600 text-center">
                          + {notification.applicable_laws.length - 3} leis adicionais
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Questionnaire Responses - HUMANIZED */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="w-6 h-6 text-gray-700" />
                Informações Fornecidas pelo Cliente
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {humanizedResponses.map((response, idx) => (
                  <div key={idx} className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all">
                    <p className="text-xs text-gray-600 mb-1 flex items-center gap-2">
                      <span>{response.icon}</span>
                      <span className="uppercase tracking-wide">{response.question}</span>
                    </p>
                    <p className="text-gray-900 font-semibold">{response.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Configuration Form */}
          {notification.status === 'PENDING' && (
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-lg border-2 border-blue-200 p-6 sticky top-6">
                <h2 className="text-xl font-bold text-gray-900 mb-1 flex items-center gap-2">
                  <CheckCircle className="w-6 h-6 text-blue-600" />
                  Configuração do Cliente
                </h2>
                <p className="text-sm text-gray-600 mb-6">
                  Defina como a IA processará a contabilidade mensal deste cliente
                </p>

                <div className="space-y-5">
                  {/* Regime Tributário */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Regime Tributário <span className="text-red-500">*</span>
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center gap-3 p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all">
                        <input
                          type="radio"
                          name="regime"
                          value="SIMPLES_NACIONAL"
                          checked={regimeTributario === 'SIMPLES_NACIONAL'}
                          onChange={(e) => setRegimeTributario(e.target.value)}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-sm font-medium text-gray-900">Simples Nacional</span>
                      </label>
                      <label className="flex items-center gap-3 p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all">
                        <input
                          type="radio"
                          name="regime"
                          value="LUCRO_PRESUMIDO"
                          checked={regimeTributario === 'LUCRO_PRESUMIDO'}
                          onChange={(e) => setRegimeTributario(e.target.value)}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-sm font-medium text-gray-900">Lucro Presumido</span>
                      </label>
                      <label className="flex items-center gap-3 p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all">
                        <input
                          type="radio"
                          name="regime"
                          value="LUCRO_REAL"
                          checked={regimeTributario === 'LUCRO_REAL'}
                          onChange={(e) => setRegimeTributario(e.target.value)}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-sm font-medium text-gray-900">Lucro Real</span>
                      </label>
                    </div>
                  </div>

                  {/* Anexo do Simples Nacional */}
                  {regimeTributario === 'SIMPLES_NACIONAL' && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Anexo do Simples <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={anexoSimples}
                        onChange={(e) => setAnexoSimples(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-medium"
                      >
                        <option value="I">Anexo I - Comércio</option>
                        <option value="II">Anexo II - Indústria</option>
                        <option value="III">Anexo III - Serviços (Fator R ≥ 28%)</option>
                        <option value="IV">Anexo IV - Serviços Específicos</option>
                        <option value="V">Anexo V - Serviços (Fator R &lt; 28%)</option>
                      </select>
                    </div>
                  )}

                  {/* Prazo para Envio de Documentos */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Prazo Mensal para Documentos
                    </label>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-600">Todo dia</span>
                      <select
                        value={documentsDeadlineDay}
                        onChange={(e) => setDocumentsDeadlineDay(Number(e.target.value))}
                        className="px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-medium"
                      >
                        {Array.from({ length: 28 }, (_, i) => i + 1).map(day => (
                          <option key={day} value={day}>{day}</option>
                        ))}
                      </select>
                      <span className="text-sm text-gray-600">de cada mes</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      O cliente sera notificado para enviar os documentos ate esta data
                    </p>
                  </div>

                  {/* Instruções Especiais */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Instruções Especiais para a IA
                    </label>
                    <textarea
                      value={contadorInstructions}
                      onChange={(e) => setContadorInstructions(e.target.value)}
                      placeholder="Ex: Cliente tem sublimite de ICMS. Verificar sempre CFOP de exportação. Possui atividade mista..."
                      rows={4}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm resize-none"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      A IA usara estas instrucoes para processar a contabilidade mensal deste cliente
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-4 border-t border-gray-200 space-y-3">
                    <button
                      onClick={handleApprove}
                      disabled={actionLoading}
                      className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3.5 rounded-lg font-bold hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                    >
                      {actionLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle className="w-5 h-5" />
                          <span>Aprovar Cliente</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleReject}
                      disabled={actionLoading}
                      className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <XCircle className="w-5 h-5" />
                      <span>Rejeitar / Solicitar Mais Informações</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Feedback Message */}
          {feedbackMsg && (
            <div className={`mt-4 p-4 rounded-lg ${feedbackType === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
              {feedbackMsg}
            </div>
          )}
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-3">Motivo da Rejeição</h3>
            <p className="text-sm text-gray-600 mb-4">Informe o que o cliente deve fazer ou corrigir:</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
              rows={4}
              placeholder="Ex: Documentação incompleta, verificar CNAE..."
              autoFocus
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => { setShowRejectModal(false); setRejectReason('') }}
                className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg font-semibold hover:bg-gray-200"
              >
                Cancelar
              </button>
              <button
                onClick={confirmReject}
                disabled={!rejectReason.trim() || actionLoading}
                className="flex-1 bg-red-600 text-white py-2.5 rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading ? 'Enviando...' : 'Confirmar Rejeição'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
