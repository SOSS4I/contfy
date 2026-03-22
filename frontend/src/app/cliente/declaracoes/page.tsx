'use client'

import { useEffect, useState } from 'react'
import { FiFileText, FiDownload, FiCheck, FiClock, FiAlertCircle, FiDollarSign } from 'react-icons/fi'
import { useAuth } from '@/contexts/AuthContext'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

function getAuthHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  return { Authorization: token ? `Bearer ${token}` : '' }
}

interface Declaracao {
  id: string
  tipo: string
  periodo: string
  mes: number
  ano: number
  descricao: string
  status: 'enviada' | 'processando' | 'pendente'
  valor: number | null
  aliquota_efetiva?: number | null
  receita_bruta?: number | null
  das_pdf_path?: string | null
  data_processamento?: string | null
  meses_processados?: number
  total_meses?: number
}

export default function DeclaracoesPage() {
  const { user } = useAuth()
  const [mensais, setMensais] = useState<Declaracao[]>([])
  const [anuais, setAnuais] = useState<Declaracao[]>([])
  const [stats, setStats] = useState({ total: 0, enviadas: 0, pendentes: 0, processando: 0 })
  const [regime, setRegime] = useState('')
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'mensais' | 'anuais'>('mensais')

  useEffect(() => {
    if (user) fetchDeclaracoes()
  }, [user])

  const fetchDeclaracoes = async () => {
    try {
      const res = await fetch(`${API_URL}/declaracoes/minhas`, { headers: getAuthHeaders() })
      if (res.ok) {
        const data = await res.json()
        setMensais(data.data?.mensais || [])
        setAnuais(data.data?.anuais || [])
        setStats(data.data?.stats || { total: 0, enviadas: 0, pendentes: 0, processando: 0 })
        setRegime(data.data?.regime || '')
      }
    } catch {
      // silently handle - user sees loading state resolve
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number | null) => {
    if (value === null || value === undefined) return '-'
    return `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'enviada':
        return <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-50 text-green-600">Concluída</span>
      case 'processando':
        return <span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-50 text-blue-600">Em Processamento</span>
      case 'pendente':
        return <span className="text-xs font-medium px-2 py-1 rounded-full bg-yellow-50 text-yellow-600">Pendente</span>
      default:
        return null
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'enviada': return <FiCheck className="w-5 h-5 text-green-600" />
      case 'processando': return <FiClock className="w-5 h-5 text-blue-600" />
      case 'pendente': return <FiAlertCircle className="w-5 h-5 text-yellow-600" />
      default: return null
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    )
  }

  const currentList = tab === 'mensais' ? mensais : anuais

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Minhas Declarações</h1>
        <p className="text-gray-600 mt-1">
          Obrigações fiscais {regime === 'SIMPLES_NACIONAL' ? '(Simples Nacional)' : regime === 'LUCRO_PRESUMIDO' ? '(Lucro Presumido)' : ''}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <FiFileText className="w-5 h-5 text-gray-400" />
            <p className="text-xs text-gray-500">Total</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <FiCheck className="w-5 h-5 text-green-500" />
            <p className="text-xs text-gray-500">Concluídas</p>
          </div>
          <p className="text-2xl font-bold text-green-600">{stats.enviadas}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <FiClock className="w-5 h-5 text-blue-500" />
            <p className="text-xs text-gray-500">Processando</p>
          </div>
          <p className="text-2xl font-bold text-blue-600">{stats.processando}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <FiAlertCircle className="w-5 h-5 text-yellow-500" />
            <p className="text-xs text-gray-500">Pendentes</p>
          </div>
          <p className="text-2xl font-bold text-yellow-600">{stats.pendentes}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setTab('mensais')}
            className={`flex-1 px-4 py-3 text-sm font-medium text-center transition-colors ${
              tab === 'mensais' ? 'text-green-600 border-b-2 border-green-600 bg-green-50/50' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <FiDollarSign className="w-4 h-4 inline mr-1" />
            Mensais ({mensais.length})
          </button>
          <button
            onClick={() => setTab('anuais')}
            className={`flex-1 px-4 py-3 text-sm font-medium text-center transition-colors ${
              tab === 'anuais' ? 'text-green-600 border-b-2 border-green-600 bg-green-50/50' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <FiFileText className="w-4 h-4 inline mr-1" />
            Anuais ({anuais.length})
          </button>
        </div>

        <div className="divide-y divide-gray-100">
          {currentList.length === 0 ? (
            <div className="p-12 text-center">
              <FiFileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">
                {tab === 'mensais' ? 'Nenhuma obrigação mensal registrada' : 'Nenhuma declaração anual registrada'}
              </p>
              <p className="text-sm text-gray-500">
                As obrigações aparecerão aqui após serem processadas pelo seu contador.
              </p>
            </div>
          ) : (
            currentList.map((dec) => (
              <div key={dec.id} className="p-4 sm:p-5 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="p-2 bg-gray-50 rounded-lg flex-shrink-0">
                      {getStatusIcon(dec.status)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-sm text-gray-900">{dec.tipo} - {dec.periodo}</h3>
                        {getStatusBadge(dec.status)}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{dec.descricao}</p>
                      {dec.data_processamento && (
                        <p className="text-xs text-gray-400 mt-0.5">Processado em {dec.data_processamento}</p>
                      )}
                      {dec.meses_processados !== undefined && (
                        <p className="text-xs text-gray-400 mt-0.5">{dec.meses_processados}/{dec.total_meses} meses processados</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                    {dec.valor !== null && (
                      <span className="text-sm font-semibold text-gray-900">{formatCurrency(dec.valor)}</span>
                    )}
                    {dec.status === 'enviada' && dec.das_pdf_path && (
                      <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Baixar PDF">
                        <FiDownload className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
