import { useState, useEffect } from 'react'
import { documentosService, Documento, DocumentoFilters } from '@/services/documentosService'

export function useDocumentos(filters?: DocumentoFilters) {
  const [documentos, setDocumentos] = useState<Documento[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    const fetchDocumentos = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await documentosService.listar({ ...filters, page })
        setDocumentos(response.data)
        setTotal(response.total)
        setTotalPages(response.total_pages)
      } catch (err: any) {
        setError(err.response?.data?.message || 'Erro ao carregar documentos')
        console.error('Erro ao carregar documentos:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchDocumentos()
  }, [filters, page])

  return {
    documentos,
    loading,
    error,
    total,
    page,
    totalPages,
    setPage,
    reload: () => setPage(page),
  }
}

export function useDocumentosStats(clienteId?: string) {
  const [stats, setStats] = useState({
    total: 0,
    processados: 0,
    processando: 0,
    erros: 0,
    pendentes: 0,
    este_mes: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await documentosService.estatisticas(clienteId)
        setStats(data)
      } catch (err: any) {
        setError(err.response?.data?.message || 'Erro ao carregar estatísticas')
        console.error('Erro ao carregar estatísticas:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [clienteId])

  return { stats, loading, error }
}

export function useDocumento(id: string | null) {
  const [documento, setDocumento] = useState<Documento | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) {
      setLoading(false)
      return
    }

    const fetchDocumento = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await documentosService.buscar(id)
        setDocumento(data)
      } catch (err: any) {
        setError(err.response?.data?.message || 'Erro ao carregar documento')
        console.error('Erro ao carregar documento:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchDocumento()
  }, [id])

  return { documento, loading, error }
}
