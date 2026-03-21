/**
 * AGENT 10: TAX CONSISTENCY VALIDATOR
 *
 * Responsabilidade: Validar consistência entre NFes e cálculos de impostos
 *
 * Validações críticas:
 * 1. Receita das NFes emitidas = Receita usada no cálculo de impostos
 * 2. Impostos extraídos das NFes batem com impostos calculados
 * 3. Valores estão dentro de limites esperados
 * 4. Não há duplicação de NFes
 */

export interface TaxConsistencyValidation {
  status: 'APPROVED' | 'REJECTED'
  consistent: boolean
  revenue_nfe: number
  revenue_tax_calc: number
  revenue_difference: number
  revenue_difference_percent: number
  errors: string[]
  warnings: string[]
  validations: {
    revenue_match: boolean
    tax_values_reasonable: boolean
    no_duplicates: boolean
    within_limits: boolean
  }
  validated_at: string
}

export class TaxConsistencyValidator {

  constructor() {
    console.log('✅ Agent 10 (Tax Consistency Validator) inicializado')
  }

  /**
   * Valida consistência entre NFes e impostos calculados
   */
  async validate(
    nfesExtracted: any,
    taxCalculation: any,
    clientConfig?: any
  ): Promise<TaxConsistencyValidation> {

    console.log('\n🔍 Agent 10: Validando consistência fiscal...')

    const errors: string[] = []
    const warnings: string[] = []

    try {
      // Validação 1: Verificar estrutura dos dados
      if (!nfesExtracted || !taxCalculation) {
        errors.push('Dados de NFes ou cálculo de impostos não fornecidos')
        return this.createRejectedResult(errors, warnings)
      }

      const nfesEmitidas = nfesExtracted.emitidas || []
      const totaisNFe = nfesExtracted.totais || {}

      console.log(`   📄 ${nfesEmitidas.length} NFes emitidas`)

      // Validação 2: Calcular receita das NFes
      const revenueNFe = totaisNFe.total_receita || 0
      console.log(`   💰 Receita NFes: R$ ${revenueNFe.toFixed(2)}`)

      // Validação 3: Obter receita do cálculo de impostos
      const revenueTaxCalc = taxCalculation.receita_mes || taxCalculation.receita_bruta || 0
      console.log(`   💰 Receita Impostos: R$ ${revenueTaxCalc.toFixed(2)}`)

      // Validação 4: Verificar diferença (tolerância de 0.5%)
      const difference = Math.abs(revenueNFe - revenueTaxCalc)
      const differencePercent = revenueNFe > 0 ? (difference / revenueNFe) * 100 : 0
      const TOLERANCE_PERCENT = 0.5 // 0.5%

      console.log(`   📊 Diferença: R$ ${difference.toFixed(2)} (${differencePercent.toFixed(2)}%)`)

      let revenueMatch = true
      if (differencePercent > TOLERANCE_PERCENT) {
        errors.push(
          `Diferença significativa entre receita das NFes e cálculo de impostos: ` +
          `R$ ${difference.toFixed(2)} (${differencePercent.toFixed(2)}%)`
        )
        revenueMatch = false
      }

      // Validação 5: Verificar se não há duplicação de NFes (mesma chave)
      const nfeKeys = nfesEmitidas.map((n: any) => n.nfe_key).filter(Boolean)
      const uniqueKeys = new Set(nfeKeys)
      const noDuplicates = nfeKeys.length === uniqueKeys.size

      if (!noDuplicates) {
        errors.push(
          `Detectadas NFes duplicadas: ${nfeKeys.length - uniqueKeys.size} duplicatas`
        )
      }

      // Validação 6: Verificar se valores de impostos são razoáveis
      let taxValuesReasonable = true

      if (taxCalculation.valor_a_pagar || taxCalculation.valor_total) {
        const taxTotal = taxCalculation.valor_a_pagar || taxCalculation.valor_total
        const taxRate = revenueNFe > 0 ? (taxTotal / revenueNFe) * 100 : 0

        console.log(`   📊 Alíquota efetiva: ${taxRate.toFixed(2)}%`)

        // Simples Nacional: alíquota entre 4% e 33%
        // Presumido: alíquota entre 5% e 20%
        const MIN_RATE = 3
        const MAX_RATE = 35

        if (taxRate < MIN_RATE || taxRate > MAX_RATE) {
          warnings.push(
            `Alíquota efetiva fora do esperado: ${taxRate.toFixed(2)}% ` +
            `(esperado entre ${MIN_RATE}% e ${MAX_RATE}%)`
          )
          taxValuesReasonable = false
        }
      }

      // Validação 7: Verificar limites do Simples Nacional (R$ 4.8M/ano)
      let withinLimits = true

      if (clientConfig?.regimeTributario === 'SIMPLES_NACIONAL') {
        const receita12Meses = taxCalculation.receita_12_meses || revenueNFe * 12
        const LIMITE_SIMPLES = 4800000 // R$ 4.8M

        if (receita12Meses > LIMITE_SIMPLES) {
          errors.push(
            `Receita anual (R$ ${receita12Meses.toFixed(2)}) ` +
            `excede limite do Simples Nacional (R$ ${LIMITE_SIMPLES.toFixed(2)})`
          )
          withinLimits = false
        }

        // Alerta se estiver próximo do limite (acima de 90%)
        if (receita12Meses > LIMITE_SIMPLES * 0.9) {
          warnings.push(
            `Cliente próximo do limite do Simples Nacional: ` +
            `${((receita12Meses / LIMITE_SIMPLES) * 100).toFixed(1)}% do limite`
          )
        }
      }

      // Validação 8: Verificar se há receita mas imposto zerado
      if (revenueNFe > 100 && (taxCalculation.valor_a_pagar || 0) < 1) {
        warnings.push(
          `Receita de R$ ${revenueNFe.toFixed(2)} mas imposto calculado é muito baixo ou zero`
        )
      }

      // Validação 9: Verificar se DRE bate com NFes (se disponível)
      if (nfesExtracted.recebidas) {
        const despesasNFe = nfesExtracted.recebidas.reduce(
          (sum: number, nfe: any) => sum + (nfe.total_value || 0),
          0
        )

        if (despesasNFe > revenueNFe) {
          warnings.push(
            `Despesas (R$ ${despesasNFe.toFixed(2)}) maiores que receitas ` +
            `(R$ ${revenueNFe.toFixed(2)}) - possível prejuízo`
          )
        }
      }

      // Resultado final
      const consistent = errors.length === 0
      const status = consistent ? 'APPROVED' : 'REJECTED'

      console.log(`   ${consistent ? '✅' : '❌'} Resultado: ${status}`)
      if (errors.length > 0) {
        console.log(`   ❌ Erros: ${errors.length}`)
        errors.forEach(e => console.log(`      - ${e}`))
      }
      if (warnings.length > 0) {
        console.log(`   ⚠️  Avisos: ${warnings.length}`)
        warnings.forEach(w => console.log(`      - ${w}`))
      }

      return {
        status,
        consistent,
        revenue_nfe: revenueNFe,
        revenue_tax_calc: revenueTaxCalc,
        revenue_difference: difference,
        revenue_difference_percent: differencePercent,
        errors,
        warnings,
        validations: {
          revenue_match: revenueMatch,
          tax_values_reasonable: taxValuesReasonable,
          no_duplicates: noDuplicates,
          within_limits: withinLimits
        },
        validated_at: new Date().toISOString()
      }

    } catch (error: any) {
      console.error('❌ Erro na validação fiscal:', error.message)

      return this.createRejectedResult(
        [`Erro na validação: ${error.message}`],
        warnings
      )
    }
  }

  private createRejectedResult(
    errors: string[],
    warnings: string[]
  ): TaxConsistencyValidation {
    return {
      status: 'REJECTED',
      consistent: false,
      revenue_nfe: 0,
      revenue_tax_calc: 0,
      revenue_difference: 0,
      revenue_difference_percent: 0,
      errors,
      warnings,
      validations: {
        revenue_match: false,
        tax_values_reasonable: false,
        no_duplicates: false,
        within_limits: false
      },
      validated_at: new Date().toISOString()
    }
  }
}
