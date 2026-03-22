/**
 * MONTHLY PROCESSING CONTROLLER
 *
 * API endpoints para gerenciar o processamento mensal automático
 */

import { Request, Response } from 'express'
import { MonthlyProcessingOrchestrator } from '../services/monthly-processing-orchestrator'
import { prisma } from '../utils/prisma'
const orchestrator = new MonthlyProcessingOrchestrator()

/**
 * POST /api/monthly-processing/start
 * Inicia o processamento mensal para um cliente
 *
 * Body: { client_id, reference_month, reference_year }
 */
export async function startMonthlyProcessing(req: Request, res: Response) {
  try {
    const { client_id, reference_month, reference_year } = req.body

    // Validações
    if (!client_id || !reference_month || !reference_year) {
      return res.status(400).json({
        error: 'client_id, reference_month e reference_year são obrigatórios'
      })
    }

    if (reference_month < 1 || reference_month > 12) {
      return res.status(400).json({
        error: 'reference_month deve estar entre 1 e 12'
      })
    }

    const clientIdNum = Number(client_id)

    // Verificar cliente e config em paralelo
    const [client, config] = await Promise.all([
      prisma.client.findUnique({ where: { id: clientIdNum } }),
      prisma.clientAccountingConfig.findUnique({ where: { clientId: clientIdNum } })
    ])

    if (!client) {
      return res.status(404).json({ error: 'Cliente não encontrado' })
    }

    if (!config) {
      return res.status(400).json({
        error: 'Cliente não possui configuração contábil aprovada pelo contador'
      })
    }

    // Iniciar processamento
    console.log(`🚀 Iniciando processamento mensal via API para cliente ${client_id}`)

    const result = await orchestrator.processMonthlyAccounting(
      client_id,
      reference_month,
      reference_year
    )

    return res.status(200).json({
      success: result.success,
      cycle_id: result.cycle_id,
      status: result.status,
      message: result.status === 'PENDING_DOCS'
        ? 'Processamento iniciado. Aguardando upload de documentos pelo cliente.'
        : 'Processamento concluído',
      current_step: result.current_step,
      documentsRequested: result.results?.documentsRequested
    })

  } catch (error: any) {
    console.error('❌ Erro ao iniciar processamento:', error)
    return res.status(500).json({
      error: 'Erro ao iniciar processamento mensal'
    })
  }
}

/**
 * POST /api/monthly-processing/continue/:cycle_id
 * Continua o processamento após o cliente fazer upload dos documentos
 */
export async function continueProcessing(req: Request, res: Response) {
  try {
    const cycleId = Number(req.params.cycle_id)

    // Verificar se ciclo existe
    const cycle = await prisma.monthlyAccountingCycle.findUnique({
      where: { id: cycleId }
    })

    if (!cycle) {
      return res.status(404).json({ error: 'Ciclo não encontrado' })
    }

    // Verificar se já foi processado
    if (cycle.status === 'COMPLETED') {
      return res.status(400).json({
        error: 'Ciclo já foi processado'
      })
    }

    console.log(`🔄 Continuando processamento do ciclo ${cycleId}`)

    const result = await orchestrator.continueProcessingAfterUpload(cycleId)

    return res.status(200).json({
      success: result.success,
      cycle_id: result.cycle_id,
      status: result.status,
      message: result.status === 'COMPLETED'
        ? 'Processamento concluído com sucesso!'
        : result.status === 'ERROR'
        ? 'Erro durante o processamento'
        : 'Processamento em andamento',
      results: result.results,
      error: result.error
    })

  } catch (error: any) {
    console.error('❌ Erro ao continuar processamento:', error)
    return res.status(500).json({
      error: 'Erro ao continuar processamento'
    })
  }
}

/**
 * GET /api/monthly-processing/status/:cycle_id
 * Consulta o status de um processamento
 */
export async function getProcessingStatus(req: Request, res: Response) {
  try {
    const cycleId = Number(req.params.cycle_id)

    const cycle = await prisma.monthlyAccountingCycle.findUnique({
      where: { id: cycleId },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            cnpj: true
          }
        }
      }
    })

    if (!cycle) {
      return res.status(404).json({ error: 'Ciclo não encontrado' })
    }

    return res.status(200).json({
      cycle_id: cycle.id,
      client: cycle.client,
      referenceMonth: cycle.referenceMonth,
      referenceYear: cycle.referenceYear,
      status: cycle.status,
      processingLog: cycle.processingLog,
      created_at: cycle.createdAt,
      updatedAt: cycle.updatedAt,
      tax_calculation: cycle.tax_calculation,
      accounting_entries: cycle.accounting_entries,
      das_pdf_path: cycle.das_pdf_path,
      report_data: cycle.monthly_report_data
    })

  } catch (error: any) {
    console.error('❌ Erro ao buscar status:', error)
    return res.status(500).json({
      error: 'Erro ao buscar status do processamento'
    })
  }
}

/**
 * GET /api/monthly-processing/client/:client_id
 * Lista todos os ciclos de um cliente
 */
export async function getClientCycles(req: Request, res: Response) {
  try {
    const clientId = Number(req.params.client_id)
    const { year } = req.query

    const where: any = { clientId }
    if (year) {
      where.referenceYear = parseInt(year as string)
    }

    const cycles = await prisma.monthlyAccountingCycle.findMany({
      where,
      orderBy: [
        { referenceYear: 'desc' },
        { referenceMonth: 'desc' }
      ]
    })

    return res.status(200).json({
      client_id: clientId,
      total: cycles.length,
      cycles: cycles.map(c => ({
        id: c.id,
        referenceMonth: c.referenceMonth,
        referenceYear: c.referenceYear,
        status: c.status,
        processingLog: c.processingLog,
        created_at: c.createdAt,
        updatedAt: c.updatedAt
      }))
    })

  } catch (error: any) {
    console.error('❌ Erro ao buscar ciclos:', error)
    return res.status(500).json({
      error: 'Erro ao buscar ciclos do cliente'
    })
  }
}

/**
 * GET /api/monthly-processing/client/:client_id/active
 * Busca o ciclo ativo mais recente (PENDING_DOCS ou PROCESSING) com documentos e requisitos
 */
export async function getActiveCycle(req: Request, res: Response) {
  try {
    const clientId = Number(req.params.client_id)

    // Buscar ciclo mais recente que não está completo nem cancelado
    const cycle = await prisma.monthlyAccountingCycle.findFirst({
      where: {
        clientId,
        status: { in: ['PENDING_DOCS', 'PROCESSING', 'DOCS_UPLOADED'] }
      },
      orderBy: [
        { referenceYear: 'desc' },
        { referenceMonth: 'desc' }
      ],
      include: {
        client: {
          select: { id: true, name: true, cnpj: true }
        }
      }
    })

    if (!cycle) {
      // Se não tem ciclo ativo, buscar o mais recente completado
      const lastCompleted = await prisma.monthlyAccountingCycle.findFirst({
        where: { clientId, status: 'COMPLETED' },
        orderBy: [{ referenceYear: 'desc' }, { referenceMonth: 'desc' }],
        include: { client: { select: { id: true, name: true, cnpj: true } } }
      })

      return res.status(200).json({
        cycle: null,
        lastCompleted: lastCompleted ? {
          id: lastCompleted.id,
          referenceMonth: lastCompleted.referenceMonth,
          referenceYear: lastCompleted.referenceYear,
          status: lastCompleted.status,
          tax_calculation: lastCompleted.tax_calculation,
          das_pdf_path: lastCompleted.das_pdf_path,
          report_data: lastCompleted.monthly_report_data
        } : null
      })
    }

    // Buscar documentos já enviados para este ciclo
    const documentsUploaded = await prisma.clientMonthlyDocument.findMany({
      where: { cycle_id: cycle.id, clientId },
      orderBy: { uploadedAt: 'desc' }
    })

    // Pegar requisitos de documentos do monthly_report_data
    const reportData = (cycle.monthly_report_data as any) || {}
    const documentsRequested = reportData.documentsRequested || null

    return res.status(200).json({
      cycle: {
        id: cycle.id,
        referenceMonth: cycle.referenceMonth,
        referenceYear: cycle.referenceYear,
        status: cycle.status,
        processingLog: cycle.processingLog,
        created_at: cycle.createdAt,
        updatedAt: cycle.updatedAt,
        tax_calculation: cycle.tax_calculation,
        das_pdf_path: cycle.das_pdf_path,
        report_data: cycle.monthly_report_data,
        client: cycle.client,
        documentsRequested,
        documentsUploaded: documentsUploaded.map(d => ({
          id: d.id,
          documentType: d.documentType,
          fileName: d.fileName,
          fileSize: d.fileSize,
          notes: (d as any).notes || null,
          createdAt: d.uploadedAt
        }))
      }
    })

  } catch (error: any) {
    console.error('❌ Erro ao buscar ciclo ativo:', error)
    return res.status(500).json({
      error: 'Erro ao buscar ciclo ativo'
    })
  }
}

/**
 * GET /api/monthly-processing/das/:cycle_id
 * Download do PDF do DAS de um ciclo
 */
export async function downloadDAS(req: Request, res: Response) {
  try {
    const cycleId = Number(req.params.cycle_id)
    const cycle = await prisma.monthlyAccountingCycle.findUnique({
      where: { id: cycleId }
    })

    if (!cycle || !cycle.das_pdf_path) {
      return res.status(404).json({ error: 'DAS não encontrado' })
    }

    const fs = require('fs')
    const path = require('path')
    const filePath = cycle.das_pdf_path

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Arquivo DAS não encontrado no servidor' })
    }

    const fileName = path.basename(filePath)
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`)
    return fs.createReadStream(filePath).pipe(res)

  } catch (error: any) {
    console.error('❌ Erro ao baixar DAS:', error)
    return res.status(500).json({
      error: 'Erro ao baixar DAS'
    })
  }
}

/**
 * GET /api/monthly-processing/client/:client_id/history
 * Busca histórico de ciclos completados com dados de impostos
 */
export async function getClientHistory(req: Request, res: Response) {
  try {
    const clientId = Number(req.params.client_id)
    const { year } = req.query

    const where: any = { clientId, status: 'COMPLETED' }
    if (year) {
      where.referenceYear = parseInt(year as string)
    }

    const cycles = await prisma.monthlyAccountingCycle.findMany({
      where,
      orderBy: [{ referenceYear: 'desc' }, { referenceMonth: 'desc' }]
    })

    return res.status(200).json({
      total: cycles.length,
      impostos: cycles.map(c => {
        const tax = c.tax_calculation as any
        const report = c.monthly_report_data as any

        return {
          cycle_id: c.id,
          competencia: `${String(c.referenceMonth).padStart(2, '0')}/${c.referenceYear}`,
          referenceMonth: c.referenceMonth,
          referenceYear: c.referenceYear,
          tipo: tax?.regime === 'SIMPLES_NACIONAL' ? 'DAS' : 'DARF',
          regime: tax?.regime || 'SIMPLES_NACIONAL',
          anexo: tax?.anexo,
          receita_bruta: tax?.receita_mes || 0,
          aliquota_efetiva: tax?.aliquota_efetiva || 0,
          valor_devido: tax?.valor_a_pagar ?? tax?.valor_total ?? 0,
          vencimento: tax?.vencimento || '',
          das_pdf_path: c.das_pdf_path,
          status: 'calculado',
          breakdown: tax?.breakdown || {},
          report_summary: report?.dre ? {
            receita_bruta: report.dre.receita_bruta,
            lucro_liquido: report.dre.lucro_liquido,
            margem_liquida: report.dre.margem_liquida,
            impostos: report.dre.impostos
          } : null,
          completed_at: c.updatedAt
        }
      })
    })

  } catch (error: any) {
    console.error('❌ Erro ao buscar histórico:', error)
    return res.status(500).json({
      error: 'Erro ao buscar histórico'
    })
  }
}

/**
 * POST /api/monthly-processing/upload-document/:cycle_id
 * Upload de documento para um ciclo
 *
 * Multipart form: file, document_type, notes
 */
export async function uploadDocument(req: Request, res: Response) {
  try {
    const cycleId = Number(req.params.cycle_id)
    const file = (req as any).file // Vem do multer middleware
    const { document_type, notes } = req.body

    if (!file) {
      return res.status(400).json({ error: 'Arquivo não enviado' })
    }

    if (!document_type) {
      return res.status(400).json({ error: 'document_type é obrigatório' })
    }

    // Buscar ciclo
    const cycle = await prisma.monthlyAccountingCycle.findUnique({
      where: { id: cycleId }
    })

    if (!cycle) {
      return res.status(404).json({ error: 'Ciclo não encontrado' })
    }

    // Salvar documento no banco
    const document = await prisma.clientMonthlyDocument.create({
      data: {
        cycle_id: cycle.id,
        clientId: cycle.clientId,
        documentType: document_type,
        fileName: file.originalname,
        filePath: file.path,
        fileSize: file.size,
        notes: notes || null
      }
    })

    console.log(`📄 Documento ${document_type} enviado para ciclo ${cycleId}`)

    // Verificar se todos os documentos obrigatórios foram enviados
    // Agent 1 salva em monthly_report_data.documentsRequested via saveCycleData
    const reportData = (cycle.monthly_report_data as any) || {}
    const documentsRequest = reportData.documentsRequested
    if (documentsRequest) {
      const docsList = documentsRequest.documents_needed || documentsRequest.documents || []
      const mandatoryDocs = docsList.filter((d: any) => d.mandatory !== false)
      const uploadedDocs = await prisma.clientMonthlyDocument.findMany({
        where: {
          cycle_id: cycle.id,
          clientId: cycle.clientId
        }
      })

      const uploadedTypesUpper = uploadedDocs.map(d => d.documentType.toUpperCase())
      const allMandatoryUploaded = mandatoryDocs.every((d: any) =>
        uploadedTypesUpper.includes((d.type || '').toUpperCase())
      )

      if (allMandatoryUploaded) {
        console.log('✅ Todos os documentos obrigatórios foram enviados! Iniciando processamento...')

        // Disparar processamento em background
        orchestrator.continueProcessingAfterUpload(cycleId).then(result => {
          console.log('✅ Processamento concluído:', result.status)
        }).catch(err => {
          console.error('❌ Erro no processamento:', err)
        })

        return res.status(200).json({
          success: true,
          document,
          message: 'Documento enviado. Todos os documentos obrigatórios recebidos. Processamento iniciado!',
          processing_started: true
        })
      }
    }

    return res.status(200).json({
      success: true,
      document,
      message: 'Documento enviado com sucesso',
      processing_started: false
    })

  } catch (error: any) {
    console.error('❌ Erro ao fazer upload:', error)
    return res.status(500).json({
      error: 'Erro ao fazer upload do documento'
    })
  }
}

/**
 * DELETE /api/monthly-processing/cancel/:cycle_id
 * Cancela um processamento
 */
export async function cancelProcessing(req: Request, res: Response) {
  try {
    const cycleId = Number(req.params.cycle_id)

    const cycle = await prisma.monthlyAccountingCycle.findUnique({
      where: { id: cycleId }
    })

    if (!cycle) {
      return res.status(404).json({ error: 'Ciclo não encontrado' })
    }

    if (cycle.status === 'COMPLETED') {
      return res.status(400).json({
        error: 'Não é possível cancelar um ciclo já concluído'
      })
    }

    await prisma.monthlyAccountingCycle.update({
      where: { id: cycleId },
      data: {
        status: 'CANCELLED',
        processingLog: 'Cancelado pelo usuário',
        updatedAt: new Date()
      }
    })

    return res.status(200).json({
      success: true,
      message: 'Processamento cancelado'
    })

  } catch (error: any) {
    console.error('❌ Erro ao cancelar:', error)
    return res.status(500).json({
      error: 'Erro ao cancelar processamento'
    })
  }
}
