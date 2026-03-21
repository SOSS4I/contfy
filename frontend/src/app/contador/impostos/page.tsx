'use client'

import { useState, useEffect } from 'react'
import { FiDollarSign, FiTrendingUp, FiAlertCircle, FiCheck, FiDownload, FiRefreshCw } from 'react-icons/fi'
import { useAuth } from '@/contexts/AuthContext'
import api from '@/services/api'

interface ImpostoItem {
  cycle_id: number
  competencia: string
  referenceMonth: number
  referenceYear: number
  tipo: string
  regime: string
  anexo: string
  receita_bruta: number
  aliquota_efetiva: number
  valor_devido: number
  vencimento: string
  das_pdf_path: string | null
  status: string
  breakdown: Record<string, number>
  report_summary: any
  completed_at: string
  client_name?: string
  client_cnpj?: string
}

export default function ImpostosPage() {
  const { user } = useAuth()
  const [impostos, setImpostos] = useState<ImpostoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadImpostos()
  }, [])

  const loadImpostos = async () => {
    try {
      setLoading(true)
      setError('')

      // Buscar lista de clientes primeiro
      const clientesRes = await api.get('/contador/clientes')
      const clientes = clientesRes.data.data || []

      // Buscar impostos de cada cliente
      const allImpostos: ImpostoItem[] = []
      for (const cliente of clientes) {
        try {
          const histRes = await api.get(`/monthly-processing/client/${cliente.id}/history`)
          if (histRes.data.impostos) {
            histRes.data.impostos.forEach((imp: any) => {
              allImpostos.push({
                ...imp,
                client_name: cliente.name,
                client_cnpj: cliente.cnpj
              })
            })
          }
        } catch {
          // Cliente sem histórico, ignorar
        }
      }

      setImpostos(allImpostos)
    } catch (err: any) {
      setError('Erro ao carregar dados de impostos')
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadDAS = async (cycleId: number) => {
    try {
      const response = await api.get(`/monthly-processing/das/${cycleId}`, {
        responseType: 'blob'
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `DAS_${cycleId}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch {
      setError('Erro ao baixar DAS')
      setTimeout(() => setError(''), 5000)
    }
  }

  const totalDevido = impostos.reduce((sum, i) => sum + (i.valor_devido || 0), 0)
  const totalCiclos = impostos.length
  const mediaCliente = totalCiclos > 0 ? totalDevido / totalCiclos : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center gap-3 text-gray-600">
          <FiRefreshCw className="w-5 h-5 animate-spin" />
          <span>Carregando impostos...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Impostos</h1>
          <p className="text-gray-600 mt-1">Impostos calculados automaticamente pelos agentes de IA</p>
        </div>
        <button onClick={loadImpostos} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
          <FiRefreshCw className="w-4 h-4" />
          Atualizar
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <FiAlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-600">Total Calculado</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            R$ {totalDevido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-600">Ciclos Processados</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">{totalCiclos}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-600">Média por Ciclo</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            R$ {mediaCliente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Cálculos Realizados</h2>
          <p className="text-sm text-gray-500 mt-1">Impostos calculados pelos 11 agentes de IA</p>
        </div>
        {impostos.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <FiDollarSign className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">Nenhum imposto calculado ainda</p>
            <p className="text-sm mt-1">Os impostos serão exibidos aqui após o processamento mensal dos clientes</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {impostos.map((imposto, idx) => (
              <div key={idx} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-900">{imposto.client_name || 'Cliente'}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {imposto.client_cnpj} - {imposto.competencia} - {imposto.regime} {imposto.anexo ? `(${imposto.anexo})` : ''}
                    </p>
                    <p className="text-lg font-bold text-gray-900 mt-2">
                      R$ {(imposto.valor_devido || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    {imposto.breakdown && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {Object.entries(imposto.breakdown).map(([key, val]) => (
                          <span key={key} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                            {key}: R$ {(val || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-gray-400 mt-2">
                      Alíquota efetiva: {(imposto.aliquota_efetiva || 0).toFixed(2)}% - Receita: R$ {(imposto.receita_bruta || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                      <FiCheck className="w-3 h-3 inline mr-1" />
                      {imposto.status}
                    </span>
                    {imposto.das_pdf_path && (
                      <button
                        onClick={() => handleDownloadDAS(imposto.cycle_id)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        <FiDownload className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
