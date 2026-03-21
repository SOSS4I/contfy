/**
 * AGENT 5: Tax Calculator - Lucro Presumido
 *
 * Responsabilidade: Calcular impostos do Lucro Presumido
 * Modelo: Claude Opus 4.5
 * Temperature: 0.1
 *
 * Impostos calculados:
 * - IRPJ: 15% + 10% adicional sobre excedente
 * - CSLL: 9% (empresas em geral) ou 20% (financeiras)
 * - PIS: 0.65%
 * - COFINS: 3%
 * - ISS ou ICMS conforme atividade
 */

interface TaxCalculationPresumido {
  regime: string
  receita_mes: number
  receita_trimestre: number

  // Base de cálculo (presunção de lucro)
  presuncao_irpj: number // 8%, 16% ou 32% conforme atividade
  presuncao_csll: number // 12% ou 32%
  base_calculo_irpj: number
  base_calculo_csll: number

  // IRPJ
  irpj_base: number // 15% sobre base
  irpj_adicional: number // 10% sobre excedente de R$ 20k/mês
  irpj_total: number

  // CSLL
  csll_total: number

  // PIS e COFINS
  pis: number
  cofins: number

  // ISS ou ICMS
  iss?: number
  icms?: number

  valor_total: number
  vencimento_irpj: string
  vencimento_csll: string
  vencimento_pis_cofins: string

  warnings: string[]
}

export class TaxCalculatorPresumidoAgent {

  async calculate(
    receitaMes: number,
    receitaTrimestre: number,
    tipoAtividade: string, // 'comercio', 'industria', 'servicos', 'transportes'
    cnae: string,
    referenceMonth?: number,
    referenceYear?: number
  ): Promise<TaxCalculationPresumido> {

    // Percentuais de presunção conforme atividade (LC 123/2006)
    const presuncoes = this.getPresuncao(tipoAtividade, cnae)

    // Base de cálculo = Receita Trimestral × % Presunção
    const baseCalculoIRPJ = receitaTrimestre * (presuncoes.irpj / 100)
    const baseCalculoCSLL = receitaTrimestre * (presuncoes.csll / 100)

    // IRPJ = 15% sobre base
    let irpjBase = baseCalculoIRPJ * 0.15

    // Adicional de 10% sobre excedente de R$ 20.000/mês
    let irpjAdicional = 0
    const limiteAdicional = 20000 * 3 // R$ 60k no trimestre
    if (baseCalculoIRPJ > limiteAdicional) {
      irpjAdicional = (baseCalculoIRPJ - limiteAdicional) * 0.10
    }

    const irpjTotal = irpjBase + irpjAdicional

    // CSLL = 9% sobre base (ou 20% para instituições financeiras)
    const aliquotaCSLL = tipoAtividade === 'financeira' ? 0.20 : 0.09
    const csllTotal = baseCalculoCSLL * aliquotaCSLL

    // PIS e COFINS sobre faturamento bruto (regime cumulativo)
    const pis = receitaMes * 0.0065 // 0.65%
    const cofins = receitaMes * 0.03 // 3%

    // ISS ou ICMS (estimativa)
    let iss: number | undefined
    let icms: number | undefined

    if (tipoAtividade === 'servicos') {
      iss = receitaMes * 0.05 // ISS varia de 2% a 5%, usando 5%
    } else {
      icms = receitaMes * 0.07 // ICMS estimado em 7%
    }

    const valorTotal = irpjTotal + csllTotal + pis + cofins + (iss || icms || 0)

    // Vencimentos
    const mesAtual = referenceMonth ?? (new Date().getMonth() + 1)
    const anoAtual = referenceYear ?? new Date().getFullYear()

    // IRPJ e CSLL: último dia útil do mês seguinte ao trimestre
    const vencimentoIRPJ = this.getUltimoDiaUtil(anoAtual, mesAtual + 1)
    const vencimentoCSLL = vencimentoIRPJ

    // PIS/COFINS: dia 25 do mês seguinte
    const mesPisCofins = mesAtual === 12 ? 1 : mesAtual + 1
    const anoPisCofins = mesAtual === 12 ? anoAtual + 1 : anoAtual
    const vencimentoPisCofins = `${anoPisCofins}-${String(mesPisCofins).padStart(2, '0')}-25`

    // Warnings
    const warnings: string[] = []

    if (receitaTrimestre > 19500000) { // R$ 78 milhões / 4
      warnings.push('⚠️ Receita acima de R$ 78 milhões anuais - Lucro Presumido não é permitido')
    }

    if (baseCalculoIRPJ > limiteAdicional) {
      warnings.push(`💰 Adicional de IRPJ de 10% aplicado (base acima de R$ 60k)`)
    }

    return {
      regime: 'LUCRO_PRESUMIDO',
      receita_mes: receitaMes,
      receita_trimestre: receitaTrimestre,
      presuncao_irpj: presuncoes.irpj,
      presuncao_csll: presuncoes.csll,
      base_calculo_irpj: parseFloat(baseCalculoIRPJ.toFixed(2)),
      base_calculo_csll: parseFloat(baseCalculoCSLL.toFixed(2)),
      irpj_base: parseFloat(irpjBase.toFixed(2)),
      irpj_adicional: parseFloat(irpjAdicional.toFixed(2)),
      irpj_total: parseFloat(irpjTotal.toFixed(2)),
      csll_total: parseFloat(csllTotal.toFixed(2)),
      pis: parseFloat(pis.toFixed(2)),
      cofins: parseFloat(cofins.toFixed(2)),
      iss,
      icms,
      valor_total: parseFloat(valorTotal.toFixed(2)),
      vencimento_irpj: vencimentoIRPJ,
      vencimento_csll: vencimentoCSLL,
      vencimento_pis_cofins: vencimentoPisCofins,
      warnings
    }
  }

  private getPresuncao(tipoAtividade: string, cnae: string): { irpj: number, csll: number } {
    // Percentuais de presunção conforme RIR/2018

    // Serviços em geral: 32% IRPJ e 32% CSLL
    if (tipoAtividade === 'servicos') {
      // Exceções: serviços hospitalares, transporte de cargas, etc (16%)
      const servicosReduzidos = ['8610', '4930', '4940'] // CNAEs de exemplo
      if (servicosReduzidos.some(c => cnae.startsWith(c))) {
        return { irpj: 16, csll: 32 }
      }
      return { irpj: 32, csll: 32 }
    }

    // Comércio e Indústria: 8% IRPJ e 12% CSLL
    if (tipoAtividade === 'comercio' || tipoAtividade === 'industria') {
      return { irpj: 8, csll: 12 }
    }

    // Transportes: 16% IRPJ e 12% CSLL
    if (tipoAtividade === 'transportes') {
      return { irpj: 16, csll: 12 }
    }

    // Instituições financeiras: 16% IRPJ e 32% CSLL
    if (tipoAtividade === 'financeira') {
      return { irpj: 16, csll: 32 }
    }

    // Padrão: serviços
    return { irpj: 32, csll: 32 }
  }

  private getUltimoDiaUtil(ano: number, mes: number): string {
    // Simplificado: sempre dia 30 (na prática seria último dia útil)
    const mesAjustado = mes > 12 ? mes - 12 : mes
    const anoAjustado = mes > 12 ? ano + 1 : ano
    return `${anoAjustado}-${String(mesAjustado).padStart(2, '0')}-30`
  }
}
