'use client'

import { useMemo } from 'react'
import { FiFileText, FiCheckCircle, FiClock, FiAlertCircle } from 'react-icons/fi'
import clsx from 'clsx'
import { useDocumentos } from '@/hooks/useDocumentos'
import Link from 'next/link'

const statusConfig = {
  processed: { label: 'Processado', icon: FiCheckCircle, color: 'text-green-600', bgColor: 'bg-green-50' },
  processado: { label: 'Processado', icon: FiCheckCircle, color: 'text-green-600', bgColor: 'bg-green-50' },
  aprovado: { label: 'Processado', icon: FiCheckCircle, color: 'text-green-600', bgColor: 'bg-green-50' },
  processing: { label: 'Processando', icon: FiClock, color: 'text-blue-600', bgColor: 'bg-blue-50' },
  processando: { label: 'Processando', icon: FiClock, color: 'text-blue-600', bgColor: 'bg-blue-50' },
  error: { label: 'Erro', icon: FiAlertCircle, color: 'text-red-600', bgColor: 'bg-red-50' },
  erro: { label: 'Erro', icon: FiAlertCircle, color: 'text-red-600', bgColor: 'bg-red-50' },
  rejeitado: { label: 'Erro', icon: FiAlertCircle, color: 'text-red-600', bgColor: 'bg-red-50' },
  pending_review: { label: 'Pendente', icon: FiClock, color: 'text-yellow-600', bgColor: 'bg-yellow-50' },
  pendente: { label: 'Pendente', icon: FiClock, color: 'text-yellow-600', bgColor: 'bg-yellow-50' },
}

export default function RecentDocuments() {
  // Use useMemo to prevent infinite re-renders by memoizing the filters object
  const filters = useMemo(() => ({ per_page: 5 }), [])
  const { documentos, loading, error } = useDocumentos(filters)

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-6 border-b">
        <h3 className="text-lg font-semibold text-gray-900">Documentos Recentes</h3>
      </div>
      {loading ? <div className="p-6 text-center">Carregando...</div> :
       error ? <div className="p-6 text-center text-red-600">Erro</div> :
       documentos.length === 0 ? <div className="p-6 text-center">Nenhum documento</div> : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs">Documento</th>
                <th className="px-6 py-3 text-left text-xs">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {documentos.map((doc) => {
                const config = (statusConfig as Record<string, any>)[doc.status.toLowerCase()] || statusConfig.pending_review
                const Icon = config.icon
                return (
                  <tr key={doc.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <FiFileText className="w-5 h-5 text-blue-600 mr-3" />
                        <span className="text-sm">{doc.nome || (doc as any).file_name || 'Documento'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={clsx('px-2 py-1 rounded text-xs', config.bgColor, config.color)}>
                        <Icon className="w-3 h-3 inline mr-1" />{config.label}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
