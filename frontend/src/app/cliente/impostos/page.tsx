'use client'

import { useEffect, useState } from 'react'
import { FiDollarSign, FiDownload, FiCalendar, FiTrendingUp, FiAlertCircle, FiRefreshCw, FiChevronDown, FiChevronUp } from 'react-icons/fi'
import { useAuth } from '@/contexts/AuthContext'
import { monthlyProcessingService } from '@/services/monthlyProcessingService'

interface ImpostoItem {
  cycle_id: number
  competencia: string
  tipo: string
  regime: string
  anexo?: string
  receita_bruta: number
  aliquota_efetiva: number
  valor_devido: number
  vencimento: string
  das_pdf_path?: string
  breakdown: Record<string, number>
  report_summary?: {
    receita_bruta: number
    lucro_liquido: number
    margem_liquida: number
    impostos: number
  }
}

const formatCurrency = (value: number | null | undefined) =>
  `R$ ${(value ?? 0).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`

const formatDate = (dateStr: string) => {
  if (!dateStr) return '--'
  try {
    const [y, m, d] = dateStr.split('-')
    return `${d}/${m}/${y}`
  } catch { return dateStr }
}

export default function ImpostosPage() {
  const { user } = useAuth()
  const [impostos, setImpostos] = useState<ImpostoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [downloading, setDownloading] = useState<number | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user?.id) loadImpostos()
  }, [user])

  const loadImpostos = async () => {
    try {
      setLoading(true)
      const data = await monthlyProcessingService.getClientHistory(user!.id)
      setImpostos(data.impostos || [])
    } catch (err: any) {
      // Erro ao carregar impostos
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadDAS = async (cycleId: number) => {
    try {
      setDownloading(cycleId)
      const blob = await monthlyProcessingService.downloadDAS(cycleId)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `DAS_${cycleId}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err: any) {
      setError('Erro ao baixar DAS: ' + (err.response?.data?.error || err.message))
      setTimeout(() => setError(''), 5000)
    } finally {
      setDownloading(null)
    }
  }

  const totalCalculado = impostos.reduce((s, i) => s + i.valor_devido, 0)
  const mediaMensal = impostos.length > 0 ? totalCalculado / impostos.length : 0

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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Meus Impostos</h1>
        <p className="text-gray-600 mt-1">Acompanhe seus impostos e guias de pagamento</p>
      </div>

      {/* Resumo Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-50 rounded-lg"><FiDollarSign className="w-6 h-6 text-blue-600" /></div>
          </div>
          <p className="text-sm text-gray-600 mb-1">Total Calculado</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalCalculado)}</p>
          <p className="text-xs text-gray-500 mt-1">{impostos.length} competência(s)</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-50 rounded-lg"><FiTrendingUp className="w-6 h-6 text-green-600" /></div>
          </div>
          <p className="text-sm text-gray-600 mb-1">Média Mensal</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(mediaMensal)}</p>
          <p className="text-xs text-gray-500 mt-1">Baseado no histórico</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-50 rounded-lg"><FiCalendar className="w-6 h-6 text-purple-600" /></div>
          </div>
          <p className="text-sm text-gray-600 mb-1">Próximo Vencimento</p>
          <p className="text-2xl font-bold text-gray-900">{impostos.length > 0 ? formatDate(impostos[0].vencimento) : '--'}</p>
          <p className="text-xs text-gray-500 mt-1">{impostos.length > 0 ? impostos[0].tipo : '--'}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-amber-50 rounded-lg"><FiAlertCircle className="w-6 h-6 text-amber-600" /></div>
          </div>
          <p className="text-sm text-gray-600 mb-1">Alíquota Efetiva</p>
          <p className="text-2xl font-bold text-gray-900">{impostos.length > 0 ? `${impostos[0].aliquota_efetiva?.toFixed(2)}%` : '--'}</p>
          <p className="text-xs text-gray-500 mt-1">{impostos.length > 0 && impostos[0].anexo ? `Anexo ${impostos[0].anexo}` : '--'}</p>
        </div>
      </div>

      {/* Guias de Pagamento */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Guias de Pagamento</h2>
          <p className="text-sm text-gray-600 mt-1">DAS / DARF gerados pelo processamento mensal</p>
        </div>

        {impostos.length === 0 ? (
          <div className="p-12 text-center">
            <FiCalendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">Nenhum imposto calculado ainda</p>
            <p className="text-sm text-gray-500">
              Seus cálculos e guias aparecerão aqui após o processamento mensal dos seus documentos.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {impostos.map((imposto) => (
              <div key={imposto.cycle_id}>
                <div className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900">{imposto.tipo} - {imposto.competencia}</h3>
                        <span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-50 text-blue-600">
                          {imposto.regime === 'SIMPLES_NACIONAL' ? 'Simples Nacional' : 'Lucro Presumido'}
                          {imposto.anexo ? ` - Anexo ${imposto.anexo}` : ''}
                        </span>
                      </div>
                      <div className="flex items-center gap-6 text-sm text-gray-600">
                        <span>Receita: {formatCurrency(imposto.receita_bruta)}</span>
                        <span>Alíquota: {imposto.aliquota_efetiva?.toFixed(2)}%</span>
                        <span>Vencimento: {formatDate(imposto.vencimento)}</span>
                      </div>
                      <p className="text-xl font-bold text-gray-900 mt-2">{formatCurrency(imposto.valor_devido)}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {imposto.das_pdf_path && (
                        <button
                          onClick={() => handleDownloadDAS(imposto.cycle_id)}
                          disabled={downloading === imposto.cycle_id}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium flex items-center gap-2 disabled:opacity-50"
                        >
                          {downloading === imposto.cycle_id ? <FiRefreshCw className="w-4 h-4 animate-spin" /> : <FiDownload className="w-4 h-4" />}
                          Baixar {imposto.tipo}
                        </button>
                      )}
                      <button
                        onClick={() => setExpandedId(expandedId === imposto.cycle_id ? null : imposto.cycle_id)}
                        className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                      >
                        {expandedId === imposto.cycle_id ? <FiChevronUp /> : <FiChevronDown />}
                      </button>
                    </div>
                  </div>
                </div>

                {expandedId === imposto.cycle_id && (
                  <div className="px-6 pb-6 bg-gray-50 border-t border-gray-100">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-3">Detalhamento do Imposto</h4>
                        <div className="space-y-2">
                          {Object.entries(imposto.breakdown).map(([key, value]) => (
                            value > 0 && (
                              <div key={key} className="flex justify-between text-sm">
                                <span className="text-gray-600">{key}</span>
                                <span className="font-medium text-gray-900">{formatCurrency(value)}</span>
                              </div>
                            )
                          ))}
                          <div className="flex justify-between text-sm pt-2 border-t border-gray-200 font-semibold">
                            <span>Total</span>
                            <span>{formatCurrency(imposto.valor_devido)}</span>
                          </div>
                        </div>
                      </div>

                      {imposto.report_summary && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-3">Resumo Financeiro</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Receita Bruta</span>
                              <span className="font-medium">{formatCurrency(imposto.report_summary.receita_bruta)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Impostos</span>
                              <span className="font-medium text-red-600">-{formatCurrency(imposto.report_summary.impostos)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Lucro Líquido</span>
                              <span className={`font-medium ${imposto.report_summary.lucro_liquido >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatCurrency(imposto.report_summary.lucro_liquido)}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
                              <span className="text-gray-600">Margem Líquida</span>
                              <span className={`font-semibold ${imposto.report_summary.margem_liquida >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {imposto.report_summary.margem_liquida?.toFixed(2)}%
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
