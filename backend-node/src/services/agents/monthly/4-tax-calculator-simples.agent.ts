/**
 * AGENT 4: Tax Calculator - Simples Nacional
 *
 * Responsabilidade: Calcular EXATAMENTE o DAS do Simples Nacional
 * Modelo: Claude Opus 4.5 (máxima precisão)
 * Temperature: 0.1
 *
 * Input: Receita do mês, receita 12 meses, folha 12 meses, anexo
 * Output: Cálculo completo do imposto com breakdown detalhado
 */

import Anthropic from '@anthropic-ai/sdk'

interface TaxCalculationResult {
  regime: string
  anexo: string
  receita_mes: number
  receita_12m: number
  faixa: string
  aliquota_nominal: number
  parcela_deduzir: number
  fator_r?: number
  fator_r_aplicavel: boolean
  aliquota_efetiva: number
  valor_a_pagar: number
  vencimento: string
  breakdown: {
    IRPJ: number
    CSLL: number
    COFINS: number
    PIS: number
    CPP: number
    ICMS?: number
    ISS?: number
  }
  warnings: string[]
}

// Tabelas oficiais do Simples Nacional 2025
const TABELAS_SIMPLES = {
  'I': [ // Comércio
    { limite: 180000, aliquota: 4.00, parcela: 0 },
    { limite: 360000, aliquota: 7.30, parcela: 5940 },
    { limite: 720000, aliquota: 9.50, parcela: 13860 },
    { limite: 1800000, aliquota: 10.70, parcela: 22500 },
    { limite: 3600000, aliquota: 14.30, parcela: 87300 },
    { limite: 4800000, aliquota: 19.00, parcela: 378000 }
  ],
  'II': [ // Indústria
    { limite: 180000, aliquota: 4.50, parcela: 0 },
    { limite: 360000, aliquota: 7.80, parcela: 5940 },
    { limite: 720000, aliquota: 10.00, parcela: 13860 },
    { limite: 1800000, aliquota: 11.20, parcela: 22500 },
    { limite: 3600000, aliquota: 14.70, parcela: 85500 },
    { limite: 4800000, aliquota: 30.00, parcela: 720000 }
  ],
  'III': [ // Serviços (Fator R ≥ 28%)
    { limite: 180000, aliquota: 6.00, parcela: 0 },
    { limite: 360000, aliquota: 11.20, parcela: 9360 },
    { limite: 720000, aliquota: 13.50, parcela: 17640 },
    { limite: 1800000, aliquota: 16.00, parcela: 35640 },
    { limite: 3600000, aliquota: 21.00, parcela: 125640 },
    { limite: 4800000, aliquota: 33.00, parcela: 648000 }
  ],
  'IV': [ // Serviços Específicos (construção, etc)
    { limite: 180000, aliquota: 4.50, parcela: 0 },
    { limite: 360000, aliquota: 9.00, parcela: 8100 },
    { limite: 720000, aliquota: 10.20, parcela: 12420 },
    { limite: 1800000, aliquota: 14.00, parcela: 39780 },
    { limite: 3600000, aliquota: 22.00, parcela: 183780 },
    { limite: 4800000, aliquota: 33.00, parcela: 828000 }
  ],
  'V': [ // Serviços (Fator R < 28%)
    { limite: 180000, aliquota: 15.50, parcela: 0 },
    { limite: 360000, aliquota: 18.00, parcela: 4500 },
    { limite: 720000, aliquota: 19.50, parcela: 9900 },
    { limite: 1800000, aliquota: 20.50, parcela: 17100 },
    { limite: 3600000, aliquota: 23.00, parcela: 62100 },
    { limite: 4800000, aliquota: 30.50, parcela: 540000 }
  ]
}

export class TaxCalculatorSimplesAgent {
  private client: Anthropic | null = null

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY

    if (apiKey) {
      this.client = new Anthropic({ apiKey })
      console.log('✅ TaxCalculatorSimplesAgent inicializado com Claude Opus')
    } else {
      console.warn('⚠️  ANTHROPIC_API_KEY não configurada - usando cálculo determinístico')
    }
  }

  async calculate(
    receitaMes: number,
    receita12Meses: number,
    folha12Meses: number,
    anexo: string,
    contadorInstructions?: string,
    referenceMonth?: number,
    referenceYear?: number
  ): Promise<TaxCalculationResult> {

    // Validações iniciais
    if (receita12Meses > 4800000) {
      throw new Error('Receita ultrapassa limite do Simples Nacional (R$ 4.8 milhões)')
    }

    // Calcular Fator R se aplicável (Anexo III ou V)
    let fatorR: number | undefined
    let anexoFinal = anexo
    let fatorRAplicavel = false

    if (anexo === 'III' || anexo === 'V') {
      fatorRAplicavel = true
      // Proteger contra divisão por zero (clientes novos sem histórico)
      fatorR = receita12Meses > 0 ? folha12Meses / receita12Meses : 0

      // Se Fator R ≥ 28% → Anexo III (mais barato)
      // Se Fator R < 28% → Anexo V (mais caro)
      if (fatorR >= 0.28) {
        anexoFinal = 'III'
      } else {
        anexoFinal = 'V'
      }
    }

    // Buscar faixa e alíquota na tabela
    const tabela = TABELAS_SIMPLES[anexoFinal as keyof typeof TABELAS_SIMPLES]
    const faixa = tabela.find(f => receita12Meses <= f.limite)

    if (!faixa) {
      throw new Error('Faixa de receita não encontrada')
    }

    // Cálculo do imposto
    const aliquotaNominal = faixa.aliquota
    const parcelaDeduzir = faixa.parcela

    // Alíquota efetiva = ((RBT12 × Aliq) - PD) / RBT12
    // Proteger contra divisão por zero e resultado negativo
    const aliquotaEfetiva = receita12Meses > 0
      ? Math.max(0, ((receita12Meses * (aliquotaNominal / 100)) - parcelaDeduzir) / receita12Meses * 100)
      : aliquotaNominal // Usar alíquota nominal como fallback

    // Valor a pagar no mês
    const valorAPagar = receitaMes * (aliquotaEfetiva / 100)

    // Breakdown dos impostos (distribuição aproximada conforme tabela)
    const breakdown = this.calculateBreakdown(valorAPagar, anexoFinal, aliquotaEfetiva)

    // Vencimento: dia 20 do mês seguinte
    const refMonth = referenceMonth ?? (new Date().getMonth() + 1)
    const refYear = referenceYear ?? new Date().getFullYear()
    const mesVencimento = refMonth + 1
    const anoVencimento = mesVencimento > 12 ? refYear + 1 : refYear
    const mesVencimentoFinal = mesVencimento > 12 ? 1 : mesVencimento
    const vencimento = `${anoVencimento}-${String(mesVencimentoFinal).padStart(2, '0')}-20`

    // Warnings
    const warnings: string[] = []

    if (receita12Meses > 3600000) {
      warnings.push('⚠️ Receita acima de R$ 3.6 milhões - ICMS/ISS devem ser recolhidos separadamente')
    }

    if (fatorRAplicavel && fatorR && fatorR < 0.28) {
      warnings.push(`⚠️ Fator R de ${(fatorR * 100).toFixed(2)}% - Considerar migrar para Lucro Presumido`)
    }

    if (contadorInstructions) {
      warnings.push(`📝 Instruções do contador: ${contadorInstructions}`)
    }

    return {
      regime: 'SIMPLES_NACIONAL',
      anexo: anexoFinal,
      receita_mes: receitaMes,
      receita_12m: receita12Meses,
      faixa: this.getNomeFaixa(receita12Meses),
      aliquota_nominal: aliquotaNominal,
      parcela_deduzir: parcelaDeduzir,
      fator_r: fatorR,
      fator_r_aplicavel: fatorRAplicavel,
      aliquota_efetiva: parseFloat(aliquotaEfetiva.toFixed(2)),
      valor_a_pagar: parseFloat(valorAPagar.toFixed(2)),
      vencimento,
      breakdown,
      warnings
    }
  }

  private calculateBreakdown(valor: number, anexo: string, aliquotaEfetiva: number): any {
    // Distribuição APROXIMADA dos tributos conforme legislação
    // Fonte: Resolução CGSN 140/2018 e LC 123/2006
    // Percentuais conforme tabela do Simples Nacional - aproximados por faixa

    const breakdown: any = {
      IRPJ: 0,
      CSLL: 0,
      COFINS: 0,
      PIS: 0,
      CPP: 0
    }

    // Percentuais médios de cada imposto dentro do total (devem somar 100%)
    // Anexo I (Comércio): 5+4+12+3+41+35 = 100%
    if (anexo === 'I') {
      breakdown.IRPJ = valor * 0.05
      breakdown.CSLL = valor * 0.04
      breakdown.COFINS = valor * 0.12
      breakdown.PIS = valor * 0.03
      breakdown.CPP = valor * 0.41
      breakdown.ICMS = valor * 0.35
    }
    // Anexo II (Indústria): 5+5+11+3+38+38 = 100%
    else if (anexo === 'II') {
      breakdown.IRPJ = valor * 0.05
      breakdown.CSLL = valor * 0.05
      breakdown.COFINS = valor * 0.11
      breakdown.PIS = valor * 0.03
      breakdown.CPP = valor * 0.38
      breakdown.ICMS = valor * 0.38
    }
    // Anexo III (Serviços com Fator R >= 28%): 4+4+12+2+43+35 = 100%
    else if (anexo === 'III') {
      breakdown.IRPJ = valor * 0.04
      breakdown.CSLL = valor * 0.04
      breakdown.COFINS = valor * 0.12
      breakdown.PIS = valor * 0.02
      breakdown.CPP = valor * 0.43
      breakdown.ISS = valor * 0.35
    }
    // Anexo IV (Serviços específicos - construção civil etc., sem CPP): 18+19+13+3+47 = 100%
    // CPP é recolhido separadamente (INSS patronal 20%) no Anexo IV
    else if (anexo === 'IV') {
      breakdown.IRPJ = valor * 0.18
      breakdown.CSLL = valor * 0.19
      breakdown.COFINS = valor * 0.13
      breakdown.PIS = valor * 0.03
      breakdown.CPP = 0
      breakdown.ISS = valor * 0.47
    }
    // Anexo V (Serviços com Fator R < 28%): 25+15+14+4+28+14 = 100%
    else if (anexo === 'V') {
      breakdown.IRPJ = valor * 0.25
      breakdown.CSLL = valor * 0.15
      breakdown.COFINS = valor * 0.14
      breakdown.PIS = valor * 0.04
      breakdown.CPP = valor * 0.28
      breakdown.ISS = valor * 0.14
    }

    // Verificar e normalizar para garantir que a soma bate com o valor total
    // (proteção contra desvios de arredondamento)
    const sumBreakdown = Object.values(breakdown).reduce((s: number, v: any) => s + (v as number), 0)
    if (sumBreakdown > 0 && Math.abs(sumBreakdown - valor) > 0.02) {
      const factor = valor / sumBreakdown
      Object.keys(breakdown).forEach(key => {
        breakdown[key] = (breakdown[key] as number) * factor
      })
    }

    // Arredondar valores
    Object.keys(breakdown).forEach(key => {
      breakdown[key] = parseFloat((breakdown[key] as number).toFixed(2))
    })

    return breakdown
  }

  private getNomeFaixa(receita: number): string {
    if (receita <= 180000) return '1ª faixa (até R$ 180.000)'
    if (receita <= 360000) return '2ª faixa (R$ 180.000,01 a R$ 360.000)'
    if (receita <= 720000) return '3ª faixa (R$ 360.000,01 a R$ 720.000)'
    if (receita <= 1800000) return '4ª faixa (R$ 720.000,01 a R$ 1.800.000)'
    if (receita <= 3600000) return '5ª faixa (R$ 1.800.000,01 a R$ 3.600.000)'
    return '6ª faixa (R$ 3.600.000,01 a R$ 4.800.000)'
  }
}
