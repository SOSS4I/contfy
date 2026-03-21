'use client'

import { useState, useMemo } from 'react'
import { FiFile, FiFilter, FiSearch, FiDownload, FiEye, FiCheck, FiClock, FiAlertCircle, FiX } from 'react-icons/fi'
import { useDocumentos } from '@/hooks/useDocumentos'
import { documentosService } from '@/services/documentosService'

export default function DocumentosPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('todos')
  const [filterTipo, setFilterTipo] = useState<string>('todos')
  const [downloadError, setDownloadError] = useState('')

  const filters = useMemo(() => ({
    search: searchTerm,
    status: filterStatus === 'todos' ? undefined : filterStatus,
    tipo: filterTipo === 'todos' ? undefined : filterTipo,
  }), [searchTerm, filterStatus, filterTipo])

  const { documentos, loading, error } = useDocumentos(filters)

  const handleDownload = async (id: string, nome: string) => {
    try {
      const blob = await documentosService.download(id)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = nome
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err: any) {
      setDownloadError('Erro ao baixar documento: ' + (err.response?.data?.message || err.message))
      setTimeout(() => setDownloadError(''), 5000)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processado':
      case 'aprovado':
        return <FiCheck className="w-5 h-5 text-green-600" />
      case 'processando':
        return <FiClock className="w-5 h-5 text-blue-600" />
      case 'erro':
      case 'rejeitado':
        return <FiAlertCircle className="w-5 h-5 text-red-600" />
      case 'pendente':
        return <FiClock className="w-5 h-5 text-yellow-600" />
      default:
        return <FiFile className="w-5 h-5 text-gray-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      processado: 'bg-green-50 text-green-600',
      aprovado: 'bg-green-50 text-green-600',
      processando: 'bg-blue-50 text-blue-600',
      erro: 'bg-red-50 text-red-600',
      rejeitado: 'bg-red-50 text-red-600',
      pendente: 'bg-yellow-50 text-yellow-600',
    }

    const labels: Record<string, string> = {
      processado: 'Processado',
      aprovado: 'Aprovado',
      processando: 'Processando...',
      erro: 'Erro',
      rejeitado: 'Rejeitado',
      pendente: 'Pendente',
    }

    return (
      <span className={`text-xs font-medium px-2 py-1 rounded-full ${styles[status] || 'bg-gray-50 text-gray-600'}`}>
        {labels[status] || status}
      </span>
    )
  }

  const getTipoLabel = (tipo: string) => {
    const tipos: Record<string, string> = {
      nfe: 'NF-e',
      nfse: 'NFS-e',
      cte: 'CT-e',
      recibo: 'Recibo',
      contrato: 'Contrato',
      outro: 'Outro'
    }
    return tipos[tipo] || tipo
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return dateString
    }
  }

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    })
  }

  const filteredDocs = documentos.filter(doc => {
    const matchesSearch = searchTerm === '' ||
      (doc.nome && doc.nome.toLowerCase().includes(searchTerm.toLowerCase())) ||
      ((doc as any).file_name && (doc as any).file_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (doc.cliente_nome && doc.cliente_nome.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (doc.cliente_cnpj && doc.cliente_cnpj.includes(searchTerm))

    return matchesSearch
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Documentos</h1>
        <p className="text-gray-600 mt-1">Gerencie todos os documentos dos clientes</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por documento ou cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select
            value={filterTipo}
            onChange={(e) => setFilterTipo(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="todos">Todos os tipos</option>
            <option value="nfe">NF-e</option>
            <option value="nfse">NFS-e</option>
            <option value="cte">CT-e</option>
            <option value="recibo">Recibo</option>
            <option value="contrato">Contrato</option>
            <option value="outro">Outro</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="todos">Todos os status</option>
            <option value="pendente">Pendente</option>
            <option value="processando">Processando</option>
            <option value="aprovado">Aprovado</option>
            <option value="processado">Processado</option>
            <option value="rejeitado">Rejeitado</option>
            <option value="erro">Erro</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-600">Total</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">{documentos.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-600">Processados</h3>
          <p className="text-3xl font-bold text-green-600 mt-2">
            {documentos.filter(d => d.status === 'processado' || (d.status as string) === 'aprovado').length}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-600">Processando</h3>
          <p className="text-3xl font-bold text-blue-600 mt-2">
            {documentos.filter(d => d.status === 'processando').length}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-600">Pendentes</h3>
          <p className="text-3xl font-bold text-yellow-600 mt-2">
            {documentos.filter(d => d.status === 'pendente').length}
          </p>
        </div>
      </div>

      {/* Documents Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {error && (
          <div className="p-6 bg-red-50 border-b border-red-200">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="p-12 text-center">
            <p className="text-gray-600">Carregando documentos...</p>
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <FiFile className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-600">Nenhum documento encontrado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Documento</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-50 rounded-lg">
                          <FiFile className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {doc.nome || (doc as any).file_name || 'Documento sem nome'}
                          </p>
                          {doc.dados_extraidos?.chave_acesso && (
                            <p className="text-xs text-gray-500 truncate max-w-xs">
                              Chave: {doc.dados_extraidos.chave_acesso.substring(0, 20)}...
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm text-gray-900">{doc.cliente_nome || '-'}</p>
                        <p className="text-xs text-gray-500">{doc.cliente_cnpj || '-'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-900">{getTipoLabel(doc.tipo)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(doc.status)}
                        {getStatusBadge(doc.status)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-900">
                        {formatDate(doc.data_upload || doc.created_at || '')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-900">
                        {doc.dados_extraidos?.valor_total
                          ? formatCurrency(doc.dados_extraidos.valor_total)
                          : (doc as any).valor
                          ? formatCurrency((doc as any).valor)
                          : '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {(doc.status === 'processado' || (doc.status as string) === 'aprovado') && (
                          <button
                            onClick={() => handleDownload(doc.id, doc.nome || (doc as any).file_name || 'documento.pdf')}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Baixar documento"
                          >
                            <FiDownload className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </td>
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
