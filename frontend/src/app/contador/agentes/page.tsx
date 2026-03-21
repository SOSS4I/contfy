'use client'

import { useState, useEffect } from 'react'
import { FiCpu, FiActivity, FiCheck, FiClock, FiRefreshCw } from 'react-icons/fi'
import api from '@/services/api'

const AGENTS_INFO = [
  { id: 1, nome: 'Document Request Agent', tipo: 'Solicitação de Documentos', description: 'Analisa a configuração do cliente e solicita os documentos necessários para o mês' },
  { id: 2, nome: 'Document Validator', tipo: 'Validação de Documentos', description: 'Verifica se todos os documentos obrigatórios foram enviados corretamente' },
  { id: 3, nome: 'NFe Extractor', tipo: 'Extração de NFe', description: 'Extrai dados das Notas Fiscais (XML) e calcula totais de receita e despesas' },
  { id: 4, nome: 'Tax Calculator (Simples)', tipo: 'Cálculo de Impostos', description: 'Calcula DAS do Simples Nacional com base no anexo, faixa e Fator R' },
  { id: 5, nome: 'Tax Calculator (Presumido)', tipo: 'Cálculo de Impostos', description: 'Calcula IRPJ e CSLL para empresas no Lucro Presumido' },
  { id: 6, nome: 'DAS/DARF Generator', tipo: 'Geração de Guias', description: 'Gera o PDF do DAS ou DARF para pagamento dos impostos' },
  { id: 7, nome: 'Accounting Journal', tipo: 'Lançamentos Contábeis', description: 'Gera lançamentos contábeis (débito/crédito) do período' },
  { id: 8, nome: 'Report Generator', tipo: 'Relatório Gerencial', description: 'Gera DRE, relatório de desempenho e insights para o cliente' },
  { id: 9, nome: 'Balance Validator', tipo: 'Validação Contábil', description: 'Valida que total de débitos = total de créditos nos lançamentos' },
  { id: 10, nome: 'Tax Consistency Validator', tipo: 'Validação Fiscal', description: 'Verifica consistência dos dados fiscais calculados' },
  { id: 11, nome: 'Data Integrity Validator', tipo: 'Validação Final', description: 'Validação completa de integridade, retorna score de 0-100' },
]

export default function AgentesPage() {
  const [cyclesCount, setCyclesCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      setLoading(true)
      const res = await api.get('/contador/dashboard/stats')
      const stats = res.data
      setCyclesCount(stats.cycles_in_progress || 0)
    } catch {
      // Dashboard stats may not be available
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Agentes de IA</h1>
        <p className="text-gray-600 mt-1">11 agentes especializados processam a contabilidade automaticamente</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-600">Total de Agentes</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">11</p>
          <p className="text-xs text-green-600 mt-2">Todos inicializados</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-600">Pipeline</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">Sequencial</p>
          <p className="text-xs text-gray-500 mt-2">Agentes 1-11 em ordem</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-600">Ciclos em Processamento</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">{loading ? '...' : cyclesCount}</p>
          <p className="text-xs text-gray-500 mt-2">Neste momento</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Pipeline de Processamento Mensal</h2>
          <p className="text-sm text-gray-500 mt-1">Cada ciclo mensal passa por todos os agentes em sequência</p>
        </div>
        <div className="divide-y divide-gray-100">
          {AGENTS_INFO.map((agente, idx) => (
            <div key={agente.id} className="p-4 sm:p-6 hover:bg-gray-50">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <span className="text-sm font-bold text-blue-600">{agente.id}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-sm font-semibold text-gray-900">{agente.nome}</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium">{agente.tipo}</span>
                  </div>
                  <p className="text-sm text-gray-500">{agente.description}</p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs font-medium text-green-600">Ativo</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
