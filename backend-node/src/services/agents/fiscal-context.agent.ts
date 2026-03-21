/**
 * AGENTE 1: Fiscal Context Agent
 * Responsabilidade: Extrair e estruturar informações fiscais das respostas do quiz
 * Modelo: Nenhum (apenas processamento de dados)
 */

interface FiscalContext {
  // Identificação
  person_type: 'pf' | 'mei' | 'pj'
  document_number: string
  cnae: string

  // Estrutura do negócio
  company_country: string
  is_foreign_company: boolean
  business_model: string

  // Receitas e pagamentos
  revenue_source: string
  payment_methods: string[]
  monthly_revenue_range: string
  estimated_monthly_revenue_brl: number

  // Estrutura societária
  has_partners: boolean
  partner_count: number
  profit_distribution: string | null

  // Funcionários
  has_employees: boolean
  employee_count: number
  employee_types: string[]

  // Operações
  issues_brazilian_invoices: boolean
  receives_international_invoices: boolean
  brazil_physical_activities: string[]
  brazil_expenses: string[]

  // Impostos e regime
  pays_foreign_taxes: boolean
  foreign_tax_country: string | null
  preferred_tax_regime: string

  // Contexto adicional
  business_description: string
  tax_doubts: string
  current_situation: string

  // Flags de complexidade
  is_international: boolean
  is_high_revenue: boolean
  is_crypto_related: boolean
  has_complex_structure: boolean
}

export class FiscalContextAgent {

  /**
   * Extrai contexto fiscal estruturado das respostas do questionário
   */
  extract(responses: Record<string, any>): FiscalContext {
    console.log('📋 [Fiscal Context Agent] Extraindo contexto fiscal...')

    // Identificação básica
    const person_type = responses.person_type || 'pf'
    const document_number = responses.document_number || ''
    const cnae = responses.cnae_principal || ''

    // Estrutura da empresa
    const company_country = responses.company_registration_country || 'brazil'
    const is_foreign_company = ['usa_llc', 'usa_corp', 'uk', 'other'].includes(company_country)
    const business_model = responses.business_model || ''

    // Receitas
    const revenue_source = responses.revenue_source || ''
    const payment_methods = Array.isArray(responses.payment_receipt_method)
      ? responses.payment_receipt_method
      : []
    const monthly_revenue_range = responses.monthly_revenue_range || ''

    // Estimar receita em número
    const estimated_monthly_revenue_brl = this.estimateRevenue(monthly_revenue_range)

    // Sócios
    const has_partners_raw = responses.has_partners || 'no'
    const has_partners = has_partners_raw !== 'no'
    const partner_count = this.extractPartnerCount(has_partners_raw)
    const profit_distribution = has_partners ? (responses.profit_distribution || null) : null

    // Funcionários
    const has_employees_raw = responses.has_employees || 'no'
    const has_employees = has_employees_raw !== 'no'
    const employee_count = has_employees ? (responses.employee_count || 0) : 0
    const employee_types = this.extractEmployeeTypes(has_employees_raw)

    // Notas fiscais
    const issues_brazilian_invoices_raw = responses.issues_brazilian_invoices || 'no'
    const issues_brazilian_invoices = ['yes_always', 'yes_sometimes'].includes(issues_brazilian_invoices_raw)

    const receives_international_invoices_raw = responses.receives_international_invoices || 'no'
    const receives_international_invoices = ['yes_sometimes', 'yes_always'].includes(receives_international_invoices_raw)

    // Operações no Brasil
    const brazil_physical_activities = Array.isArray(responses.brazil_physical_activities)
      ? responses.brazil_physical_activities
      : []
    const brazil_expenses = Array.isArray(responses.brazil_expenses)
      ? responses.brazil_expenses
      : []

    // Impostos no exterior
    const pays_foreign_taxes_raw = responses.pays_foreign_taxes || 'no'
    const pays_foreign_taxes = ['yes_llc', 'yes_other'].includes(pays_foreign_taxes_raw)
    const foreign_tax_country = pays_foreign_taxes_raw === 'yes_llc' ? 'USA' : (pays_foreign_taxes_raw === 'yes_other' ? 'other' : null)

    // Preferências
    const preferred_tax_regime = responses.preferred_tax_regime || 'not_sure'

    // Contexto adicional
    const business_description = responses.additional_info || ''
    const tax_doubts = responses.tax_doubts || ''
    const current_situation = responses.current_accounting_situation || ''

    // Flags de complexidade
    const is_international = is_foreign_company || pays_foreign_taxes || receives_international_invoices
    const is_high_revenue = estimated_monthly_revenue_brl > 200000 // > 200k/mês
    const is_crypto_related = payment_methods.includes('crypto') || business_description.toLowerCase().includes('cripto')
    const has_complex_structure = has_partners || employee_count > 10 || is_high_revenue

    const context: FiscalContext = {
      person_type,
      document_number,
      cnae,
      company_country,
      is_foreign_company,
      business_model,
      revenue_source,
      payment_methods,
      monthly_revenue_range,
      estimated_monthly_revenue_brl,
      has_partners,
      partner_count,
      profit_distribution,
      has_employees,
      employee_count,
      employee_types,
      issues_brazilian_invoices,
      receives_international_invoices,
      brazil_physical_activities,
      brazil_expenses,
      pays_foreign_taxes,
      foreign_tax_country,
      preferred_tax_regime,
      business_description,
      tax_doubts,
      current_situation,
      is_international,
      is_high_revenue,
      is_crypto_related,
      has_complex_structure
    }

    console.log('✅ [Fiscal Context Agent] Contexto extraído')
    console.log(`   - Tipo: ${person_type.toUpperCase()}`)
    console.log(`   - Modelo: ${business_model}`)
    console.log(`   - Internacional: ${is_international ? 'SIM' : 'NÃO'}`)
    console.log(`   - Complexo: ${has_complex_structure ? 'SIM' : 'NÃO'}`)

    return context
  }

  private estimateRevenue(range: string): number {
    const map: Record<string, number> = {
      'up_to_3k': 2000,
      '3k_to_10k': 6500,
      '10k_to_30k': 20000,
      '30k_to_81k': 55000,
      '81k_to_200k': 140000,
      '200k_to_500k': 350000,
      'above_500k': 600000
    }
    return map[range] || 10000
  }

  private extractPartnerCount(has_partners: string): number {
    if (has_partners === 'no') return 0
    if (has_partners === 'yes_1') return 1
    if (has_partners === 'yes_2') return 2
    if (has_partners === 'yes_3_plus') return 3
    return 0
  }

  private extractEmployeeTypes(has_employees: string): string[] {
    if (has_employees === 'no') return []
    if (has_employees === 'clt') return ['CLT']
    if (has_employees === 'pj') return ['PJ']
    if (has_employees === 'informal') return ['Informal']
    if (has_employees === 'mixed') return ['CLT', 'PJ']
    return []
  }
}
