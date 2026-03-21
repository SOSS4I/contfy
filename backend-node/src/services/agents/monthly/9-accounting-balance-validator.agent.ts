/**
 * AGENT 9: ACCOUNTING BALANCE VALIDATOR
 *
 * Responsabilidade: Validar se os lançamentos contábeis estão balanceados
 *
 * Princípio: Débitos SEMPRE devem ser iguais aos Créditos
 * Este é um princípio fundamental da contabilidade que NUNCA pode ser violado
 *
 * Validações:
 * 1. Total de débitos = Total de créditos (com tolerância de R$ 0.01)
 * 2. Cada lançamento individual está balanceado
 * 3. Verificar se há contas duplicadas incorretamente
 * 4. Validar se os códigos de conta são válidos
 */

export interface AccountingBalanceValidation {
  status: 'APPROVED' | 'REJECTED'
  balanced: boolean
  total_debits: number
  total_credits: number
  difference: number
  errors: string[]
  warnings: string[]
  entries_validated: number
  validated_at: string
}

export class AccountingBalanceValidator {

  constructor() {
    console.log('✅ Agent 9 (Accounting Balance Validator) inicializado')
  }

  /**
   * Valida se os lançamentos contábeis estão balanceados
   */
  async validate(journal: any): Promise<AccountingBalanceValidation> {
    console.log('\n🔍 Agent 9: Validando balanceamento contábil...')

    const errors: string[] = []
    const warnings: string[] = []

    try {
      // Validação 1: Verificar estrutura do journal
      if (!journal || !journal.entries || !Array.isArray(journal.entries)) {
        errors.push('Estrutura do journal inválida')
        return {
          status: 'REJECTED',
          balanced: false,
          total_debits: 0,
          total_credits: 0,
          difference: 0,
          errors,
          warnings,
          entries_validated: 0,
          validated_at: new Date().toISOString()
        }
      }

      const entries = journal.entries
      console.log(`   📊 Validando ${entries.length} lançamentos...`)

      // Validação 2: Calcular totais
      // Agent 7 produz entries com formato: { account_debit, account_credit, value, description }
      // Em partida dobrada, cada entry debita uma conta e credita outra pelo mesmo valor
      // Agrupamos por conta para verificar se os totais batem
      let totalDebits = 0
      let totalCredits = 0
      const accountBalances: Record<string, { debits: number, credits: number }> = {}

      for (const entry of entries) {
        if (!entry.account_debit || !entry.account_credit) {
          errors.push(`Lançamento inválido: ${entry.description || 'sem descrição'}`)
          continue
        }

        const value = entry.value ?? 0
        if (value < 0) {
          errors.push(`Lançamento com valor negativo: ${entry.description || 'sem descrição'}`)
          continue
        }
        if (value === 0) {
          warnings.push(`Lançamento com valor zero: ${entry.description || 'sem descrição'}`)
          continue
        }

        totalDebits += value
        totalCredits += value

        // Agrupar por conta para análise
        if (!accountBalances[entry.account_debit]) {
          accountBalances[entry.account_debit] = { debits: 0, credits: 0 }
        }
        accountBalances[entry.account_debit].debits += value

        if (!accountBalances[entry.account_credit]) {
          accountBalances[entry.account_credit] = { debits: 0, credits: 0 }
        }
        accountBalances[entry.account_credit].credits += value
      }

      // Verificar se journal.total_debits/total_credits batem com o calculado
      if (journal.total_debits !== undefined && Math.abs(journal.total_debits - totalDebits) > 0.01) {
        errors.push(`Total de débitos informado (R$ ${journal.total_debits?.toFixed(2)}) difere do calculado (R$ ${totalDebits.toFixed(2)})`)
      }
      if (journal.total_credits !== undefined && Math.abs(journal.total_credits - totalCredits) > 0.01) {
        errors.push(`Total de créditos informado (R$ ${journal.total_credits?.toFixed(2)}) difere do calculado (R$ ${totalCredits.toFixed(2)})`)
      }

      console.log(`   💰 Total Débitos: R$ ${totalDebits.toFixed(2)}`)
      console.log(`   💰 Total Créditos: R$ ${totalCredits.toFixed(2)}`)

      // Validação 3: Verificar balanceamento (tolerância de 1 centavo)
      const difference = Math.abs(totalDebits - totalCredits)
      const TOLERANCE = 0.01

      if (difference > TOLERANCE) {
        errors.push(
          `Lançamentos NÃO balanceados: diferença de R$ ${difference.toFixed(2)}`
        )
      }

      // Validação 4: Verificar se há lançamentos com valor zero
      const zeroValueEntries = entries.filter((e: any) =>
        !e.value || e.value === 0
      )

      if (zeroValueEntries.length > 0) {
        warnings.push(`${zeroValueEntries.length} lançamentos com valor zero`)
      }

      // Validação 5: Verificar se há contas duplicadas na mesma entrada
      for (const entry of entries) {
        if (entry.account_debit === entry.account_credit) {
          warnings.push(
            `Lançamento com mesma conta no débito e crédito: ${entry.account_debit}`
          )
        }
      }

      // Validação 6: Verificar se códigos de conta são válidos (formato X.X.X.XX)
      const invalidAccounts = entries.filter((e: any) => {
        const debitAccount = e.account_debit || ''
        const creditAccount = e.account_credit || ''

        // Formato válido: X.X.X.XX (exemplo: 1.1.2.01) - formato usado pelo Agent 7
        const accountRegex = /^\d+\.\d+\.\d+\.\d+/

        return !accountRegex.test(debitAccount) || !accountRegex.test(creditAccount)
      })

      if (invalidAccounts.length > 0) {
        warnings.push(
          `${invalidAccounts.length} lançamentos com códigos de conta em formato inválido`
        )
      }

      // Resultado final
      const balanced = difference <= TOLERANCE && errors.length === 0
      const status = balanced ? 'APPROVED' : 'REJECTED'

      console.log(`   ${balanced ? '✅' : '❌'} Resultado: ${status}`)
      if (errors.length > 0) {
        console.log(`   ❌ Erros: ${errors.length}`)
        errors.forEach(e => console.log(`      - ${e}`))
      }
      if (warnings.length > 0) {
        console.log(`   ⚠️  Avisos: ${warnings.length}`)
      }

      return {
        status,
        balanced,
        total_debits: totalDebits,
        total_credits: totalCredits,
        difference,
        errors,
        warnings,
        entries_validated: entries.length,
        validated_at: new Date().toISOString()
      }

    } catch (error: any) {
      console.error('❌ Erro na validação contábil:', error.message)

      return {
        status: 'REJECTED',
        balanced: false,
        total_debits: 0,
        total_credits: 0,
        difference: 0,
        errors: [`Erro na validação: ${error.message}`],
        warnings,
        entries_validated: 0,
        validated_at: new Date().toISOString()
      }
    }
  }

  /**
   * Valida apenas um lançamento individual
   */
  validateSingleEntry(entry: any): { valid: boolean; error?: string } {
    if (!entry.account_debit || !entry.account_credit) {
      return { valid: false, error: 'Lançamento deve ter conta de débito e crédito' }
    }

    if (!entry.value || entry.value <= 0) {
      return { valid: false, error: 'Valor não especificado ou inválido' }
    }

    return { valid: true }
  }
}
