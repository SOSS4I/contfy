/**
 * AGENT 11: DATA INTEGRITY VALIDATOR
 *
 * Responsabilidade: Validar integridade geral dos dados do processamento
 *
 * Este agente faz uma validação holística de todos os dados gerados,
 * verificando consistência entre todos os agentes anteriores.
 *
 * Validações:
 * 1. DRE está consistente com NFes e impostos
 * 2. Relatório tem todos os campos obrigatórios
 * 3. Não há dados nulos ou vazios onde não deveria
 * 4. Datas estão corretas
 * 5. Formatos estão padronizados
 */

export interface DataIntegrityValidation {
  status: 'APPROVED' | 'REJECTED'
  integrity_score: number // 0-100
  errors: string[]
  warnings: string[]
  validations: {
    dre_consistent: boolean
    report_complete: boolean
    dates_valid: boolean
    no_null_critical_fields: boolean
    formats_standardized: boolean
  }
  validated_at: string
}

export class DataIntegrityValidator {

  constructor() {
    console.log('✅ Agent 11 (Data Integrity Validator) inicializado')
  }

  /**
   * Valida integridade geral de todos os dados do processamento
   */
  async validate(allData: {
    nfesExtracted?: any
    taxCalculation?: any
    journal?: any
    report?: any
    referenceMonth: number
    referenceYear: number
  }): Promise<DataIntegrityValidation> {

    console.log('\n🔍 Agent 11: Validando integridade dos dados...')

    const errors: string[] = []
    const warnings: string[] = []
    let score = 100 // Começa com 100, vai diminuindo conforme encontra problemas

    try {
      const {
        nfesExtracted,
        taxCalculation,
        journal,
        report,
        referenceMonth,
        referenceYear
      } = allData

      // ===== VALIDAÇÃO 1: DRE consistente com NFes e impostos =====
      let dreConsistent = true

      if (report?.dre && nfesExtracted && taxCalculation) {
        console.log('   📊 Validando DRE...')

        const receitaDRE = report.dre.receita_bruta || 0
        const receitaNFe = nfesExtracted.totais?.total_receita || 0
        const receitaImposto = taxCalculation.receita_mes || 0

        // DRE deve bater com NFes
        if (Math.abs(receitaDRE - receitaNFe) > 1) {
          errors.push(
            `DRE - Receita bruta (R$ ${receitaDRE.toFixed(2)}) ` +
            `difere das NFes (R$ ${receitaNFe.toFixed(2)})`
          )
          dreConsistent = false
          score -= 20
        }

        // Impostos no DRE devem bater
        const impostosDRE = report.dre.impostos || 0
        const impostosCalc = taxCalculation.valor_a_pagar || taxCalculation.valor_total || 0

        if (Math.abs(impostosDRE - impostosCalc) > 1) {
          warnings.push(
            `DRE - Impostos (R$ ${impostosDRE.toFixed(2)}) ` +
            `diferem do cálculo (R$ ${impostosCalc.toFixed(2)})`
          )
          score -= 10
        }

        // Margem líquida deve estar em range razoável (-100% a 100%)
        const margemLiquida = report.dre.margem_liquida || 0
        if (margemLiquida < -100 || margemLiquida > 100) {
          warnings.push(
            `Margem líquida fora do range esperado: ${margemLiquida.toFixed(2)}%`
          )
          score -= 5
        }
      } else {
        warnings.push('DRE não disponível para validação')
        score -= 5
      }

      // ===== VALIDAÇÃO 2: Relatório completo com campos obrigatórios =====
      let reportComplete = true

      if (report) {
        console.log('   📄 Validando completude do relatório...')

        const requiredFields = [
          'dre',
          'indicators',
          'insights',
          'reference_month',
          'reference_year'
        ]

        for (const field of requiredFields) {
          if (!report[field]) {
            errors.push(`Relatório - Campo obrigatório ausente: ${field}`)
            reportComplete = false
            score -= 10
          }
        }

        // DRE deve ter campos essenciais
        if (report.dre) {
          const requiredDREFields = [
            'receita_bruta',
            'impostos',
            'lucro_liquido',
            'margem_liquida'
          ]

          for (const field of requiredDREFields) {
            if (report.dre[field] === undefined || report.dre[field] === null) {
              errors.push(`DRE - Campo obrigatório ausente: ${field}`)
              reportComplete = false
              score -= 5
            }
          }
        }

        // Insights devem existir
        if (!report.insights || report.insights.length === 0) {
          warnings.push('Relatório sem insights gerados')
          score -= 5
        }
      } else {
        errors.push('Relatório não foi gerado')
        reportComplete = false
        score -= 30
      }

      // ===== VALIDAÇÃO 3: Datas válidas =====
      let datesValid = true

      console.log('   📅 Validando datas...')

      // Mês de referência deve ser válido (1-12)
      if (referenceMonth < 1 || referenceMonth > 12) {
        errors.push(`Mês de referência inválido: ${referenceMonth}`)
        datesValid = false
        score -= 10
      }

      // Ano deve ser razoável (2020-2030)
      if (referenceYear < 2020 || referenceYear > 2030) {
        errors.push(`Ano de referência inválido: ${referenceYear}`)
        datesValid = false
        score -= 10
      }

      // NFes devem estar no mês correto
      if (nfesExtracted?.emitidas) {
        for (const nfe of nfesExtracted.emitidas) {
          if (nfe.nfe_date) {
            const nfeDate = new Date(nfe.nfe_date)
            const nfeMonth = nfeDate.getMonth() + 1
            const nfeYear = nfeDate.getFullYear()

            if (nfeMonth !== referenceMonth || nfeYear !== referenceYear) {
              warnings.push(
                `NFe ${nfe.nfe_number} com data fora do período: ` +
                `${nfeMonth}/${nfeYear} (esperado: ${referenceMonth}/${referenceYear})`
              )
              score -= 2
            }
          }
        }
      }

      // ===== VALIDAÇÃO 4: Campos críticos não-nulos =====
      let noCriticalNulls = true

      console.log('   🔍 Validando campos críticos...')

      // NFes extraídas devem ter chave
      if (nfesExtracted?.emitidas) {
        const nfesWithoutKey = nfesExtracted.emitidas.filter((n: any) => !n.nfe_key)
        if (nfesWithoutKey.length > 0) {
          errors.push(`${nfesWithoutKey.length} NFes sem chave de acesso`)
          noCriticalNulls = false
          score -= 15
        }

        // NFes devem ter valor
        const nfesWithoutValue = nfesExtracted.emitidas.filter(
          (n: any) => !n.total_value || n.total_value <= 0
        )
        if (nfesWithoutValue.length > 0) {
          errors.push(`${nfesWithoutValue.length} NFes sem valor ou com valor inválido`)
          noCriticalNulls = false
          score -= 15
        }
      }

      // Cálculo de impostos deve ter valor (pode ser zero legitimamente para isentos)
      if (taxCalculation) {
        const taxValue = taxCalculation.valor_a_pagar ?? taxCalculation.valor_total ?? null
        if (taxValue === null || taxValue === undefined) {
          errors.push('Cálculo de impostos sem valor definido')
          noCriticalNulls = false
          score -= 20
        } else if (taxValue < 0) {
          errors.push('Cálculo de impostos com valor negativo')
          noCriticalNulls = false
          score -= 20
        }
      }

      // ===== VALIDAÇÃO 5: Formatos padronizados =====
      let formatsStandardized = true

      console.log('   📐 Validando formatos...')

      // Valores monetários devem ser números positivos
      const monetaryFields = [
        { obj: report?.dre, field: 'receita_bruta', name: 'DRE - Receita Bruta' },
        { obj: taxCalculation, field: 'valor_a_pagar', name: 'Impostos - Valor a pagar' }
      ]

      for (const { obj, field, name } of monetaryFields) {
        if (obj && obj[field] !== undefined) {
          if (typeof obj[field] !== 'number') {
            warnings.push(`${name} não é um número`)
            formatsStandardized = false
            score -= 3
          }
          if (obj[field] < 0) {
            warnings.push(`${name} é negativo: ${obj[field]}`)
            score -= 3
          }
        }
      }

      // Percentuais devem estar em formato decimal ou inteiro
      if (taxCalculation?.aliquota_efetiva !== undefined) {
        const aliquota = taxCalculation.aliquota_efetiva
        if (typeof aliquota !== 'number' || aliquota < 0 || aliquota > 100) {
          warnings.push(
            `Alíquota efetiva em formato inválido: ${aliquota}`
          )
          formatsStandardized = false
          score -= 3
        }
      }

      // ===== VALIDAÇÃO 6: Verificação de valores razoáveis =====
      console.log('   ⚖️  Validando valores razoáveis...')

      // Se tem receita mas não tem despesas, é estranho
      if (report?.dre) {
        const receita = report.dre.receita_bruta || 0
        const despesas = report.dre.despesas_operacionais || 0

        if (receita > 1000 && despesas === 0) {
          warnings.push(
            `Receita de R$ ${receita.toFixed(2)} mas sem despesas registradas`
          )
          score -= 5
        }
      }

      // Se tem muitas NFes emitidas mas valor baixo, pode ser erro
      if (nfesExtracted?.emitidas) {
        const qtdNFes = nfesExtracted.emitidas.length
        const totalReceita = nfesExtracted.totais?.total_receita || 0

        if (qtdNFes > 50 && totalReceita < 10000) {
          warnings.push(
            `${qtdNFes} NFes emitidas mas receita total muito baixa: R$ ${totalReceita.toFixed(2)}`
          )
          score -= 5
        }
      }

      // ===== RESULTADO FINAL =====

      // Score não pode ser negativo
      score = Math.max(0, score)

      const allValid = errors.length === 0
      const status = allValid && score >= 70 ? 'APPROVED' : 'REJECTED'

      console.log(`   ${status === 'APPROVED' ? '✅' : '❌'} Resultado: ${status}`)
      console.log(`   📊 Score de integridade: ${score}/100`)

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
        integrity_score: score,
        errors,
        warnings,
        validations: {
          dre_consistent: dreConsistent,
          report_complete: reportComplete,
          dates_valid: datesValid,
          no_null_critical_fields: noCriticalNulls,
          formats_standardized: formatsStandardized
        },
        validated_at: new Date().toISOString()
      }

    } catch (error: any) {
      console.error('❌ Erro na validação de integridade:', error.message)

      return {
        status: 'REJECTED',
        integrity_score: 0,
        errors: [`Erro crítico na validação: ${error.message}`],
        warnings,
        validations: {
          dre_consistent: false,
          report_complete: false,
          dates_valid: false,
          no_null_critical_fields: false,
          formats_standardized: false
        },
        validated_at: new Date().toISOString()
      }
    }
  }
}
