/**
 * Mapeamento de labels técnicos para labels amigáveis
 */

export const ONBOARDING_FIELD_LABELS: Record<string, string> = {
  // Tipo de Pessoa
  'TIPO_DE_PESSOA': 'Tipo de Pessoa',
  'Pessoa Fisica': 'Pessoa Física',
  'Pessoa Juridica': 'Pessoa Jurídica',

  // Documentos
  'DOCUMENT_NUMBER': 'CPF/CNPJ',
  'CNAE_PRINCIPAL': 'CNAE Principal',
  'COMPANY_REGISTRATION_COUNTRY': 'País de Registro',

  // Negócio
  'MODELO_DE_NEGÓCIO': 'Modelo de Negócio',
  'trader': 'Trader/Operador Financeiro',
  'ecommerce': 'E-commerce',
  'services': 'Prestador de Serviços',
  'retail': 'Varejo',
  'industry': 'Indústria',
  'technology': 'Tecnologia',

  // Fontes de Receita
  'PRINCIPAL_FONTE_DE_RECEITA': 'Principal Fonte de Receita',
  'investments': 'Investimentos',
  'trading': 'Trading/Operações',
  'sales': 'Vendas',
  'subscriptions': 'Assinaturas',

  // Pagamentos
  'PAYMENT_RECEIPT_METHOD': 'Forma de Recebimento',
  'bank_transfer_brazil': 'Transferência Bancária (Brasil)',
  'pix': 'PIX',
  'credit_card': 'Cartão de Crédito',
  'debit_card': 'Cartão de Débito',
  'cash': 'Dinheiro',
  'check': 'Cheque',
  'boleto': 'Boleto Bancário',

  // Faturamento
  'MONTHLY_REVENUE_RANGE': 'Faixa de Faturamento Mensal',
  '0_to_5k': 'Até R$ 5.000',
  '5k_to_10k': 'R$ 5.000 - R$ 10.000',
  '10k_to_20k': 'R$ 10.000 - R$ 20.000',
  '20k_to_50k': 'R$ 20.000 - R$ 50.000',
  '50k_to_100k': 'R$ 50.000 - R$ 100.000',
  '100k_plus': 'Acima de R$ 100.000',
  '3k_to_10k': 'R$ 3.000 - R$ 10.000',

  // Funcionários
  'POSSUI_SÓCIOS': 'Possui Sócios',
  'HAS_EMPLOYEES': 'Possui Funcionários',
  'Não': 'Não',
  'Sim': 'Sim',

  // Notas Fiscais
  'ISSUES_BRAZILIAN_INVOICES': 'Emite Notas Fiscais Brasileiras',
  'RECEIVES_INTERNATIONAL_INVOICES': 'Recebe Notas Fiscais Internacionais',
  'no_not_required': 'Não (não aplicável)',
  'yes_always': 'Sim, sempre',
  'yes_sometimes': 'Sim, ocasionalmente',

  // Atividades no Brasil
  'BRAZIL_PHYSICAL_ACTIVITIES': 'Atividades Físicas no Brasil',
  'office': 'Escritório',
  'store': 'Loja física',
  'warehouse': 'Armazém',
  'factory': 'Fábrica',
  'none': 'Nenhuma',
  'home_office': 'Home Office',

  // Despesas
  'BRAZIL_EXPENSES': 'Principais Despesas no Brasil',
  'rent': 'Aluguel',
  'inventory': 'Estoque',
  'marketing': 'Marketing',
  'software': 'Software/Tecnologia',
  'utilities': 'Contas (água, luz, internet)',

  // Impostos
  'PAGA_IMPOSTOS_NO_EXTERIOR': 'Paga Impostos no Exterior',
  'PREFERRED_TAX_REGIME': 'Regime Tributário Preferido',
  'not_sure': 'Não tenho certeza',
  'simples_nacional': 'Simples Nacional',
  'lucro_presumido': 'Lucro Presumido',
  'lucro_real': 'Lucro Real',
  'mei': 'MEI',

  // Informações Adicionais
  'ADDITIONAL_INFO': 'Informações Adicionais',
  'TAX_DOUBTS': 'Dúvidas sobre Impostos',
  'not_registered': 'Não registrado'
}

/**
 * Formata o valor do campo para exibição
 */
export function formatOnboardingValue(key: string, value: any): string {
  if (value === null || value === undefined || value === '') {
    return 'Não informado'
  }

  // Se for booleano
  if (typeof value === 'boolean') {
    return value ? 'Sim' : 'Não'
  }

  // Se for um valor conhecido, traduzir
  const strValue = String(value)
  if (ONBOARDING_FIELD_LABELS[strValue]) {
    return ONBOARDING_FIELD_LABELS[strValue]
  }

  return strValue
}

/**
 * Formata a chave do campo para exibição
 */
export function formatOnboardingKey(key: string): string {
  if (ONBOARDING_FIELD_LABELS[key]) {
    return ONBOARDING_FIELD_LABELS[key]
  }

  // Converter snake_case para Title Case
  return key
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

/**
 * Detecta o tipo de pessoa baseado nos dados do onboarding
 */
export function detectPersonType(onboardingData: any): 'PF' | 'PJ' | 'Desconhecido' {
  // Verificar CNPJ
  if (onboardingData?.DOCUMENT_NUMBER) {
    const doc = String(onboardingData.DOCUMENT_NUMBER).replace(/\D/g, '')
    if (doc.length === 14) {
      return 'PJ' // CNPJ tem 14 dígitos
    }
    if (doc.length === 11) {
      return 'PF' // CPF tem 11 dígitos
    }
  }

  // Verificar tipo explícito
  if (onboardingData?.TIPO_DE_PESSOA) {
    const tipo = String(onboardingData.TIPO_DE_PESSOA).toLowerCase()
    if (tipo.includes('juridica') || tipo.includes('pj')) {
      return 'PJ'
    }
    if (tipo.includes('fisica') || tipo.includes('pf')) {
      return 'PF'
    }
  }

  // Verificar CNAE (apenas PJ tem)
  if (onboardingData?.CNAE_PRINCIPAL) {
    return 'PJ'
  }

  // Verificar se tem sócios (indicativo de PJ)
  if (onboardingData?.POSSUI_SÓCIOS === 'Sim' || onboardingData?.POSSUI_SÓCIOS === true) {
    return 'PJ'
  }

  return 'Desconhecido'
}
