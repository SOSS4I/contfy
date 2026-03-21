import { useState, useEffect } from 'react'
import { clientesService, Cliente, ClienteFilters } from '@/services/clientesService'

export function useClientes(filters?: ClienteFilters) {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    const fetchClientes = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await clientesService.listar({ ...filters, page })
        setClientes(response.data)
        setTotal(response.total)
        setTotalPages(response.total_pages)
      } catch (err: any) {
        setError(err.response?.data?.message || 'Erro ao carregar clientes')
        console.error('Erro ao carregar clientes:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchClientes()
  }, [filters, page])

  return {
    clientes,
    loading,
    error,
    total,
    page,
    totalPages,
    setPage,
    reload: () => setPage(page), // força reload
  }
}

export function useClientesStats() {
  const [stats, setStats] = useState({
    total: 0,
    simples_nacional: 0,
    mei: 0,
    docs_pendentes: 0,
    novos_mes: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await clientesService.estatisticas()
        setStats(data)
      } catch (err: any) {
        setError(err.response?.data?.message || 'Erro ao carregar estatísticas')
        console.error('Erro ao carregar estatísticas:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  return { stats, loading, error }
}

export function useCliente(id: string | null) {
  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) {
      setLoading(false)
      return
    }

    const fetchCliente = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await clientesService.buscar(id)
        setCliente(data)
      } catch (err: any) {
        setError(err.response?.data?.message || 'Erro ao carregar cliente')
        console.error('Erro ao carregar cliente:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchCliente()
  }, [id])

  return { cliente, loading, error }
}
