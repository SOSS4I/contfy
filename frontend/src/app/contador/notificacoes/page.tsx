'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, CheckCircle, AlertCircle, Clock, User, FileText, ChevronRight } from 'lucide-react'

interface Notification {
  id: number
  type: 'READY_TO_REVIEW' | 'NEEDS_ANALYSIS'
  status: string
  title: string
  message: string
  severity: string
  regime: string
  confidence_score: string
  client_name: string
  client_email: string
  created_at: string
  completed_at: string
}

interface Stats {
  total: number
  pending: number
  reviewed: number
  ready_to_review: number
  needs_analysis: number
}

export default function NotificacoesPage() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'green' | 'red'>('all')

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_URL}/admin/notifications`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      setNotifications(data.data)
      setStats(data.stats)
    } catch {
      // silently handle
    } finally {
      setLoading(false)
    }
  }

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'all') return true
    if (filter === 'green') return n.type === 'READY_TO_REVIEW'
    if (filter === 'red') return n.type === 'NEEDS_ANALYSIS'
    return true
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Bell className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Notificações de Clientes</h1>
          </div>
          <p className="text-gray-600">Novos clientes que completaram o onboarding aguardando sua análise</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Total</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.total || 0}</p>
              </div>
              <Bell className="w-10 h-10 text-gray-400" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Pendentes</p>
                <p className="text-3xl font-bold text-orange-600">{stats?.pending || 0}</p>
              </div>
              <Clock className="w-10 h-10 text-orange-400" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-sm border border-green-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700 font-medium">🟢 Prontos</p>
                <p className="text-3xl font-bold text-green-600">{stats?.ready_to_review || 0}</p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-xl shadow-sm border border-red-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-700 font-medium">🔴 Análise</p>
                <p className="text-3xl font-bold text-red-600">{stats?.needs_analysis || 0}</p>
              </div>
              <AlertCircle className="w-10 h-10 text-red-500" />
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 mb-6 inline-flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${
              filter === 'all'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Todas ({stats?.total || 0})
          </button>
          <button
            onClick={() => setFilter('green')}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${
              filter === 'green'
                ? 'bg-green-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            🟢 Prontos ({stats?.ready_to_review || 0})
          </button>
          <button
            onClick={() => setFilter('red')}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${
              filter === 'red'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            🔴 Análise ({stats?.needs_analysis || 0})
          </button>
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              onClick={() => router.push(`/contador/notificacoes/${notification.id}`)}
              className={`bg-white rounded-xl shadow-sm border-l-4 p-6 hover:shadow-md transition-all cursor-pointer ${
                notification.type === 'READY_TO_REVIEW'
                  ? 'border-green-500 hover:border-green-600'
                  : 'border-red-500 hover:border-red-600'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-3">
                    {notification.type === 'READY_TO_REVIEW' ? (
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                        <AlertCircle className="w-6 h-6 text-red-600" />
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{notification.title}</h3>
                      <p className="text-sm text-gray-600">{notification.message}</p>
                    </div>
                  </div>

                  {/* Client Info */}
                  <div className="flex items-center gap-6 pl-13 mb-3">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-700">{notification.client_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{notification.regime}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">
                        Confiança: <span className="font-semibold">{(parseFloat(notification.confidence_score) * 100).toFixed(0)}%</span>
                      </span>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pl-13">
                    <span className="text-xs text-gray-500">
                      {new Date(notification.created_at).toLocaleString('pt-BR')}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      notification.status === 'PENDING'
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {notification.status}
                    </span>
                  </div>
                </div>

                {/* Arrow */}
                <ChevronRight className="w-5 h-5 text-gray-400 ml-4" />
              </div>
            </div>
          ))}
        </div>

        {filteredNotifications.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
            <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg font-medium">Nenhuma notificação encontrada</p>
            <p className="text-gray-500 text-sm mt-2">Quando novos clientes completarem o onboarding, aparecerão aqui</p>
          </div>
        )}
      </div>
    </div>
  )
}
