'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  FiArrowLeft,
  FiUser,
  FiMail,
  FiPhone,
  FiMapPin,
  FiFileText,
  FiDollarSign,
  FiCalendar,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiAlertCircle,
  FiEdit,
  FiTrendingUp,
  FiSave,
  FiSettings,
  FiPlay,
  FiPlus,
  FiTrash2
} from 'react-icons/fi'
import Link from 'next/link'
import { formatOnboardingKey, formatOnboardingValue, detectPersonType } from '@/utils/onboarding-labels'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

interface ClienteDetalhes {
  id: string
  name: string
  razaoSocial?: string
  email: string
  phone?: string
  cnpj?: string
  cpf?: string
  ie?: string
  im?: string
  endereco?: string
  cidade?: string
  estado?: string
  cep?: string
  regimeTributario?: string
  simplesNacionalAnexo?: string
  cnaePrincipal?: string
  monthlyRevenue?: number
  annualRevenue?: number
  employeeCount?: number
  status: 'ativo' | 'pendente' | 'inativo' | 'problema'
  isActive: boolean
  isVerified: boolean
  contador?: {
    name: string
    email: string
    phone?: string
  }
  accountingConfig?: any
  onboardingData?: {
    sessionId: number
    status: string
    completedAt?: string
    responses: Record<string, any>
  }
  stats: {
    total_documentos: number
    total_calculos: number
    total_ciclos: number
  }
  documentos_recentes: Array<{
    id: number
    fileName: string
    tipo: string
    status: string
    data_upload: string
    data_atualizacao: string
  }>
  ciclos_mensais: Array<{
    id: string
    mes: number
    ano: number
    status: string
    das_valor?: number
    das_vencimento?: string
    das_pago?: boolean
  }>
  calculos_impostos: Array<{
    id: number
    mes: number
    ano: number
    tipo: string
    status: string
    valor: number
    vencimento?: string
  }>
  createdAt: string
  updatedAt: string
}

interface AccountingConfig {
  id: number
  regime_tributario: string
  anexo_simples: string | null
  contador_instructions: string | null
  required_documents: any[]
  documents_deadline_day: number | null
  status: string
  has_employees: boolean
  employee_count: number
  has_prolabore: boolean
  approved_at: string
}

interface DocRequirement {
  type: string
  name: string
  description: string
  format: string
  mandatory: boolean
}

export default function ClienteDetalhesPage() {
  const params = useParams()
  const router = useRouter()
  const [cliente, setCliente] = useState<ClienteDetalhes | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Accounting config editor
  const [config, setConfig] = useState<AccountingConfig | null>(null)
  const [configLoading, setConfigLoading] = useState(false)
  const [editingConfig, setEditingConfig] = useState(false)
  const [editRegime, setEditRegime] = useState('')
  const [editAnexo, setEditAnexo] = useState('')
  const [editInstructions, setEditInstructions] = useState('')
  const [editDeadline, setEditDeadline] = useState(10)
  const [editDocs, setEditDocs] = useState<DocRequirement[]>([])
  const [saveSuccess, setSaveSuccess] = useState('')
  const [cycleLoading, setCycleLoading] = useState(false)

  useEffect(() => {
    loadClienteDetalhes()
  }, [params?.id])

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token')
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }

  const loadClienteDetalhes = async () => {
    try {
      setLoading(true)
      setError(null)

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)

      const response = await fetch(`${API_URL}/contador/clientes/${params?.id}`, {
        headers: getAuthHeaders(),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        if (response.status === 404) throw new Error('Cliente nao encontrado')
        if (response.status === 401 || response.status === 403) throw new Error('Sem permissao para acessar este cliente')
        throw new Error(`Erro ao carregar cliente (${response.status})`)
      }

      const data = await response.json()
      if (!data.success || !data.data) throw new Error('Resposta invalida do servidor')
      setCliente(data.data)

      // Load accounting config
      loadAccountingConfig()

    } catch (error: any) {
      if (error.name === 'AbortError') {
        setError('Tempo limite excedido. O servidor esta demorando para responder.')
      } else {
        setError(error.message || 'Erro desconhecido ao carregar cliente')
      }
    } finally {
      setLoading(false)
    }
  }

  const loadAccountingConfig = async () => {
    try {
      setConfigLoading(true)
      const res = await fetch(`${API_URL}/clients/${params?.id}/accounting-config`, {
        headers: getAuthHeaders()
      })
      if (res.ok) {
        const data = await res.json()
        setConfig(data.data)
        // Pre-fill edit fields
        setEditRegime(data.data.regime_tributario || '')
        setEditAnexo(data.data.anexo_simples || '')
        setEditInstructions(data.data.contador_instructions || '')
        setEditDeadline(data.data.documents_deadline_day || 10)
        setEditDocs(data.data.required_documents || [])
      }
    } catch (error) {
      // No config yet
    } finally {
      setConfigLoading(false)
    }
  }

  const handleSaveConfig = async () => {
    try {
      const res = await fetch(`${API_URL}/clients/${params?.id}/accounting-config`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          regime_tributario: editRegime,
          anexo_simples: editRegime === 'SIMPLES_NACIONAL' ? editAnexo : null,
          contador_instructions: editInstructions,
          documents_deadline_day: editDeadline,
          required_documents: editDocs
        })
      })

      if (res.ok) {
        const data = await res.json()
        setConfig(data.data)
        setEditingConfig(false)
        setSaveSuccess('Configuracao salva com sucesso!')
        setTimeout(() => setSaveSuccess(''), 3000)
        loadAccountingConfig()
      }
    } catch (err) {
      setError('Erro ao salvar configuração')
      setTimeout(() => setError(null), 5000)
    }
  }

  const handleStartCycle = async () => {
    if (!confirm('Iniciar um novo ciclo mensal para este cliente?')) return

    setCycleLoading(true)
    try {
      const now = new Date()
      const res = await fetch(`${API_URL}/monthly-processing/start`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          client_id: parseInt(params?.id as string),
          reference_month: now.getMonth() + 1,
          reference_year: now.getFullYear()
        })
      })

      if (res.ok) {
        setSaveSuccess('Ciclo mensal iniciado com sucesso!')
        setTimeout(() => setSaveSuccess(''), 3000)
        loadClienteDetalhes()
      } else {
        const data = await res.json()
        setError(data.error || data.detail || 'Erro ao iniciar ciclo')
        setTimeout(() => setError(null), 5000)
      }
    } catch (err) {
      setError('Erro ao iniciar ciclo mensal')
      setTimeout(() => setError(null), 5000)
    } finally {
      setCycleLoading(false)
    }
  }

  const addDocRequirement = () => {
    setEditDocs([...editDocs, {
      type: 'OUTRO',
      name: '',
      description: '',
      format: 'PDF',
      mandatory: false
    }])
  }

  const removeDocRequirement = (index: number) => {
    setEditDocs(editDocs.filter((_, i) => i !== index))
  }

  const updateDocRequirement = (index: number, field: string, value: any) => {
    const updated = [...editDocs]
    updated[index] = { ...updated[index], [field]: value }
    setEditDocs(updated)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativo': return 'bg-green-100 text-green-700'
      case 'pendente': return 'bg-amber-100 text-amber-700'
      case 'inativo': return 'bg-gray-100 text-gray-700'
      case 'problema': return 'bg-red-100 text-red-700'
      default: return 'bg-blue-100 text-blue-700'
    }
  }

  const getDocumentStatusColor = (status: string) => {
    switch (status) {
      case 'PROCESSED':
      case 'CLASSIFIED': return 'bg-green-100 text-green-700'
      case 'PROCESSING': return 'bg-blue-100 text-blue-700'
      case 'PENDING_REVIEW': return 'bg-amber-100 text-amber-700'
      case 'ERROR': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const formatCurrency = (value?: number) => {
    if (!value) return 'R$ 0,00'
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
  }

  const formatCNPJ = (cnpj?: string) => {
    if (!cnpj) return '-'
    return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
  }

  const formatCEP = (cep?: string) => {
    if (!cep) return '-'
    return cep.replace(/^(\d{5})(\d{3})$/, '$1-$2')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Carregando detalhes do cliente...</p>
        </div>
      </div>
    )
  }

  if (error || !cliente) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <div className="text-center bg-red-50 border border-red-200 rounded-xl p-8 max-w-md">
          <FiAlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <p className="text-red-900 font-semibold mb-2">Erro ao carregar cliente</p>
          <p className="text-red-700 text-sm mb-4">{error || 'Cliente nao encontrado'}</p>
          <button
            onClick={() => router.push('/contador/clientes')}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Voltar para lista
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">

        {/* Header */}
        <div className="mb-6">
          <Link
            href="/contador/clientes"
            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4 font-medium"
          >
            <FiArrowLeft className="w-4 h-4" />
            Voltar para clientes
          </Link>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
                {cliente.name}
              </h1>
              {cliente.razaoSocial && cliente.razaoSocial !== cliente.name && (
                <p className="text-slate-600 text-sm mb-2">{cliente.razaoSocial}</p>
              )}
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(cliente.status)}`}>
                  {cliente.status.toUpperCase()}
                </span>
                {cliente.isVerified && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                    VERIFICADO
                  </span>
                )}
                {config?.status === 'APPROVED' && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                    APROVADO
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleStartCycle}
                disabled={cycleLoading || !config}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title={!config ? 'Aprove o cliente primeiro' : 'Iniciar ciclo mensal'}
              >
                <FiPlay className="w-4 h-4" />
                {cycleLoading ? 'Iniciando...' : 'Iniciar Ciclo'}
              </button>
            </div>
          </div>
        </div>

        {/* Success message */}
        {saveSuccess && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2 text-green-700">
            <FiCheckCircle className="w-5 h-5" />
            <span className="font-medium">{saveSuccess}</span>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <FiFileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Documentos</p>
                <p className="text-2xl font-bold text-slate-900">{cliente.stats.total_documentos}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <FiDollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Calculos</p>
                <p className="text-2xl font-bold text-slate-900">{cliente.stats.total_calculos}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <FiCalendar className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Ciclos Mensais</p>
                <p className="text-2xl font-bold text-slate-900">{cliente.stats.total_ciclos}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Grid 2 Colunas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Coluna Esquerda - Informações */}
          <div className="lg:col-span-1 space-y-6">

            {/* Dados Cadastrais */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Dados Cadastrais</h2>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <FiMail className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs text-slate-500">Email</p>
                    <p className="text-sm font-medium text-slate-900">{cliente.email}</p>
                  </div>
                </div>
                {cliente.phone && (
                  <div className="flex items-start gap-3">
                    <FiPhone className="w-5 h-5 text-slate-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs text-slate-500">Telefone</p>
                      <p className="text-sm font-medium text-slate-900">{cliente.phone}</p>
                    </div>
                  </div>
                )}
                {cliente.cnpj && (
                  <div className="flex items-start gap-3">
                    <FiFileText className="w-5 h-5 text-slate-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs text-slate-500">CNPJ</p>
                      <p className="text-sm font-medium text-slate-900">{formatCNPJ(cliente.cnpj)}</p>
                    </div>
                  </div>
                )}
                {cliente.ie && (
                  <div className="flex items-start gap-3">
                    <FiFileText className="w-5 h-5 text-slate-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs text-slate-500">Inscricao Estadual</p>
                      <p className="text-sm font-medium text-slate-900">{cliente.ie}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Endereço */}
            {(cliente.endereco || cliente.cidade) && (
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h2 className="text-lg font-bold text-slate-900 mb-4">Endereco</h2>
                <div className="flex items-start gap-3">
                  <FiMapPin className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div className="flex-1 space-y-1">
                    {cliente.endereco && <p className="text-sm text-slate-900">{cliente.endereco}</p>}
                    {cliente.cidade && (
                      <p className="text-sm text-slate-600">
                        {cliente.cidade}{cliente.estado && ` - ${cliente.estado}`}
                      </p>
                    )}
                    {cliente.cep && <p className="text-sm text-slate-600">{formatCEP(cliente.cep)}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* Configuração Contábil - EDITÁVEL */}
            <div className="bg-white rounded-xl border-2 border-blue-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <FiSettings className="w-5 h-5 text-blue-600" />
                  Configuracao Contabil
                </h2>
                {config && !editingConfig && (
                  <button
                    onClick={() => setEditingConfig(true)}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <FiEdit className="w-3.5 h-3.5" />
                    Editar
                  </button>
                )}
              </div>

              {!config && !configLoading && (
                <div className="text-center py-4">
                  <FiAlertCircle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-600">Cliente ainda nao foi aprovado</p>
                  <p className="text-xs text-slate-500 mt-1">Acesse as notificacoes para aprovar</p>
                </div>
              )}

              {config && !editingConfig && (
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Regime</p>
                    <p className="text-sm font-medium text-slate-900">
                      {config.regime_tributario?.replace(/_/g, ' ')}
                    </p>
                  </div>
                  {config.anexo_simples && (
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Anexo Simples</p>
                      <p className="text-sm font-medium text-slate-900">Anexo {config.anexo_simples}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Prazo Documentos</p>
                    <p className="text-sm font-medium text-slate-900">
                      Dia {config.documents_deadline_day || 10} de cada mes
                    </p>
                  </div>
                  {config.contador_instructions && (
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Instrucoes para IA</p>
                      <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg">
                        {config.contador_instructions}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Aprovado em</p>
                    <p className="text-sm text-slate-600">
                      {config.approved_at ? new Date(config.approved_at).toLocaleDateString('pt-BR') : '-'}
                    </p>
                  </div>
                </div>
              )}

              {/* Edit Mode */}
              {editingConfig && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Regime Tributario</label>
                    <select
                      value={editRegime}
                      onChange={(e) => setEditRegime(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                    >
                      <option value="SIMPLES_NACIONAL">Simples Nacional</option>
                      <option value="LUCRO_PRESUMIDO">Lucro Presumido</option>
                      <option value="LUCRO_REAL">Lucro Real</option>
                      <option value="MEI">MEI</option>
                    </select>
                  </div>

                  {editRegime === 'SIMPLES_NACIONAL' && (
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Anexo</label>
                      <select
                        value={editAnexo}
                        onChange={(e) => setEditAnexo(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                      >
                        <option value="I">Anexo I - Comercio</option>
                        <option value="II">Anexo II - Industria</option>
                        <option value="III">Anexo III - Servicos (Fator R &ge; 28%)</option>
                        <option value="IV">Anexo IV - Servicos Especificos</option>
                        <option value="V">Anexo V - Servicos (Fator R &lt; 28%)</option>
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Prazo Documentos</label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-600">Dia</span>
                      <select
                        value={editDeadline}
                        onChange={(e) => setEditDeadline(Number(e.target.value))}
                        className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                      >
                        {Array.from({ length: 28 }, (_, i) => i + 1).map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                      <span className="text-sm text-slate-600">de cada mes</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Instrucoes para IA</label>
                    <textarea
                      value={editInstructions}
                      onChange={(e) => setEditInstructions(e.target.value)}
                      rows={3}
                      placeholder="Instrucoes especificas para a IA processar este cliente..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none"
                    />
                  </div>

                  {/* Documentos Requeridos - Editável */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-semibold text-slate-700">Documentos Requeridos</label>
                      <button
                        onClick={addDocRequirement}
                        className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
                      >
                        <FiPlus className="w-3 h-3" />
                        Adicionar
                      </button>
                    </div>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {editDocs.map((doc, idx) => (
                        <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <input
                              value={doc.name}
                              onChange={(e) => updateDocRequirement(idx, 'name', e.target.value)}
                              placeholder="Nome do documento"
                              className="flex-1 px-2 py-1 border border-slate-300 rounded text-sm"
                            />
                            <button
                              onClick={() => removeDocRequirement(idx)}
                              className="p-1 text-red-500 hover:text-red-700"
                            >
                              <FiTrash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="flex items-center gap-2">
                            <select
                              value={doc.type}
                              onChange={(e) => updateDocRequirement(idx, 'type', e.target.value)}
                              className="px-2 py-1 border border-slate-300 rounded text-xs flex-1"
                            >
                              <option value="NFe_EMITIDAS">NFe Emitidas</option>
                              <option value="NFe_RECEBIDAS">NFe Recebidas</option>
                              <option value="EXTRATOS_BANCARIOS">Extratos Bancarios</option>
                              <option value="FOLHA_PAGAMENTO">Folha Pagamento</option>
                              <option value="COMPROVANTES_PAGAMENTO">Comprovantes Pgto</option>
                              <option value="OUTROS">Outros</option>
                            </select>
                            <label className="flex items-center gap-1 text-xs text-slate-600">
                              <input
                                type="checkbox"
                                checked={doc.mandatory}
                                onChange={(e) => updateDocRequirement(idx, 'mandatory', e.target.checked)}
                                className="rounded"
                              />
                              Obrigatorio
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={handleSaveConfig}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold"
                    >
                      <FiSave className="w-4 h-4" />
                      Salvar
                    </button>
                    <button
                      onClick={() => {
                        setEditingConfig(false)
                        if (config) {
                          setEditRegime(config.regime_tributario)
                          setEditAnexo(config.anexo_simples || '')
                          setEditInstructions(config.contador_instructions || '')
                          setEditDeadline(config.documents_deadline_day || 10)
                          setEditDocs(config.required_documents || [])
                        }
                      }}
                      className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Coluna Direita - Atividades */}
          <div className="lg:col-span-2 space-y-6">

            {/* Dados do Onboarding */}
            {cliente.onboardingData && cliente.onboardingData.responses && (
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Dados do Cadastro</h2>
                    <p className="text-sm text-slate-600 mt-1">
                      Informacoes fornecidas durante o onboarding
                    </p>
                  </div>
                  {cliente.onboardingData.completedAt && (
                    <span className="text-xs text-slate-500">
                      Completado em {new Date(cliente.onboardingData.completedAt).toLocaleDateString('pt-BR')}
                    </span>
                  )}
                </div>

                {/* Tipo de Pessoa */}
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <FiUser className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm font-semibold text-blue-900">Tipo de Pessoa Detectado</p>
                      <p className="text-lg font-bold text-blue-700">
                        {detectPersonType(cliente.onboardingData.responses)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Grid de Respostas */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Object.entries(cliente.onboardingData.responses)
                    .filter(([key]) => !['additional_info', 'tax_doubts', 'current_accounting_situation'].includes(key))
                    .map(([key, value]) => {
                      const formattedValue = Array.isArray(value)
                        ? value.map(v => formatOnboardingValue(key, v)).join(', ')
                        : formatOnboardingValue(key, value);

                      return (
                        <div key={key} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                          <p className="text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">
                            {formatOnboardingKey(key)}
                          </p>
                          <p className="text-sm font-medium text-slate-900">{formattedValue}</p>
                        </div>
                      );
                    })}
                </div>

                {/* Info Adicional */}
                {(cliente.onboardingData.responses.additional_info || cliente.onboardingData.responses.tax_doubts) && (
                  <div className="mt-4 space-y-3">
                    {cliente.onboardingData.responses.additional_info && (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="text-xs font-semibold text-amber-900 mb-1">Informacoes Adicionais</p>
                        <p className="text-sm text-amber-800">{cliente.onboardingData.responses.additional_info}</p>
                      </div>
                    )}
                    {cliente.onboardingData.responses.tax_doubts && (
                      <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                        <p className="text-xs font-semibold text-purple-900 mb-1">Duvidas sobre Impostos</p>
                        <p className="text-sm text-purple-800">{cliente.onboardingData.responses.tax_doubts}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Documentos Requeridos (read-only view) */}
            {config && config.required_documents && config.required_documents.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h2 className="text-lg font-bold text-slate-900 mb-4">Documentos Requeridos Mensalmente</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {config.required_documents.map((doc: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <FiFileText className={`w-5 h-5 ${doc.mandatory ? 'text-red-500' : 'text-slate-400'}`} />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900">{doc.name}</p>
                        <p className="text-xs text-slate-500">{doc.format}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${doc.mandatory ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}>
                        {doc.mandatory ? 'Obrigatorio' : 'Opcional'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Documentos Recentes */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-900">Documentos Recentes</h2>
              </div>

              {cliente.documentos_recentes.length === 0 ? (
                <div className="text-center py-8">
                  <FiFileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-600">Nenhum documento enviado ainda</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {cliente.documentos_recentes.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 truncate">{doc.fileName}</p>
                        <p className="text-sm text-slate-600">{doc.tipo}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${getDocumentStatusColor(doc.status)}`}>
                          {doc.status}
                        </span>
                        <span className="text-xs text-slate-500">{doc.data_upload}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Ciclos Mensais */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Ciclos Mensais</h2>

              {cliente.ciclos_mensais.length === 0 ? (
                <div className="text-center py-8">
                  <FiCalendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-600">Nenhum ciclo mensal registrado</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {cliente.ciclos_mensais.map((ciclo) => (
                    <div key={ciclo.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <FiCalendar className="w-5 h-5 text-slate-400" />
                        <div>
                          <p className="font-medium text-slate-900">
                            {String(ciclo.mes).padStart(2, '0')}/{ciclo.ano}
                          </p>
                          <p className="text-sm text-slate-600">{ciclo.status}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        {ciclo.das_valor && <p className="font-bold text-slate-900">{formatCurrency(ciclo.das_valor)}</p>}
                        {ciclo.das_vencimento && <p className="text-xs text-slate-600">Venc: {ciclo.das_vencimento}</p>}
                        {ciclo.das_pago && (
                          <span className="inline-flex items-center gap-1 text-xs text-green-600">
                            <FiCheckCircle className="w-3 h-3" /> Pago
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Cálculos de Impostos */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Calculos de Impostos</h2>

              {cliente.calculos_impostos.length === 0 ? (
                <div className="text-center py-8">
                  <FiDollarSign className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-600">Nenhum calculo de imposto registrado</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {cliente.calculos_impostos.map((calc) => (
                    <div key={calc.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <FiDollarSign className="w-5 h-5 text-slate-400" />
                        <div>
                          <p className="font-medium text-slate-900">
                            {calc.tipo} - {String(calc.mes).padStart(2, '0')}/{calc.ano}
                          </p>
                          <p className="text-sm text-slate-600">{calc.status}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-slate-900">{formatCurrency(calc.valor)}</p>
                        {calc.vencimento && <p className="text-xs text-slate-600">Venc: {calc.vencimento}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>

      </div>
    </div>
  )
}
