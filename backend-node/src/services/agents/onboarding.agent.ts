/**
 * AGENTE 1: Onboarding Agent
 * Responsabilidade: Analisar respostas do questionário e extrair informações estruturadas
 */

export class OnboardingAgent {
  async analyze(responses: Record<string, any>): Promise<any> {
    console.log('🤖 [Onboarding Agent] Analisando respostas...')

    // Extrair informações estruturadas
    const analysis = {
      person_type: responses.person_type || 'pf',
      business_model: responses.business_model || 'other',
      company_country: responses.company_country || 'brazil',
      operation_locations: Array.isArray(responses.operation_location)
        ? responses.operation_location
        : [responses.operation_location].filter(Boolean),
      revenue_source: responses.revenue_source || 'brazilian_customers',
      payment_methods: Array.isArray(responses.payment_method)
        ? responses.payment_method
        : [responses.payment_method].filter(Boolean),
      brazil_activities: Array.isArray(responses.brazil_activities)
        ? responses.brazil_activities
        : [responses.brazil_activities].filter(Boolean),
      payment_instrument_ads: responses.payment_instrument_ads || null,
      has_employees: responses.has_employees === true || responses.has_employees === 'true',
      employee_count: parseInt(responses.employee_count) || 0,
      employee_locations: Array.isArray(responses.employee_location)
        ? responses.employee_location
        : [responses.employee_location].filter(Boolean),
      issues_invoices: responses.issues_invoices === true || responses.issues_invoices === 'true',
      invoice_types: Array.isArray(responses.invoice_type)
        ? responses.invoice_type
        : [responses.invoice_type].filter(Boolean),
      foreign_taxes: responses.foreign_taxes === true || responses.foreign_taxes === 'true',
      foreign_tax_countries: responses.foreign_tax_countries || null,
      has_partners: responses.has_partners === true || responses.has_partners === 'true',
      monthly_revenue_range: responses.monthly_revenue_range || 'up_to_5k',
      additional_info: responses.additional_info || null,

      // Flags derivadas para facilitar classificação
      is_foreign_company: responses.company_country !== 'brazil',
      receives_from_abroad: responses.revenue_source === 'foreign_company' ||
                          responses.revenue_source === 'foreign_customers',
      has_brazil_operations: responses.brazil_activities &&
                           responses.brazil_activities.length > 0 &&
                           !responses.brazil_activities.includes('none'),
      pays_foreign_taxes: responses.foreign_taxes === true || responses.foreign_taxes === 'true'
    }

    console.log('✅ [Onboarding Agent] Análise concluída')
    console.log('📊 Resumo:', {
      person_type: analysis.person_type,
      business_model: analysis.business_model,
      is_foreign_company: analysis.is_foreign_company,
      receives_from_abroad: analysis.receives_from_abroad
    })

    return analysis
  }
}
