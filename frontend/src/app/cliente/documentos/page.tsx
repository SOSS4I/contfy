'use client'

import { useState, useEffect } from 'react'
import { FiUpload, FiFile, FiX, FiCheck, FiClock, FiAlertCircle, FiMessageSquare, FiRefreshCw } from 'react-icons/fi'
import { useAuth } from '@/contexts/AuthContext'
import { monthlyProcessingService } from '@/services/monthlyProcessingService'

const MONTH_NAMES = [
  '', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

const DOC_TYPE_MAP: Record<string, string> = {
  'nfe_emitida': 'Notas Fiscais Emitidas',
  'nfe_emitidas': 'Notas Fiscais Emitidas',
  'nfe_recebida': 'Notas Fiscais Recebidas',
  'nfe_recebidas': 'Notas Fiscais Recebidas',
  'folha_pagamento': 'Folha de Pagamento',
  'extratos_bancarios': 'Extratos Bancários',
  'comprovantes_pagamento': 'Comprovantes de Pagamento',
  'outros': 'Outros Documentos',
}

function getDocTypeLabel(type: string, fallback?: string): string {
  return DOC_TYPE_MAP[type.toLowerCase()] || fallback || type.replace(/_/g, ' ')
}

interface ActiveCycle {
  id: number
  referenceMonth: number
  referenceYear: number
  status: string
  documentsRequested?: {
    documents?: { type: string; name?: string; description: string; mandatory: boolean; format: string }[]
    documents_needed?: { type: string; name?: string; description: string; mandatory: boolean; format: string }[]
    message?: string
    message_to_client?: string
  }
  documentsUploaded?: {
    id: number
    documentType: string
    fileName: string
    fileSize: number
    notes?: string
    createdAt: string
  }[]
}

export default function DocumentosPage() {
  const { user } = useAuth()
  const [activeCycle, setActiveCycle] = useState<ActiveCycle | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [selectedDocType, setSelectedDocType] = useState('')
  const [notes, setNotes] = useState('')
  const [dragActive, setDragActive] = useState(false)
  const [processingStarted, setProcessingStarted] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user?.id) loadActiveCycle()
  }, [user])

  const loadActiveCycle = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await monthlyProcessingService.getActiveCycle(user!.id)
      setActiveCycle(data)
    } catch (err: any) {
      setError('Erro ao carregar informações do ciclo mensal')
    } finally {
      setLoading(false)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true)
    else if (e.type === 'dragleave') setDragActive(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files?.[0]) handleFileUpload(e.dataTransfer.files[0])
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files?.[0]) handleFileUpload(e.target.files[0])
  }

  const handleFileUpload = async (file: File) => {
    if (!activeCycle?.id) {
      setError('Nenhum ciclo ativo para enviar documentos')
      return
    }
    if (!selectedDocType) {
      setError('Selecione o tipo de documento antes de enviar')
      return
    }

    setUploading(true)
    setError('')

    try {
      const result = await monthlyProcessingService.uploadDocument(
        activeCycle.id, file, selectedDocType, notes || undefined
      )
      if (result.processing_started) setProcessingStarted(true)
      setNotes('')
      setSelectedDocType('')
      await loadActiveCycle()
    } catch (err: any) {
      setError('Erro ao enviar documento: ' + (err.response?.data?.error || err.message))
    } finally {
      setUploading(false)
    }
  }

  const isDocUploaded = (docType: string) => activeCycle?.documentsUploaded?.some(d => d.documentType === docType) || false
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
      })
    } catch { return dateString }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center gap-3 text-gray-600">
          <FiRefreshCw className="w-5 h-5 animate-spin" />
          <span>Carregando...</span>
        </div>
      </div>
    )
  }

  // Processamento iniciado automaticamente
  if (processingStarted) {
    return (
      <div className="max-w-2xl mx-auto mt-12">
        <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiCheck className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-green-900 mb-2">Documentos Recebidos com Sucesso!</h2>
          <p className="text-green-700 mb-4">
            Todos os documentos obrigatórios foram enviados. O processamento automático foi iniciado.
          </p>
          <p className="text-sm text-green-600 mb-6">
            Nossos agentes de IA estão analisando seus documentos, calculando impostos,
            gerando lançamentos contábeis e preparando seus relatórios.
          </p>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => { setProcessingStarted(false); loadActiveCycle() }}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Ver Status
            </button>
            <a href="/cliente/impostos" className="px-6 py-2 bg-white text-green-700 border border-green-300 rounded-lg hover:bg-green-50">
              Ver Impostos
            </a>
          </div>
        </div>
      </div>
    )
  }

  // Sem ciclo ativo
  if (!activeCycle) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Enviar Documentos</h1>
          <p className="text-gray-600 mt-1">Envie seus documentos mensais para processamento</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiClock className="w-8 h-8 text-blue-400" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Nenhum ciclo mensal pendente</h2>
          <p className="text-gray-600 max-w-md mx-auto">
            Seus documentos mensais serão solicitados automaticamente no início de cada mês.
            Quando houver documentos pendentes, você verá a lista aqui.
          </p>
        </div>
      </div>
    )
  }

  const cycleMonth = MONTH_NAMES[activeCycle.referenceMonth]
  const cycleYear = activeCycle.referenceYear
  const requiredDocs = activeCycle.documentsRequested?.documents || activeCycle.documentsRequested?.documents_needed || []
  const uploadedDocs = activeCycle.documentsUploaded || []
  const mandatoryDocs = requiredDocs.filter(d => d.mandatory)
  const optionalDocs = requiredDocs.filter(d => !d.mandatory)
  const mandatoryUploaded = mandatoryDocs.filter(d => isDocUploaded(d.type)).length
  const progress = mandatoryDocs.length > 0 ? Math.round((mandatoryUploaded / mandatoryDocs.length) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Enviar Documentos</h1>
        <p className="text-gray-600 mt-1">
          Documentos para o mês de <strong>{cycleMonth}/{cycleYear}</strong>
        </p>
      </div>

      {/* Cycle Status Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold">Processamento Mensal - {cycleMonth} {cycleYear}</h2>
            <p className="text-blue-100 text-sm mt-1">
              {activeCycle.status === 'PENDING_DOCS'
                ? 'Aguardando envio dos documentos'
                : activeCycle.status === 'PROCESSING'
                ? 'Processamento em andamento...'
                : activeCycle.status}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-2xl font-bold">{mandatoryUploaded}/{mandatoryDocs.length}</p>
              <p className="text-blue-200 text-xs">obrigatórios enviados</p>
            </div>
            <div className="w-16 h-16 relative">
              <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="3" />
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="white" strokeWidth="3" strokeDasharray={`${progress}, 100`} />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-xs font-bold">{progress}%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <FiAlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
          <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-600"><FiX className="w-4 h-4" /></button>
        </div>
      )}

      {/* Required Documents Checklist */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Documentos Necessários</h2>
          <p className="text-sm text-gray-500 mt-1">Envie os documentos abaixo para processamento da contabilidade</p>
        </div>
        <div className="divide-y divide-gray-100">
          {mandatoryDocs.map((doc) => {
            const uploaded = isDocUploaded(doc.type)
            const uploadedDoc = uploadedDocs.find(d => d.documentType === doc.type)
            return (
              <div key={doc.type} className={`p-4 sm:p-6 ${uploaded ? 'bg-green-50/50' : ''}`}>
                <div className="flex items-start gap-4">
                  <div className={`mt-1 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${uploaded ? 'bg-green-100' : 'bg-amber-100'}`}>
                    {uploaded ? <FiCheck className="w-4 h-4 text-green-600" /> : <FiUpload className="w-4 h-4 text-amber-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-gray-900">{getDocTypeLabel(doc.type, doc.name)}</h3>
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-600">Obrigatório</span>
                    </div>
                    <p className="text-sm text-gray-500">{doc.description || `Formato: ${doc.format || 'XML, PDF'}`}</p>
                    {uploaded && uploadedDoc && (
                      <div className="mt-2 flex items-center gap-3 text-xs text-green-700">
                        <FiFile className="w-3.5 h-3.5" />
                        <span>{uploadedDoc.fileName}</span>
                        <span className="text-green-500">({formatFileSize(uploadedDoc.fileSize)})</span>
                        <span className="text-green-400">{formatDate(uploadedDoc.createdAt)}</span>
                      </div>
                    )}
                  </div>
                  {!uploaded && (
                    <button
                      onClick={() => setSelectedDocType(doc.type)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex-shrink-0 ${
                        selectedDocType === doc.type ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                      }`}
                    >
                      {selectedDocType === doc.type ? 'Selecionado' : 'Enviar'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
          {optionalDocs.length > 0 && (
            <>
              <div className="p-4 bg-gray-50">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Documentos Opcionais</p>
              </div>
              {optionalDocs.map((doc) => {
                const uploaded = isDocUploaded(doc.type)
                return (
                  <div key={doc.type} className={`p-4 sm:p-6 ${uploaded ? 'bg-green-50/50' : ''}`}>
                    <div className="flex items-start gap-4">
                      <div className={`mt-1 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${uploaded ? 'bg-green-100' : 'bg-gray-100'}`}>
                        {uploaded ? <FiCheck className="w-4 h-4 text-green-600" /> : <FiFile className="w-4 h-4 text-gray-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900">{getDocTypeLabel(doc.type, doc.name)}</h3>
                        <p className="text-sm text-gray-500">{doc.description || `Formato: ${doc.format || 'PDF'}`}</p>
                      </div>
                      {!uploaded && (
                        <button
                          onClick={() => setSelectedDocType(doc.type)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex-shrink-0 ${
                            selectedDocType === doc.type ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          Enviar
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </>
          )}
        </div>
      </div>

      {/* Upload Area - quando um tipo está selecionado */}
      {selectedDocType && (
        <div className="bg-white rounded-xl shadow-sm border-2 border-blue-200">
          <div className="p-6 border-b border-blue-100 bg-blue-50/50">
            <h2 className="text-lg font-semibold text-gray-900">Enviar: {getDocTypeLabel(selectedDocType)}</h2>
          </div>
          <div className="p-6 space-y-4">
            <div onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}>
              <input type="file" id="file-upload" onChange={handleChange} accept=".pdf,.jpg,.jpeg,.png,.xml,.zip" className="hidden" />
              <label
                htmlFor="file-upload"
                className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 cursor-pointer transition-all
                  ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'}
                  ${uploading ? 'pointer-events-none opacity-50' : ''}`}
              >
                <div className={`p-3 rounded-full mb-3 ${dragActive ? 'bg-blue-100' : 'bg-gray-100'}`}>
                  <FiUpload className={`w-6 h-6 ${dragActive ? 'text-blue-600' : 'text-gray-500'}`} />
                </div>
                <p className="text-base font-medium text-gray-900">
                  {uploading ? 'Enviando...' : 'Arraste o arquivo aqui ou clique para selecionar'}
                </p>
                <p className="text-xs text-gray-400 mt-1">PDF, XML, JPG, PNG, ZIP - Máximo 50MB</p>
              </label>
            </div>

            {/* Campo de Notas */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <FiMessageSquare className="w-4 h-4" />
                Observações (opcional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Este mês tivemos uma nota de devolução, desconsiderar a NFe 1234..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                rows={3}
              />
            </div>

            <div className="flex justify-end">
              <button onClick={() => { setSelectedDocType(''); setNotes('') }} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lista de documentos já enviados */}
      {uploadedDocs.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Documentos Enviados</h2>
            <p className="text-sm text-gray-500 mt-1">{uploadedDocs.length} documento(s) neste ciclo</p>
          </div>
          <div className="divide-y divide-gray-100">
            {uploadedDocs.map((doc) => (
              <div key={doc.id} className="p-4 sm:p-6 flex items-center gap-4">
                <div className="p-2.5 bg-green-50 rounded-lg"><FiFile className="w-5 h-5 text-green-600" /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{doc.fileName}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                    <span>{getDocTypeLabel(doc.documentType)}</span>
                    <span>{formatFileSize(doc.fileSize)}</span>
                    <span>{formatDate(doc.createdAt)}</span>
                  </div>
                  {doc.notes && <p className="mt-1 text-xs text-gray-400 italic">&ldquo;{doc.notes}&rdquo;</p>}
                </div>
                <FiCheck className="w-5 h-5 text-green-500 flex-shrink-0" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
