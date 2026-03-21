'use client'

import { useState, useEffect } from 'react'
import { FiUsers, FiFileText, FiAlertCircle, FiCheckCircle, FiClock, FiTrendingUp, FiArrowRight, FiActivity } from 'react-icons/fi'
import Link from 'next/link'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

interface DashboardStats {
  total_clientes: number
  clientes_ativos: number
  clientes_pendentes: number
  documentos_pendentes: number
  documentos_processados_mes: number
  ciclos_em_andamento: number
  aprovacoes_pendentes: number
}

interface ClientePendente {
  id: string
  name: string
  cnpj: string
  status: string
  docs_pendentes: number
  aprovado: boolean
}

interface Performance {
  documentos_processados: number
  das_gerados: number
  ciclos_concluidos: number
  taxa_sucesso: number
}

export default function ContadorDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [clientesPendentes, setClientesPendentes] = useState<ClientePendente[]>([])
  const [performance, setPerformance] = useState<Performance | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token')
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Buscar estatísticas
      const statsRes = await fetch(`${API_URL}/contador/dashboard/stats`, {
        headers: getAuthHeaders()
      })

      if (!statsRes.ok) throw new Error('Erro ao carregar estatísticas')
      const statsData = await statsRes.json()
      setStats(statsData.data)

      // Buscar clientes pendentes
      const pendentesRes = await fetch(`${API_URL}/contador/dashboard/clientes-pendentes`, {
        headers: getAuthHeaders()
      })

      if (!pendentesRes.ok) throw new Error('Erro ao carregar clientes pendentes')
      const pendentesData = await pendentesRes.json()
      setClientesPendentes(pendentesData.data || [])

      // Buscar performance
      const performanceRes = await fetch(`${API_URL}/contador/dashboard/performance`, {
        headers: getAuthHeaders()
      })

      if (!performanceRes.ok) throw new Error('Erro ao carregar performance')
      const performanceData = await performanceRes.json()
      setPerformance(performanceData.data)

    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Carregando dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <div className="text-center bg-red-50 border border-red-200 rounded-xl p-8 max-w-md">
          <FiAlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <p className="text-red-900 font-semibold mb-2">Erro ao carregar dados</p>
          <p className="text-red-700 text-sm mb-4">{error}</p>
          <button
            onClick={loadDashboardData}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">

        {/* Header */}
        <div className="mb-6 lg:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
            Painel de Controle
          </h1>
          <p className="text-sm sm:text-base text-slate-600">
            Visão geral de todos os clientes e atividades
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 lg:mb-8">

          {/* Total Clientes */}
          <Link href="/contador/clientes" className="group relative bg-white rounded-xl lg:rounded-2xl border border-slate-200 p-4 sm:p-6 hover:shadow-xl transition-all duration-300 hover:border-blue-300">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl lg:rounded-2xl"></div>
            <div className="relative">
              <div className="flex items-start justify-between mb-3 sm:mb-4">
                <div className="p-2.5 sm:p-3 bg-blue-100 rounded-lg sm:rounded-xl">
                  <FiUsers className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                </div>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-slate-600 mb-1">Total Clientes</p>
              <p className="text-2xl sm:text-3xl font-bold text-slate-900">{stats?.total_clientes || 0}</p>
              <div className="mt-3 flex items-center text-xs text-blue-600 font-semibold">
                <span>Ver todos</span>
                <FiArrowRight className="ml-1 w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          {/* Clientes Ativos */}
          <div className="group relative bg-white rounded-xl lg:rounded-2xl border border-slate-200 p-4 sm:p-6 hover:shadow-xl transition-all duration-300 hover:border-green-300">
            <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl lg:rounded-2xl"></div>
            <div className="relative">
              <div className="flex items-start justify-between mb-3 sm:mb-4">
                <div className="p-2.5 sm:p-3 bg-green-100 rounded-lg sm:rounded-xl">
                  <FiCheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                </div>
                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded">ATIVO</span>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-slate-600 mb-1">Clientes Ativos</p>
              <p className="text-2xl sm:text-3xl font-bold text-green-600">{stats?.clientes_ativos || 0}</p>
            </div>
          </div>

          {/* Aprovações Pendentes */}
          <div className="group relative bg-white rounded-xl lg:rounded-2xl border border-slate-200 p-4 sm:p-6 hover:shadow-xl transition-all duration-300 hover:border-amber-300">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl lg:rounded-2xl"></div>
            <div className="relative">
              <div className="flex items-start justify-between mb-3 sm:mb-4">
                <div className="p-2.5 sm:p-3 bg-amber-100 rounded-lg sm:rounded-xl">
                  <FiClock className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600" />
                </div>
                <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded">PENDENTE</span>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-slate-600 mb-1">Aprovações Pendentes</p>
              <p className="text-2xl sm:text-3xl font-bold text-amber-600">{stats?.aprovacoes_pendentes || 0}</p>
            </div>
          </div>

          {/* Documentos Pendentes */}
          <div className="group relative bg-white rounded-xl lg:rounded-2xl border border-slate-200 p-4 sm:p-6 hover:shadow-xl transition-all duration-300 hover:border-red-300">
            <div className="absolute inset-0 bg-gradient-to-br from-red-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl lg:rounded-2xl"></div>
            <div className="relative">
              <div className="flex items-start justify-between mb-3 sm:mb-4">
                <div className="p-2.5 sm:p-3 bg-red-100 rounded-lg sm:rounded-xl">
                  <FiFileText className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
                </div>
                <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded">ATENÇÃO</span>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-slate-600 mb-1">Docs Pendentes</p>
              <p className="text-2xl sm:text-3xl font-bold text-red-600">{stats?.documentos_pendentes || 0}</p>
            </div>
          </div>

        </div>

        {/* Grid de 2 Colunas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">

          {/* Clientes Necessitam Atenção */}
          <div className="bg-white rounded-xl lg:rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <FiAlertCircle className="w-5 h-5 text-amber-600" />
                </div>
                <h2 className="text-lg font-bold text-slate-900">Clientes Necessitam Atenção</h2>
              </div>
              <Link href="/contador/clientes?status=pendente" className="text-sm font-semibold text-blue-600 hover:text-blue-700">
                Ver todos
              </Link>
            </div>

            <div className="space-y-3">
              {clientesPendentes.length === 0 ? (
                <div className="text-center py-8">
                  <FiCheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <p className="text-slate-600 font-medium">Nenhum cliente pendente!</p>
                  <p className="text-slate-500 text-sm">Todos os clientes estão em dia</p>
                </div>
              ) : (
                clientesPendentes.map((cliente) => (
                  <div key={cliente.id} className="group flex items-start gap-3 sm:gap-4 p-3 sm:p-4 bg-slate-50 hover:bg-slate-100 rounded-lg transition-all cursor-pointer">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 truncate">{cliente.name}</p>
                      <p className="text-sm text-slate-600">{cliente.cnpj}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          cliente.status === 'ativo' ? 'bg-green-100 text-green-700' :
                          cliente.status === 'pendente' ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {cliente.status.toUpperCase()}
                        </span>
                        {cliente.docs_pendentes > 0 && (
                          <span className="text-xs text-slate-600">
                            {cliente.docs_pendentes} docs pendentes
                          </span>
                        )}
                      </div>
                    </div>
                    <Link
                      href={`/contador/clientes/${cliente.id}`}
                      className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
                    >
                      Ver
                      <FiArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Performance do Mês */}
          <div className="bg-white rounded-xl lg:rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4 sm:mb-6">
              <div className="p-2 bg-purple-100 rounded-lg">
                <FiTrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Performance do Mês</h2>
            </div>

            <div className="space-y-4">
              {/* Docs Processados */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-slate-700">Documentos Processados</span>
                  <span className="text-lg font-bold text-blue-600">{performance?.documentos_processados || 0}</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((performance?.documentos_processados || 0) / 100 * 100, 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* DAS Gerados */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-slate-700">DAS Gerados</span>
                  <span className="text-lg font-bold text-green-600">{performance?.das_gerados || 0}</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((performance?.das_gerados || 0) / 50 * 100, 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* Ciclos Concluídos */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-slate-700">Ciclos Concluídos</span>
                  <span className="text-lg font-bold text-purple-600">{performance?.ciclos_concluidos || 0}</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((performance?.ciclos_concluidos || 0) / 30 * 100, 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* Taxa de Sucesso */}
              <div className="pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-700">Taxa de Sucesso</span>
                  <span className="text-2xl font-bold text-green-600">{performance?.taxa_sucesso || 0}%</span>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  )
}
