'use client'

import { useState, useEffect } from 'react'
import { FiFileText, FiDollarSign, FiCheckCircle, FiAlertCircle, FiTrendingUp, FiCalendar, FiArrowRight, FiBarChart2, FiActivity, FiClock, FiUpload } from 'react-icons/fi'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useDocumentosStats } from '@/hooks/useDocumentos'
import { monthlyProcessingService } from '@/services/monthlyProcessingService'
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

const MONTH_NAMES = [
  '', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

export default function ClienteDashboard() {
  const router = useRouter()
  const { stats, loading } = useDocumentosStats()
  const [onboardingStatus, setOnboardingStatus] = useState<any>(null)
  const [checkingOnboarding, setCheckingOnboarding] = useState(true)
  const [pendingCycle, setPendingCycle] = useState<any>(null)
  const [hasAccountingConfig, setHasAccountingConfig] = useState(false)

  useEffect(() => {
    checkOnboardingStatus()
    checkPendingCycle()
    checkAccountingConfig()
  }, [])

  const checkOnboardingStatus = async () => {
    try {
      const savedUser = localStorage.getItem('user')
      if (!savedUser) return

      const user = JSON.parse(savedUser)
      const token = localStorage.getItem('token')
      const response = await axios.get(`${API_URL}/onboarding/status/${user.id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      })
      setOnboardingStatus(response.data.data)
    } catch (err: any) {
      if (err.response?.status === 404) {
        setOnboardingStatus(null)
      }
    } finally {
      setCheckingOnboarding(false)
    }
  }

  const checkPendingCycle = async () => {
    try {
      const savedUser = localStorage.getItem('user')
      if (!savedUser) return
      const user = JSON.parse(savedUser)
      const cycle = await monthlyProcessingService.getActiveCycle(user.id)
      if (cycle && cycle.status === 'PENDING_DOCS') {
        setPendingCycle(cycle)
      }
    } catch (err) {
      // silently fail
    }
  }

  const checkAccountingConfig = async () => {
    try {
      const savedUser = localStorage.getItem('user')
      if (!savedUser) return
      const user = JSON.parse(savedUser)
      const token = localStorage.getItem('token')
      const response = await axios.get(`${API_URL}/clients/${user.id}/accounting-config`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      })
      if (response.data?.data) {
        setHasAccountingConfig(true)
      }
    } catch (err) {
      // 404 = não tem config ainda
    }
  }

  const onboardingCompleted = onboardingStatus?.session?.status === 'COMPLETED'
  const needsOnboarding = !checkingOnboarding && !onboardingCompleted
  const waitingApproval = onboardingCompleted && !hasAccountingConfig

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">

        {/* Configuration Alert - Critical Action Required */}
        {needsOnboarding && (
          <div className="mb-6 lg:mb-8 relative overflow-hidden bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl lg:rounded-2xl shadow-2xl border border-slate-700">
            <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
            <div className="relative px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
              <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-amber-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                  <FiAlertCircle className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                    <h2 className="text-xl sm:text-2xl font-bold text-white">Configuração Inicial Pendente</h2>
                    <span className="px-3 py-1 bg-amber-500/20 text-amber-300 text-xs font-semibold rounded-full border border-amber-500/30 w-fit">
                      AÇÃO NECESSÁRIA
                    </span>
                  </div>
                  <p className="text-slate-300 text-sm sm:text-base mb-4 sm:mb-6 leading-relaxed">
                    Para ativar seu sistema de contabilidade automatizada, precisamos de algumas informações
                    sobre sua empresa e regime tributário.
                  </p>
                  <button
                    onClick={() => router.push('/cliente/onboarding')}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-slate-900 rounded-xl hover:bg-slate-100 transition-all font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    Iniciar Configuração
                    <FiArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Waiting for Contador Approval */}
        {waitingApproval && (
          <div className="mb-6 lg:mb-8 bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-xl lg:rounded-2xl shadow-lg border border-emerald-500 overflow-hidden">
            <div className="px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FiClock className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-white">Aguardando Aprovação do Contador</h2>
                  <p className="text-emerald-100 text-sm mt-1">
                    Seu questionário foi enviado com sucesso! Seu contador está revisando suas informações
                    e configurando seu regime tributário. Você será notificado quando estiver pronto.
                  </p>
                </div>
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <FiCheckCircle className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pending Documents Notification */}
        {!needsOnboarding && !waitingApproval && pendingCycle && (
          <div className="mb-6 lg:mb-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl lg:rounded-2xl shadow-lg border border-blue-500 overflow-hidden">
            <div className="px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FiUpload className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-white">
                    Documentos Pendentes - {MONTH_NAMES[pendingCycle.referenceMonth]} {pendingCycle.referenceYear}
                  </h2>
                  <p className="text-blue-100 text-sm mt-1">
                    Envie seus documentos do mês para que possamos calcular seus impostos e gerar seus relatórios.
                  </p>
                </div>
                <button
                  onClick={() => router.push('/cliente/documentos')}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-blue-700 rounded-xl hover:bg-blue-50 transition-all font-semibold shadow-lg"
                >
                  Enviar Documentos
                  <FiArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Header Section */}
        {!needsOnboarding && (
          <div className="mb-6 lg:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-1">Painel de Controle</h1>
                <p className="text-sm sm:text-base text-slate-600">Visão completa da sua gestão contábil</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="px-3 sm:px-4 py-2 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs sm:text-sm font-semibold text-green-700">Sistema Operacional</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Primary Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 lg:mb-8">
          {/* Pending Documents */}
          <div className="group relative bg-white rounded-xl lg:rounded-2xl border border-slate-200 p-4 sm:p-6 hover:shadow-xl transition-all duration-300 hover:border-amber-300">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl lg:rounded-2xl"></div>
            <div className="relative">
              <div className="flex items-start justify-between mb-3 sm:mb-4">
                <div className="p-2.5 sm:p-3 bg-amber-100 rounded-lg sm:rounded-xl">
                  <FiClock className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600" />
                </div>
                <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded">PENDENTE</span>
              </div>
              <p className="text-xs sm:text-sm font-medium text-slate-600 mb-1">Documentos Pendentes</p>
              <p className="text-2xl sm:text-3xl font-bold text-slate-900">{loading ? '...' : stats.pendentes}</p>
              <div className="mt-3 pt-3 border-t border-slate-100">
                <Link href="/cliente/documentos" className="text-xs font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1">
                  Enviar agora
                  <FiArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>

          {/* Processed Documents */}
          <div className="group relative bg-white rounded-xl lg:rounded-2xl border border-slate-200 p-4 sm:p-6 hover:shadow-xl transition-all duration-300 hover:border-green-300">
            <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl lg:rounded-2xl"></div>
            <div className="relative">
              <div className="flex items-start justify-between mb-3 sm:mb-4">
                <div className="p-2.5 sm:p-3 bg-green-100 rounded-lg sm:rounded-xl">
                  <FiCheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                </div>
                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded">OK</span>
              </div>
              <p className="text-xs sm:text-sm font-medium text-slate-600 mb-1">Processados</p>
              <p className="text-2xl sm:text-3xl font-bold text-slate-900">{loading ? '...' : stats.processados}</p>
              <div className="mt-3 pt-3 border-t border-slate-100">
                <p className="text-xs text-slate-500">Últimos 30 dias</p>
              </div>
            </div>
          </div>

          {/* Next Tax Payment */}
          <div className="group relative bg-white rounded-xl lg:rounded-2xl border border-slate-200 p-4 sm:p-6 hover:shadow-xl transition-all duration-300 hover:border-blue-300">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl lg:rounded-2xl"></div>
            <div className="relative">
              <div className="flex items-start justify-between mb-3 sm:mb-4">
                <div className="p-2.5 sm:p-3 bg-blue-100 rounded-lg sm:rounded-xl">
                  <FiDollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                </div>
                <FiCalendar className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
              </div>
              <p className="text-xs sm:text-sm font-medium text-slate-600 mb-1">Próximo Vencimento</p>
              <p className="text-2xl sm:text-3xl font-bold text-slate-900">DAS</p>
              <div className="mt-3 pt-3 border-t border-slate-100">
                <Link href="/cliente/impostos" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                  Ver detalhes
                  <FiArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>

          {/* Total Documents */}
          <div className="group relative bg-white rounded-xl lg:rounded-2xl border border-slate-200 p-4 sm:p-6 hover:shadow-xl transition-all duration-300 hover:border-slate-300">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl lg:rounded-2xl"></div>
            <div className="relative">
              <div className="flex items-start justify-between mb-3 sm:mb-4">
                <div className="p-2.5 sm:p-3 bg-slate-100 rounded-lg sm:rounded-xl">
                  <FiFileText className="w-5 h-5 sm:w-6 sm:h-6 text-slate-600" />
                </div>
                <FiTrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
              </div>
              <p className="text-xs sm:text-sm font-medium text-slate-600 mb-1">Total de Documentos</p>
              <p className="text-2xl sm:text-3xl font-bold text-slate-900">{loading ? '...' : stats.total}</p>
              <div className="mt-3 pt-3 border-t border-slate-100">
                <p className="text-xs text-slate-500">Base de dados completa</p>
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Grid - Actions & Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">

          {/* Quick Actions Panel */}
          <div className="lg:col-span-2 bg-white rounded-xl lg:rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-base sm:text-lg font-bold text-slate-900">Ações Rápidas</h3>
              <FiActivity className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <Link
                href="/cliente/documentos"
                className="group relative overflow-hidden bg-gradient-to-br from-slate-50 to-white border-2 border-slate-200 rounded-lg sm:rounded-xl p-4 sm:p-5 hover:border-blue-400 transition-all hover:shadow-lg"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-600 opacity-0 group-hover:opacity-5 transition-opacity"></div>
                <div className="relative">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-2 sm:mb-3 group-hover:bg-blue-500 transition-colors">
                    <FiFileText className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 group-hover:text-white transition-colors" />
                  </div>
                  <h4 className="font-semibold text-sm sm:text-base text-slate-900 mb-1">Enviar Documentos</h4>
                  <p className="text-xs sm:text-sm text-slate-600">Upload de NFe, recibos e comprovantes</p>
                </div>
              </Link>

              <Link
                href="/cliente/impostos"
                className="group relative overflow-hidden bg-gradient-to-br from-slate-50 to-white border-2 border-slate-200 rounded-lg sm:rounded-xl p-4 sm:p-5 hover:border-green-400 transition-all hover:shadow-lg"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-green-600 opacity-0 group-hover:opacity-5 transition-opacity"></div>
                <div className="relative">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center mb-2 sm:mb-3 group-hover:bg-green-500 transition-colors">
                    <FiDollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 group-hover:text-white transition-colors" />
                  </div>
                  <h4 className="font-semibold text-sm sm:text-base text-slate-900 mb-1">Gestão de Impostos</h4>
                  <p className="text-xs sm:text-sm text-slate-600">DAS, DARF e cálculos tributários</p>
                </div>
              </Link>

              <Link
                href="/cliente/declaracoes"
                className="group relative overflow-hidden bg-gradient-to-br from-slate-50 to-white border-2 border-slate-200 rounded-lg sm:rounded-xl p-4 sm:p-5 hover:border-purple-400 transition-all hover:shadow-lg"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-purple-600 opacity-0 group-hover:opacity-5 transition-opacity"></div>
                <div className="relative">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-2 sm:mb-3 group-hover:bg-purple-500 transition-colors">
                    <FiBarChart2 className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 group-hover:text-white transition-colors" />
                  </div>
                  <h4 className="font-semibold text-sm sm:text-base text-slate-900 mb-1">Declarações</h4>
                  <p className="text-xs sm:text-sm text-slate-600">Obrigações acessórias e relatórios</p>
                </div>
              </Link>

              <Link
                href="/cliente/chat"
                className="group relative overflow-hidden bg-gradient-to-br from-slate-50 to-white border-2 border-slate-200 rounded-lg sm:rounded-xl p-4 sm:p-5 hover:border-amber-400 transition-all hover:shadow-lg"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-amber-600 opacity-0 group-hover:opacity-5 transition-opacity"></div>
                <div className="relative">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-amber-100 rounded-lg flex items-center justify-center mb-2 sm:mb-3 group-hover:bg-amber-500 transition-colors">
                    <FiActivity className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600 group-hover:text-white transition-colors" />
                  </div>
                  <h4 className="font-semibold text-sm sm:text-base text-slate-900 mb-1">Assistente IA</h4>
                  <p className="text-xs sm:text-sm text-slate-600">Tire dúvidas com inteligência artificial</p>
                </div>
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
