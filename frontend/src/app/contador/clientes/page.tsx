'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  FiSearch,
  FiFilter,
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiFileText,
  FiDollarSign,
  FiUser,
  FiChevronRight,
  FiDownload,
  FiEye
} from 'react-icons/fi'
import clsx from 'clsx'

interface Cliente {
  id: string
  name: string
  cnpj: string
  regime_tributario: string
  status: 'ativo' | 'pendente' | 'inativo' | 'problema'
  aprovado: boolean
  docs_pendentes: number
  docs_processados: number
  ultimo_envio: string | null
  proxima_obrigacao: string | null
  problemas: string[]
  email: string
  telefone: string
  responsavel: string
  created_at: string
}


const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

function getAuthHeaders() {
  const token = localStorage.getItem('token')
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  }
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [filteredClientes, setFilteredClientes] = useState<Cliente[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('todos')
  const [regimeFilter, setRegimeFilter] = useState<string>('todos')
  const [showFilters, setShowFilters] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load clientes from API
  useEffect(() => {
    const loadClientes = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(`${API_URL}/contador/clientes`, {
          headers: getAuthHeaders()
        })

        if (!response.ok) {
          throw new Error(`Erro ao carregar clientes: ${response.status}`)
        }

        const data = await response.json()

        if (data.success && data.data) {
          setClientes(data.data)
        } else {
          throw new Error('Formato de resposta inválido')
        }

      } catch (error: any) {
        setError(error.message || 'Erro ao carregar clientes')
        setClientes([])
      } finally {
        setLoading(false)
      }
    }

    loadClientes()
  }, [])

  // Filter logic
  useEffect(() => {
    let filtered = clientes

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.cnpj.includes(searchTerm) ||
          c.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== 'todos') {
      filtered = filtered.filter((c) => c.status === statusFilter)
    }

    // Regime filter
    if (regimeFilter !== 'todos') {
      filtered = filtered.filter((c) => c.regime_tributario === regimeFilter)
    }

    setFilteredClientes(filtered)
  }, [searchTerm, statusFilter, regimeFilter, clientes])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativo':
        return 'bg-green-100 text-green-700 border-green-200'
      case 'pendente':
        return 'bg-amber-100 text-amber-700 border-amber-200'
      case 'problema':
        return 'bg-red-100 text-red-700 border-red-200'
      case 'inativo':
        return 'bg-slate-100 text-slate-700 border-slate-200'
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ativo':
        return <FiCheckCircle className="w-4 h-4" />
      case 'pendente':
        return <FiClock className="w-4 h-4" />
      case 'problema':
        return <FiAlertCircle className="w-4 h-4" />
      default:
        return <FiUser className="w-4 h-4" />
    }
  }

  const stats = {
    total: clientes.length,
    ativos: clientes.filter((c) => c.status === 'ativo').length,
    pendentes: clientes.filter((c) => c.status === 'pendente').length,
    problemas: clientes.filter((c) => c.status === 'problema').length
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">

        {/* Header */}
        <div className="mb-6 lg:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
            Gestão de Clientes
          </h1>
          <p className="text-sm sm:text-base text-slate-600">
            Gerencie todos os clientes do sistema e acompanhe o status de cada um
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 lg:mb-8">
          {/* Total */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs sm:text-sm font-medium text-slate-600">Total</span>
              <div className="p-2 bg-slate-100 rounded-lg">
                <FiUser className="w-4 h-4 text-slate-600" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-slate-900">{stats.total}</p>
          </div>

          {/* Ativos */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs sm:text-sm font-medium text-slate-600">Ativos</span>
              <div className="p-2 bg-green-100 rounded-lg">
                <FiCheckCircle className="w-4 h-4 text-green-600" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-green-600">{stats.ativos}</p>
          </div>

          {/* Pendentes */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs sm:text-sm font-medium text-slate-600">Pendentes</span>
              <div className="p-2 bg-amber-100 rounded-lg">
                <FiClock className="w-4 h-4 text-amber-600" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-amber-600">{stats.pendentes}</p>
          </div>

          {/* Problemas */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs sm:text-sm font-medium text-slate-600">Problemas</span>
              <div className="p-2 bg-red-100 rounded-lg">
                <FiAlertCircle className="w-4 h-4 text-red-600" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-red-600">{stats.problemas}</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 shadow-sm mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar por nome, CNPJ ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white outline-none transition-all text-sm font-medium text-slate-700 placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Filter Toggle Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={clsx(
                'flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all font-semibold text-sm',
                showFilters
                  ? 'bg-blue-50 border-blue-500 text-blue-700'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-blue-400'
              )}
            >
              <FiFilter className="w-5 h-5" />
              <span className="hidden sm:inline">Filtros</span>
            </button>
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-200">
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm font-medium text-slate-700"
                >
                  <option value="todos">Todos os Status</option>
                  <option value="ativo">Ativos</option>
                  <option value="pendente">Pendentes</option>
                  <option value="problema">Com Problemas</option>
                  <option value="inativo">Inativos</option>
                </select>
              </div>

              {/* Regime Filter */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Regime Tributário
                </label>
                <select
                  value={regimeFilter}
                  onChange={(e) => setRegimeFilter(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm font-medium text-slate-700"
                >
                  <option value="todos">Todos os Regimes</option>
                  <option value="Simples Nacional">Simples Nacional</option>
                  <option value="Lucro Presumido">Lucro Presumido</option>
                  <option value="Lucro Real">Lucro Real</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="mb-4">
          <p className="text-sm text-slate-600">
            Exibindo <span className="font-bold text-slate-900">{filteredClientes.length}</span> de{' '}
            <span className="font-bold text-slate-900">{clientes.length}</span> clientes
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <FiAlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-red-900 mb-1">Erro ao carregar clientes</h3>
                <p className="text-sm text-red-700">{error}</p>
                <p className="text-xs text-red-600 mt-2">Exibindo dados de exemplo temporariamente.</p>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <div className="animate-spin w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-4"></div>
            <p className="text-lg font-semibold text-slate-700">Carregando clientes...</p>
          </div>
        ) : (
          /* Clients List */
          <div className="space-y-3 sm:space-y-4">
            {filteredClientes.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <FiSearch className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-lg font-semibold text-slate-700 mb-2">
                Nenhum cliente encontrado
              </p>
              <p className="text-sm text-slate-500">
                Tente ajustar os filtros ou termo de busca
              </p>
            </div>
          ) : (
            filteredClientes.map((cliente) => (
              <div
                key={cliente.id}
                className="group bg-white rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all duration-200 overflow-hidden"
              >
                <div className="p-4 sm:p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">

                    {/* Client Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-bold text-slate-900 mb-1 truncate">
                            {cliente.name}
                          </h3>
                          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
                            <span className="font-medium">{cliente.cnpj}</span>
                            <span className="text-slate-300">•</span>
                            <span>{cliente.regime_tributario}</span>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div className={clsx(
                          'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-bold text-xs whitespace-nowrap',
                          getStatusColor(cliente.status)
                        )}>
                          {getStatusIcon(cliente.status)}
                          <span className="capitalize">{cliente.status}</span>
                        </div>
                      </div>

                      {/* Metrics */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                        {/* Docs Pendentes */}
                        <div className="flex items-center gap-2">
                          <div className={clsx(
                            'p-2 rounded-lg',
                            cliente.docs_pendentes > 0 ? 'bg-amber-100' : 'bg-slate-100'
                          )}>
                            <FiFileText className={clsx(
                              'w-4 h-4',
                              cliente.docs_pendentes > 0 ? 'text-amber-600' : 'text-slate-600'
                            )} />
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 font-medium">Pendentes</p>
                            <p className={clsx(
                              'text-sm font-bold',
                              cliente.docs_pendentes > 0 ? 'text-amber-600' : 'text-slate-700'
                            )}>
                              {cliente.docs_pendentes}
                            </p>
                          </div>
                        </div>

                        {/* Docs Processados */}
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-green-100 rounded-lg">
                            <FiCheckCircle className="w-4 h-4 text-green-600" />
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 font-medium">Processados</p>
                            <p className="text-sm font-bold text-green-600">{cliente.docs_processados}</p>
                          </div>
                        </div>

                        {/* Aprovação */}
                        <div className="flex items-center gap-2">
                          <div className={clsx(
                            'p-2 rounded-lg',
                            cliente.aprovado ? 'bg-green-100' : 'bg-amber-100'
                          )}>
                            {cliente.aprovado ? (
                              <FiCheckCircle className="w-4 h-4 text-green-600" />
                            ) : (
                              <FiClock className="w-4 h-4 text-amber-600" />
                            )}
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 font-medium">Aprovação</p>
                            <p className={clsx(
                              'text-sm font-bold',
                              cliente.aprovado ? 'text-green-600' : 'text-amber-600'
                            )}>
                              {cliente.aprovado ? 'Aprovado' : 'Pendente'}
                            </p>
                          </div>
                        </div>

                        {/* Próxima Obrigação */}
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <FiDollarSign className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 font-medium">Próxima</p>
                            <p className="text-sm font-bold text-blue-600">
                              {cliente.proxima_obrigacao
                                ? new Date(cliente.proxima_obrigacao).toLocaleDateString('pt-BR')
                                : 'N/A'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Problemas */}
                      {cliente.problemas.length > 0 && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                          <div className="flex items-start gap-2">
                            <FiAlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-red-900 mb-1">
                                Problemas Identificados ({cliente.problemas.length})
                              </p>
                              <ul className="space-y-1">
                                {cliente.problemas.map((problema, idx) => (
                                  <li key={idx} className="text-xs text-red-700">
                                    • {problema}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Additional Info */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                        <span>Responsável: <span className="font-medium text-slate-700">{cliente.responsavel}</span></span>
                        <span className="hidden sm:inline text-slate-300">•</span>
                        <span>Cliente desde: <span className="font-medium text-slate-700">{new Date(cliente.created_at).toLocaleDateString('pt-BR')}</span></span>
                        {cliente.ultimo_envio && (
                          <>
                            <span className="hidden sm:inline text-slate-300">•</span>
                            <span>Último envio: <span className="font-medium text-slate-700">{new Date(cliente.ultimo_envio).toLocaleDateString('pt-BR')}</span></span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex lg:flex-col gap-2 lg:items-end">
                      <Link
                        href={`/contador/clientes/${cliente.id}`}
                        className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:from-blue-700 hover:to-blue-600 transition-all font-semibold text-sm shadow-md hover:shadow-lg group"
                      >
                        <FiEye className="w-4 h-4" />
                        <span>Ver Detalhes</span>
                        <FiChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </Link>

                      <button className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-all font-semibold text-sm">
                        <FiDownload className="w-4 h-4" />
                        <span className="hidden sm:inline">Relatório</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
          </div>
        )}
      </div>
    </div>
  )
}
