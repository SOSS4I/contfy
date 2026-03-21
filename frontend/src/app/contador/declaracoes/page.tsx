'use client'

import { useEffect, useState } from 'react'
import { FiFileText, FiCheck, FiClock, FiAlertCircle, FiSearch } from 'react-icons/fi'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

function getAuthHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  return { Authorization: token ? `Bearer ${token}` : '' }
}

interface Declaracao {
  id: string
  client_id: number
  client_name: string
  client_cnpj: string
  tipo: string
  periodo: string
  mes: number
  ano: number
  status: 'enviada' | 'processando' | 'pendente'
  valor: number | null
  data_processamento: string | null
}

export default function DeclaracoesPage() {
  const [declaracoes, setDeclaracoes] = useState<Declaracao[]>([])
  const [stats, setStats] = useState({ total: 0, enviadas: 0, pendentes: 0, processando: 0, clientes_ativos: 0 })
  const [loading, setLoading] = useState(true)
  const [filtroStatus, setFiltroStatus] = useState<string>('todos')
  const [busca, setBusca] = useState('')

  useEffect(() => {
    fetchDeclaracoes()
  }, [])

  const fetchDeclaracoes = async () => {
    try {
      const res = await fetch(`${API_URL}/declaracoes/all`, { headers: getAuthHeaders() })
      if (res.ok) {
        const data = await res.json()
        setDeclaracoes(data.data?.declaracoes || [])
        setStats(data.data?.stats || { total: 0, enviadas: 0, pendentes: 0, processando: 0, clientes_ativos: 0 })
      }
    } catch (err) {
      console.error('Erro ao buscar declarações:', err)
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
        return <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-50 text-green-600">Concluída</span>
      case 'processando':
        return <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">Processando</span>
      case 'pendente':
        return <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-600">Pendente</span>
      default:
        return null
    }
  }

  const filtered = declaracoes.filter(d => {
    if (filtroStatus !== 'todos' && d.status !== filtroStatus) return false
    if (busca && !d.client_name.toLowerCase().includes(busca.toLowerCase()) && !d.client_cnpj?.includes(busca)) return false
    return true
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Declarações</h1>
        <p className="text-gray-600 mt-1">Obrigações fiscais de todos os clientes (DAS, DARF, DEFIS, ECF)</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">Total</p>
          <p className="text-xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">Concluídas</p>
          <p className="text-xl font-bold text-green-600">{stats.enviadas}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">Processando</p>
          <p className="text-xl font-bold text-blue-600">{stats.processando}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">Pendentes</p>
          <p className="text-xl font-bold text-yellow-600">{stats.pendentes}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">Clientes</p>
          <p className="text-xl font-bold text-gray-900">{stats.clientes_ativos}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por cliente ou CNPJ..."
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="todos">Todos os status</option>
            <option value="enviada">Concluídas</option>
            <option value="processando">Processando</option>
            <option value="pendente">Pendentes</option>
          </select>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <FiFileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">
              {declaracoes.length === 0
                ? 'Nenhuma declaração registrada ainda. Inicie ciclos mensais para gerar obrigações.'
                : 'Nenhuma declaração encontrada com os filtros aplicados.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Cliente</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Tipo</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Período</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Valor</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((dec) => (
                  <tr key={dec.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900">{dec.client_name}</p>
                        {dec.client_cnpj && <p className="text-xs text-gray-400">{dec.client_cnpj}</p>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{dec.tipo}</td>
                    <td className="px-4 py-3 text-gray-700">{dec.periodo}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{formatCurrency(dec.valor)}</td>
                    <td className="px-4 py-3">{getStatusBadge(dec.status)}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{dec.data_processamento || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
