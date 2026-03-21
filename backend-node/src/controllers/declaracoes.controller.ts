/**
 * Declarações Controller
 * ======================
 *
 * Endpoint para obrigações fiscais / declarações.
 * Gera dados a partir dos ciclos mensais processados (DAS, DEFIS, etc.)
 */

import { Request, Response } from 'express'
import { prisma } from '../utils/prisma'

/**
 * GET /declaracoes/cliente/:clientId
 * Retorna obrigações fiscais do cliente baseadas nos ciclos processados
 */
export const getDeclaracoesCliente = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    const clientId = user.role === 'cliente' ? user.id : parseInt(req.params.clientId)

    if (!clientId) {
      return res.status(400).json({ detail: 'Client ID é obrigatório' })
    }

    // Buscar ciclos mensais processados
    const cycles = await prisma.$queryRaw<any[]>`
      SELECT
        mac.id,
        mac.reference_month,
        mac.reference_year,
        mac.status,
        mac.tax_calculation,
        mac.das_pdf_path,
        mac.created_at,
        mac.updated_at
      FROM monthly_accounting_cycles mac
      WHERE mac.client_id = ${clientId}
      ORDER BY mac.reference_year DESC, mac.reference_month DESC
    `

    // Buscar config do cliente
    const config = await prisma.$queryRaw<any[]>`
      SELECT regime_tributario FROM client_accounting_config
      WHERE client_id = ${clientId} AND status = 'APPROVED' LIMIT 1
    `
    const regime = config[0]?.regime_tributario || 'SIMPLES_NACIONAL'

    // Montar declarações a partir dos ciclos
    const declaracoes = cycles.map((cycle: any) => {
      const monthNames = ['', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
      const monthName = monthNames[cycle.reference_month] || ''

      let taxData: any = null
      try {
        taxData = typeof cycle.tax_calculation === 'string'
          ? JSON.parse(cycle.tax_calculation)
          : cycle.tax_calculation
      } catch {}

      let status: 'enviada' | 'processando' | 'pendente' = 'pendente'
      if (cycle.status === 'COMPLETED') status = 'enviada'
      else if (['IN_PROGRESS', 'WAITING_DOCUMENTS'].includes(cycle.status)) status = 'processando'

      const tipo = regime === 'SIMPLES_NACIONAL' ? 'DAS' : 'DARF'

      return {
        id: cycle.id.toString(),
        tipo,
        periodo: `${monthName} ${cycle.reference_year}`,
        mes: cycle.reference_month,
        ano: cycle.reference_year,
        descricao: `${tipo} - Imposto mensal ${monthName}/${cycle.reference_year}`,
        status,
        valor: taxData?.valor_a_pagar ?? taxData?.total_imposto ?? null,
        aliquota_efetiva: taxData?.aliquota_efetiva ?? null,
        receita_bruta: taxData?.receita_bruta_mensal ?? null,
        das_pdf_path: cycle.das_pdf_path,
        data_processamento: cycle.updated_at ? new Date(cycle.updated_at).toLocaleDateString('pt-BR') : null,
        created_at: cycle.created_at,
      }
    })

    // Gerar obrigações anuais (DEFIS para Simples Nacional)
    const anos = [...new Set(cycles.map((c: any) => c.reference_year))]
    const anuais = anos.map((ano: any) => {
      const cyclesDoAno = cycles.filter((c: any) => c.reference_year === ano)
      const completed = cyclesDoAno.filter((c: any) => c.status === 'COMPLETED')

      return {
        id: `defis-${ano}`,
        tipo: regime === 'SIMPLES_NACIONAL' ? 'DEFIS' : 'ECF',
        periodo: `Ano-calendário ${ano}`,
        mes: 0,
        ano,
        descricao: regime === 'SIMPLES_NACIONAL'
          ? `DEFIS - Declaração de Informações Socioeconômicas e Fiscais ${ano}`
          : `ECF - Escrituração Contábil Fiscal ${ano}`,
        status: completed.length >= 12 ? 'enviada' as const : 'pendente' as const,
        valor: null,
        meses_processados: completed.length,
        total_meses: 12,
        data_processamento: null,
        created_at: null,
      }
    })

    // Stats
    const stats = {
      total: declaracoes.length + anuais.length,
      enviadas: declaracoes.filter((d: any) => d.status === 'enviada').length + anuais.filter((d: any) => d.status === 'enviada').length,
      pendentes: declaracoes.filter((d: any) => d.status === 'pendente').length + anuais.filter((d: any) => d.status === 'pendente').length,
      processando: declaracoes.filter((d: any) => d.status === 'processando').length,
    }

    res.json({
      data: {
        mensais: declaracoes,
        anuais,
        stats,
        regime,
      }
    })

  } catch (error: any) {
    console.error('Erro ao buscar declarações:', error)
    res.status(500).json({ detail: 'Erro ao buscar declarações' })
  }
}

/**
 * GET /declaracoes/all
 * Retorna declarações de todos os clientes (para contador)
 */
export const getTodasDeclaracoes = async (req: Request, res: Response) => {
  try {
    const cycles = await prisma.$queryRaw<any[]>`
      SELECT
        mac.id,
        mac.client_id,
        mac.reference_month,
        mac.reference_year,
        mac.status,
        mac.tax_calculation,
        mac.created_at,
        mac.updated_at,
        c.name as client_name,
        c.cnpj as client_cnpj,
        cac.regime_tributario
      FROM monthly_accounting_cycles mac
      JOIN clients c ON c.id = mac.client_id
      LEFT JOIN client_accounting_config cac ON cac.client_id = mac.client_id AND cac.status = 'APPROVED'
      ORDER BY mac.reference_year DESC, mac.reference_month DESC, c.name ASC
    `

    const monthNames = ['', 'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
      'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

    const declaracoes = cycles.map((cycle: any) => {
      let taxData: any = null
      try {
        taxData = typeof cycle.tax_calculation === 'string'
          ? JSON.parse(cycle.tax_calculation)
          : cycle.tax_calculation
      } catch {}

      let status: 'enviada' | 'processando' | 'pendente' = 'pendente'
      if (cycle.status === 'COMPLETED') status = 'enviada'
      else if (['IN_PROGRESS', 'WAITING_DOCUMENTS'].includes(cycle.status)) status = 'processando'

      const regime = cycle.regime_tributario || 'SIMPLES_NACIONAL'
      const tipo = regime === 'SIMPLES_NACIONAL' ? 'DAS' : 'DARF'

      return {
        id: cycle.id.toString(),
        client_id: cycle.client_id,
        client_name: cycle.client_name,
        client_cnpj: cycle.client_cnpj,
        tipo,
        periodo: `${monthNames[cycle.reference_month]}/${cycle.reference_year}`,
        mes: cycle.reference_month,
        ano: cycle.reference_year,
        status,
        valor: taxData?.valor_a_pagar ?? taxData?.total_imposto ?? null,
        data_processamento: cycle.updated_at ? new Date(cycle.updated_at).toLocaleDateString('pt-BR') : null,
      }
    })

    // Stats gerais
    const stats = {
      total: declaracoes.length,
      enviadas: declaracoes.filter((d: any) => d.status === 'enviada').length,
      pendentes: declaracoes.filter((d: any) => d.status === 'pendente').length,
      processando: declaracoes.filter((d: any) => d.status === 'processando').length,
      clientes_ativos: new Set(cycles.map((c: any) => c.client_id)).size,
    }

    res.json({ data: { declaracoes, stats } })

  } catch (error: any) {
    console.error('Erro ao buscar todas declarações:', error)
    res.status(500).json({ detail: 'Erro ao buscar declarações' })
  }
}
