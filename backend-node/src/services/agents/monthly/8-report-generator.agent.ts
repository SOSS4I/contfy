/**
 * AGENT 8: Report Generator
 *
 * Responsabilidade: Gerar relatórios gerenciais para o cliente
 * Modelo: Claude Opus 4.5
 * Temperature: 0.3
 *
 * Output:
 * - DRE (Demonstração do Resultado do Exercício)
 * - Balanço Patrimonial simplificado
 * - Análise de indicadores
 * - Comparativo mês a mês
 * - Insights e alertas
 */

import Anthropic from '@anthropic-ai/sdk'

interface MonthlyReport {
  // Período de referência
  reference_month: number
  reference_year: number

  // DRE
  dre: {
    receita_bruta: number
    deducoes: number
    receita_liquida: number
    custos: number
    lucro_bruto: number
    despesas_operacionais: number
    lucro_operacional: number
    impostos: number
    lucro_liquido: number
    margem_liquida: number
  }

  // Indicadores
  indicators: {
    faturamento_vs_mes_anterior: number // %
    margem_vs_mes_anterior: number // %
    impostos_percentual: number
    ticket_medio?: number
  }

  // Insights da IA
  insights: string[]
  warnings: string[]
  recommendations: string[]
}

export class ReportGeneratorAgent {
  private client: Anthropic | null = null

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (apiKey) {
      this.client = new Anthropic({ apiKey })
      console.log('✅ ReportGeneratorAgent inicializado')
    }
  }

  /**
   * Gera relatório completo do mês
   */
  async generateMonthlyReport(
    nfesEmitidas: any[],
    nfesRecebidas: any[],
    impostos: any,
    historico?: any[], // Meses anteriores
    referenceMonth?: number,
    referenceYear?: number
  ): Promise<MonthlyReport> {

    // Calcular DRE
    const receitaBruta = nfesEmitidas.reduce((sum, nfe) => sum + nfe.total_value, 0)
    const deducoes = nfesEmitidas.reduce((sum, nfe) =>
      sum + (nfe.valor_icms || 0) + (nfe.valor_pis || 0) + (nfe.valor_cofins || 0), 0
    )
    const receitaLiquida = receitaBruta - deducoes

    const custos = nfesRecebidas.reduce((sum, nfe) => sum + nfe.total_value, 0)
    const lucroBruto = receitaLiquida - custos

    const impostosTotal = impostos.valor_a_pagar || impostos.valor_total || 0
    const lucroLiquido = lucroBruto - impostosTotal

    const margemLiquida = receitaBruta > 0 ? (lucroLiquido / receitaBruta) * 100 : 0

    // Comparação com mês anterior
    let faturamentoVsMesAnterior = 0
    let margemVsMesAnterior = 0

    if (historico && historico.length > 0) {
      const mesAnterior = historico[historico.length - 1]
      if (mesAnterior.receita_bruta > 0) {
        faturamentoVsMesAnterior = ((receitaBruta - mesAnterior.receita_bruta) / mesAnterior.receita_bruta) * 100
      }
      if (mesAnterior.margem_liquida !== undefined) {
        margemVsMesAnterior = margemLiquida - mesAnterior.margem_liquida
      }
    }

    // Ticket médio
    const ticketMedio = nfesEmitidas.length > 0 ? receitaBruta / nfesEmitidas.length : 0

    // Gerar insights com IA
    const insights = await this.generateInsightsWithAI(
      receitaBruta,
      lucroLiquido,
      margemLiquida,
      faturamentoVsMesAnterior,
      historico
    )

    // Warnings
    const warnings: string[] = []
    if (margemLiquida < 10) {
      warnings.push('⚠️ Margem de lucro abaixo de 10% - considere revisar preços ou reduzir custos')
    }
    if (receitaBruta > 0 && impostosTotal / receitaBruta > 0.20) {
      warnings.push('⚠️ Carga tributária acima de 20% - verificar se regime tributário é o mais adequado')
    }
    if (faturamentoVsMesAnterior < -10) {
      warnings.push('⚠️ Queda de faturamento superior a 10% - investigar causas')
    }

    // Recomendações
    const recommendations: string[] = []
    if (margemLiquida > 20) {
      recommendations.push('✅ Margem saudável - considere investir em expansão')
    }
    if (nfesEmitidas.length > historico?.[historico.length - 1]?.quantidade_nfes || 0) {
      recommendations.push('📈 Aumento no número de vendas - estratégia está funcionando')
    }

    return {
      reference_month: referenceMonth || new Date().getMonth() + 1,
      reference_year: referenceYear || new Date().getFullYear(),
      dre: {
        receita_bruta: parseFloat(receitaBruta.toFixed(2)),
        deducoes: parseFloat(deducoes.toFixed(2)),
        receita_liquida: parseFloat(receitaLiquida.toFixed(2)),
        custos: parseFloat(custos.toFixed(2)),
        lucro_bruto: parseFloat(lucroBruto.toFixed(2)),
        despesas_operacionais: 0, // Não temos dados de despesas operacionais
        lucro_operacional: parseFloat(lucroBruto.toFixed(2)),
        impostos: parseFloat(impostosTotal.toFixed(2)),
        lucro_liquido: parseFloat(lucroLiquido.toFixed(2)),
        margem_liquida: parseFloat(margemLiquida.toFixed(2))
      },
      indicators: {
        faturamento_vs_mes_anterior: parseFloat(faturamentoVsMesAnterior.toFixed(2)),
        margem_vs_mes_anterior: parseFloat(margemVsMesAnterior.toFixed(2)),
        impostos_percentual: receitaBruta > 0 ? parseFloat(((impostosTotal / receitaBruta) * 100).toFixed(2)) : 0,
        ticket_medio: parseFloat(ticketMedio.toFixed(2))
      },
      insights,
      warnings,
      recommendations
    }
  }

  /**
   * Gera insights usando Claude
   */
  private async generateInsightsWithAI(
    receita: number,
    lucro: number,
    margem: number,
    variacao: number,
    historico?: any[]
  ): Promise<string[]> {

    if (!this.client) {
      return [
        `Faturamento: R$ ${receita.toFixed(2)}`,
        `Lucro Líquido: R$ ${lucro.toFixed(2)}`,
        `Margem: ${margem.toFixed(2)}%`
      ]
    }

    try {
      const prompt = `Você é um analista financeiro especializado em pequenas e médias empresas.

DADOS DO MÊS:
- Receita Bruta: R$ ${receita.toFixed(2)}
- Lucro Líquido: R$ ${lucro.toFixed(2)}
- Margem de Lucro: ${margem.toFixed(2)}%
- Variação vs Mês Anterior: ${variacao.toFixed(2)}%

HISTÓRICO:
${historico ? JSON.stringify(historico.slice(-3)) : 'Não disponível'}

Gere 3 insights curtos (máximo 100 caracteres cada) sobre a situação financeira desta empresa.
Foque em:
1. Desempenho atual
2. Tendências
3. Oportunidades ou riscos

Retorne apenas os 3 insights, um por linha, sem numeração.`

      const message = await this.client.messages.create({
        model: 'claude-opus-4-5-20251101',
        max_tokens: 512,
        temperature: 0.3,
        messages: [{ role: 'user', content: prompt }]
      })

      const text = message.content[0].type === 'text' ? message.content[0].text : ''
      return text.split('\n').filter(line => line.trim() !== '').slice(0, 3)

    } catch (error) {
      console.error('Erro ao gerar insights:', error)
      return [
        'Receita estável no período',
        'Margem de lucro dentro da média do setor',
        'Continue monitorando os indicadores mensalmente'
      ]
    }
  }

  /**
   * Exporta relatório para PDF
   */
  exportToPDF(report: MonthlyReport, clientName: string, period: string): string {
    // TODO: Implementar geração de PDF do relatório
    // Por enquanto, retorna texto formatado

    let output = `
╔════════════════════════════════════════════════════════════════╗
║          RELATÓRIO GERENCIAL - ${period}                     ║
║          ${clientName}                                        ║
╚════════════════════════════════════════════════════════════════╝

📊 DEMONSTRAÇÃO DO RESULTADO (DRE)
────────────────────────────────────────────────────────────────
Receita Bruta:           R$ ${report.dre.receita_bruta.toFixed(2)}
(-) Deduções:            R$ ${report.dre.deducoes.toFixed(2)}
= Receita Líquida:       R$ ${report.dre.receita_liquida.toFixed(2)}

(-) Custos:              R$ ${report.dre.custos.toFixed(2)}
= Lucro Bruto:           R$ ${report.dre.lucro_bruto.toFixed(2)}

(-) Impostos:            R$ ${report.dre.impostos.toFixed(2)}
= LUCRO LÍQUIDO:         R$ ${report.dre.lucro_liquido.toFixed(2)}

Margem de Lucro:         ${report.dre.margem_liquida.toFixed(2)}%

📈 INDICADORES
────────────────────────────────────────────────────────────────
Variação Faturamento:    ${report.indicators.faturamento_vs_mes_anterior.toFixed(2)}%
Carga Tributária:        ${report.indicators.impostos_percentual.toFixed(2)}%
Ticket Médio:            R$ ${(report.indicators.ticket_medio || 0).toFixed(2)}

💡 INSIGHTS
────────────────────────────────────────────────────────────────
${report.insights.map(i => `• ${i}`).join('\n')}

${report.warnings.length > 0 ? `
⚠️  ALERTAS
────────────────────────────────────────────────────────────────
${report.warnings.join('\n')}
` : ''}

${report.recommendations.length > 0 ? `
✅ RECOMENDAÇÕES
────────────────────────────────────────────────────────────────
${report.recommendations.join('\n')}
` : ''}
`
    return output
  }
}
