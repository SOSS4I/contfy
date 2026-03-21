/**
 * Monthly Processing Service
 * ==========================
 *
 * Serviço para interagir com o processamento mensal contábil (11 agentes de IA)
 */

import api from './api'

export interface MonthlyCycle {
  id: number
  referenceMonth: number
  referenceYear: number
  status: string
  processingLog?: string
  created_at: string
  updatedAt: string
  tax_calculation?: any
  accounting_entries?: any
  das_pdf_path?: string
  report_data?: any
  client?: {
    id: number
    name: string
    cnpj: string
  }
}

export interface DocumentRequirement {
  type: string
  description: string
  mandatory: boolean
  format: string
}

export interface CycleWithRequirements extends MonthlyCycle {
  documentsRequested?: {
    documents: DocumentRequirement[]
    message?: string
  }
  documentsUploaded?: {
    id: number
    documentType: string
    fileName: string
    fileSize: number
    createdAt: string
  }[]
}

export const monthlyProcessingService = {
  /**
   * Buscar ciclos do cliente
   */
  async getClientCycles(clientId: number | string, year?: number): Promise<{ cycles: MonthlyCycle[], total: number }> {
    const params: any = {}
    if (year) params.year = year

    const response = await api.get(`/monthly-processing/client/${clientId}`, { params })
    return response.data
  },

  /**
   * Buscar ciclo ativo (mais recente com status PENDING_DOCS ou PROCESSING)
   */
  async getActiveCycle(clientId: number | string): Promise<CycleWithRequirements | null> {
    try {
      const response = await api.get(`/monthly-processing/client/${clientId}/active`)
      return response.data.cycle || null
    } catch (err: any) {
      if (err.response?.status === 404) return null
      throw err
    }
  },

  /**
   * Buscar status de um ciclo específico
   */
  async getCycleStatus(cycleId: number): Promise<CycleWithRequirements> {
    const response = await api.get(`/monthly-processing/status/${cycleId}`)
    return response.data
  },

  /**
   * Upload de documento para um ciclo mensal
   */
  async uploadDocument(
    cycleId: number,
    file: File,
    documentType: string,
    notes?: string
  ): Promise<{ success: boolean; document: any; message: string; processing_started: boolean }> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('document_type', documentType)
    if (notes) {
      formData.append('notes', notes)
    }

    const response = await api.post(
      `/monthly-processing/upload-document/${cycleId}`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000,
      }
    )
    return response.data
  },

  /**
   * Buscar DAS PDF de um ciclo
   */
  async downloadDAS(cycleId: number): Promise<Blob> {
    const response = await api.get(`/monthly-processing/das/${cycleId}`, {
      responseType: 'blob',
    })
    return response.data
  },

  /**
   * Buscar histórico de impostos (ciclos completados)
   */
  async getClientHistory(clientId: number | string, year?: number): Promise<{ total: number; impostos: any[] }> {
    const params: any = {}
    if (year) params.year = year

    const response = await api.get(`/monthly-processing/client/${clientId}/history`, { params })
    return response.data
  },

  /**
   * Iniciar processamento mensal manualmente
   */
  async startProcessing(clientId: number, month: number, year: number): Promise<any> {
    const response = await api.post('/monthly-processing/start', {
      client_id: clientId,
      reference_month: month,
      reference_year: year,
    })
    return response.data
  },
}

export default monthlyProcessingService
