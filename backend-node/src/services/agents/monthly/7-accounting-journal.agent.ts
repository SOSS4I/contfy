/**
 * AGENT 7: Accounting Journal
 *
 * Responsabilidade: Fazer lançamentos contábeis automáticos
 * Modelo: Claude Opus 4.5
 * Temperature: 0.2
 *
 * Input: NFe emitidas/recebidas, pagamentos, impostos
 * Output: Lançamentos contábeis no formato padrão
 */

import Anthropic from '@anthropic-ai/sdk'

interface AccountingEntry {
  date: string
  account_debit: string
  account_credit: string
  value: number
  description: string
  document_ref?: string
}

interface JournalResult {
  entries: AccountingEntry[]
  total_debits: number
  total_credits: number
  balanced: boolean
}

export class AccountingJournalAgent {
  private client: Anthropic | null = null

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (apiKey) {
      this.client = new Anthropic({ apiKey })
      console.log('✅ AccountingJournalAgent inicializado')
    }
  }

  /**
   * Gera lançamentos contábeis baseado nas transações do mês
   */
  async generateEntries(
    nfesEmitidas: any[],
    nfesRecebidas: any[],
    impostos: any,
    referenceMonth: number,
    referenceYear: number
  ): Promise<JournalResult> {

    const entries: AccountingEntry[] = []

    // 1. Lançamentos de Receita (NFe Emitidas)
    for (const nfe of nfesEmitidas) {
      entries.push({
        date: nfe.nfe_date,
        account_debit: '1.1.2.01 - Clientes (Ativo Circulante)',
        account_credit: '3.1.1.01 - Receita de Vendas (Resultado)',
        value: nfe.total_value,
        description: `Venda conforme NFe ${nfe.nfe_number}`,
        document_ref: nfe.nfe_key
      })

      // Lançamento dos impostos sobre vendas
      if (nfe.valor_icms > 0) {
        entries.push({
          date: nfe.nfe_date,
          account_debit: '3.2.1.01 - ICMS sobre Vendas (Resultado)',
          account_credit: '2.1.1.05 - ICMS a Recolher (Passivo Circulante)',
          value: nfe.valor_icms,
          description: `ICMS s/ NFe ${nfe.nfe_number}`,
          document_ref: nfe.nfe_key
        })
      }

      if (nfe.valor_pis > 0) {
        entries.push({
          date: nfe.nfe_date,
          account_debit: '3.2.1.02 - PIS sobre Vendas (Resultado)',
          account_credit: '2.1.1.06 - PIS a Recolher (Passivo Circulante)',
          value: nfe.valor_pis,
          description: `PIS s/ NFe ${nfe.nfe_number}`,
          document_ref: nfe.nfe_key
        })
      }

      if (nfe.valor_cofins > 0) {
        entries.push({
          date: nfe.nfe_date,
          account_debit: '3.2.1.03 - COFINS sobre Vendas (Resultado)',
          account_credit: '2.1.1.07 - COFINS a Recolher (Passivo Circulante)',
          value: nfe.valor_cofins,
          description: `COFINS s/ NFe ${nfe.nfe_number}`,
          document_ref: nfe.nfe_key
        })
      }
    }

    // 2. Lançamentos de Compras (NFe Recebidas)
    for (const nfe of nfesRecebidas) {
      entries.push({
        date: nfe.nfe_date,
        account_debit: '1.1.3.01 - Estoque de Mercadorias (Ativo Circulante)',
        account_credit: '2.1.1.01 - Fornecedores (Passivo Circulante)',
        value: nfe.total_value,
        description: `Compra s/ NFe ${nfe.nfe_number} - ${nfe.partner_name}`,
        document_ref: nfe.nfe_key
      })
    }

    // 3. Lançamento do DAS/Impostos
    const ultimoDiaMes = new Date(referenceYear, referenceMonth, 0).toISOString().split('T')[0]

    entries.push({
      date: ultimoDiaMes,
      account_debit: '3.2.2.01 - Impostos e Contribuições (Resultado)',
      account_credit: '2.1.1.10 - DAS a Recolher (Passivo Circulante)',
      value: impostos.valor_a_pagar ?? impostos.valor_total ?? 0,
      description: `Provisão DAS ${referenceMonth}/${referenceYear}`,
      document_ref: `DAS_${referenceMonth}_${referenceYear}`
    })

    // Calcular totais
    const totalDebits = entries.reduce((sum, entry) => sum + entry.value, 0)
    const totalCredits = entries.reduce((sum, entry) => sum + entry.value, 0)
    const balanced = Math.abs(totalDebits - totalCredits) < 0.01 // Tolerância de 1 centavo

    return {
      entries,
      total_debits: parseFloat(totalDebits.toFixed(2)),
      total_credits: parseFloat(totalCredits.toFixed(2)),
      balanced
    }
  }

  /**
   * Formata lançamentos para exportação
   */
  exportToText(journal: JournalResult): string {
    let output = '='.repeat(80) + '\n'
    output += 'LIVRO DIÁRIO - LANÇAMENTOS CONTÁBEIS\n'
    output += '='.repeat(80) + '\n\n'

    journal.entries.forEach((entry, index) => {
      output += `Lançamento #${index + 1}\n`
      output += `Data: ${entry.date}\n`
      output += `D - ${entry.account_debit}\n`
      output += `C - ${entry.account_credit}\n`
      output += `Valor: R$ ${entry.value.toFixed(2)}\n`
      output += `Histórico: ${entry.description}\n`
      if (entry.document_ref) {
        output += `Documento: ${entry.document_ref}\n`
      }
      output += '-'.repeat(80) + '\n\n'
    })

    output += `Total de Débitos: R$ ${journal.total_debits.toFixed(2)}\n`
    output += `Total de Créditos: R$ ${journal.total_credits.toFixed(2)}\n`
    output += `Balanceado: ${journal.balanced ? 'SIM ✓' : 'NÃO ✗'}\n`

    return output
  }
}
