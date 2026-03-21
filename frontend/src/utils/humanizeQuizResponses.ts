/**
 * Humaniza as respostas do questionário de onboarding
 * Transforma códigos técnicos em texto legível para o contador
 */

interface HumanizedResponse {
  question: string
  answer: string
  icon: string
}

export function humanizeQuizResponses(responses: Record<string, any>): HumanizedResponse[] {
  const humanized: HumanizedResponse[] = []

  // Mapas de tradução
  const translations: Record<string, Record<string, string>> = {
    person_type: {
      pj: 'Pessoa Jurídica (Empresa)',
      pf: 'Pessoa Física'
    },
    business_model: {
      saas: 'SaaS / Software como Serviço',
      ecommerce: 'E-commerce / Loja Online',
      consulting: 'Consultoria',
      marketplace: 'Marketplace',
      digital_products: 'Produtos Digitais (cursos, ebooks)',
      retail: 'Varejo / Comércio',
      services: 'Prestação de Serviços',
      manufacturing: 'Indústria / Fabricação',
      other: 'Outro'
    },
    country: {
      brazil: 'Brasil',
      usa: 'Estados Unidos',
      other: 'Outro país'
    },
    revenue_source: {
      brazilian_customers_cpf: 'Clientes Brasileiros (CPF)',
      brazilian_companies_cnpj: 'Empresas Brasileiras (CNPJ)',
      foreign_customers: 'Clientes do Exterior',
      mixed: 'Misto (Brasil + Exterior)'
    },
    payment_methods: {
      pix: 'PIX',
      boleto: 'Boleto',
      credit_card: 'Cartão de Crédito',
      debit_card: 'Cartão de Débito',
      cash: 'Dinheiro',
      bank_transfer: 'Transferência Bancária',
      international_payment: 'Pagamento Internacional (Stripe, PayPal)',
      crypto: 'Criptomoedas'
    },
    revenue_range: {
      '0_to_5k': 'Até R$ 5.000',
      '5k_to_10k': 'R$ 5.000 a R$ 10.000',
      '10k_to_30k': 'R$ 10.000 a R$ 30.000',
      '30k_to_50k': 'R$ 30.000 a R$ 50.000',
      '50k_to_100k': 'R$ 50.000 a R$ 100.000',
      '100k_plus': 'Acima de R$ 100.000'
    },
    partner_distribution: {
      equal: 'Distribuição Igual entre Sócios',
      percentage: 'Por Percentual Fixo',
      performance: 'Por Desempenho/Resultado',
      other: 'Outro Modelo'
    },
    employee_type: {
      clt: 'CLT (Funcionários Registrados)',
      pj: 'PJ (Prestadores de Serviço)',
      informal: 'Informal',
      no_employees: 'Não Tenho Funcionários'
    },
    nfe_frequency: {
      yes_always: 'Sim, Sempre Emito',
      yes_sometimes: 'Sim, Às Vezes',
      no: 'Não Emito',
      dont_know: 'Não Sei'
    },
    physical_activities: {
      office: 'Escritório / Espaço Comercial',
      warehouse: 'Galpão / Depósito',
      retail_store: 'Loja Física de Varejo',
      factory: 'Fábrica',
      home_office: 'Home Office',
      coworking: 'Coworking',
      no_physical: 'Sem Espaço Físico (100% Online)'
    },
    expenses: {
      rent: 'Aluguel',
      products: 'Compra de Produtos/Mercadorias',
      services: 'Serviços Terceirizados',
      salaries: 'Salários e Encargos',
      ads: 'Anúncios e Marketing',
      software: 'Software e Ferramentas',
      infrastructure: 'Infraestrutura (servidor, cloud)',
      none: 'Sem Gastos no Brasil'
    },
    tax_regime_preference: {
      simples_nacional: 'Simples Nacional',
      lucro_presumido: 'Lucro Presumido',
      lucro_real: 'Lucro Real',
      mei: 'MEI (Microempreendedor Individual)',
      dont_know: 'Não Sei / Preciso de Ajuda'
    },
    contador_status: {
      no_contador: 'Não Tenho Contador',
      has_contador: 'Já Tenho Contador',
      looking: 'Estou Procurando'
    }
  }

  // Mapeamento de perguntas
  const questionLabels: Record<string, string> = {
    person_type: 'Tipo de Pessoa',
    cnpj: 'CNPJ',
    cpf: 'CPF',
    cnae: 'CNAE',
    business_model: 'Modelo de Negócio',
    country: 'Onde Está Registrado',
    revenue_source: 'Principal Fonte de Receita',
    payment_methods: 'Formas de Pagamento',
    revenue_range: 'Faixa de Faturamento Mensal',
    has_partners: 'Possui Sócios',
    partner_count: 'Quantidade de Sócios',
    partner_distribution: 'Distribuição de Lucros',
    employee_type: 'Tipo de Funcionários',
    employee_count: 'Quantidade de Funcionários',
    nfe_frequency: 'Emite Notas Fiscais',
    receives_foreign_invoices: 'Recebe Invoices do Exterior',
    physical_activities: 'Atividades Físicas no Brasil',
    expenses: 'Gastos no Brasil',
    pays_foreign_taxes: 'Paga Impostos no Exterior',
    tax_regime_preference: 'Preferência de Regime Tributário',
    business_description: 'Descrição do Negócio',
    tax_questions: 'Dúvidas Sobre Impostos',
    contador_status: 'Situação com Contador'
  }

  // Ícones por tipo de pergunta
  const questionIcons: Record<string, string> = {
    person_type: '👤',
    cnpj: '🏢',
    cpf: '📄',
    cnae: '📋',
    business_model: '💼',
    country: '🌍',
    revenue_source: '💰',
    payment_methods: '💳',
    revenue_range: '💵',
    has_partners: '👥',
    partner_count: '👥',
    partner_distribution: '📊',
    employee_type: '👷',
    employee_count: '👷',
    nfe_frequency: '📃',
    receives_foreign_invoices: '🌐',
    physical_activities: '🏢',
    expenses: '💸',
    pays_foreign_taxes: '🌎',
    tax_regime_preference: '📑',
    business_description: '📝',
    tax_questions: '❓',
    contador_status: '🧮'
  }

  // Processar cada resposta
  Object.entries(responses).forEach(([key, value]) => {
    if (!value || value === '') return

    const question = questionLabels[key] || key
    const icon = questionIcons[key] || '•'
    let answer = ''

    // Valores booleanos
    if (value === 'yes' || value === true || value === 'yes_1' || value === 'yes_2_to_5') {
      answer = 'Sim'
      if (value === 'yes_1') answer = 'Sim (1 sócio)'
      if (value === 'yes_2_to_5') answer = 'Sim (2 a 5 sócios)'
    } else if (value === 'no' || value === false) {
      answer = 'Não'
    }
    // Valores que são listas (separados por vírgula ou array)
    else if (Array.isArray(value) || (typeof value === 'string' && value.includes(','))) {
      const items = Array.isArray(value) ? value : value.split(',')
      const translationMap = translations[key] || {}
      const translatedItems = items.map((item: string) =>
        translationMap[item.trim()] || item.trim()
      )
      answer = translatedItems.join(', ')
    }
    // Valores numéricos
    else if (!isNaN(Number(value)) && key !== 'cnpj' && key !== 'cpf' && key !== 'cnae') {
      answer = value.toString()
      if (key === 'employee_count' || key === 'partner_count') {
        answer += key === 'employee_count' ? ' funcionário(s)' : ' sócio(s)'
      }
    }
    // Valores com tradução disponível
    else if (translations[key] && translations[key][value]) {
      answer = translations[key][value]
    }
    // Texto livre (descrições, CNPJ, CPF, CNAE)
    else {
      answer = value.toString()
    }

    if (answer) {
      humanized.push({ question, answer, icon })
    }
  })

  return humanized
}

/**
 * Formata CNPJ: 12345678000100 → 12.345.678/0001-00
 */
export function formatCNPJ(cnpj: string): string {
  const cleaned = cnpj.replace(/\D/g, '')
  if (cleaned.length !== 14) return cnpj
  return cleaned.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
}

/**
 * Formata CPF: 12345678900 → 123.456.789-00
 */
export function formatCPF(cpf: string): string {
  const cleaned = cpf.replace(/\D/g, '')
  if (cleaned.length !== 11) return cpf
  return cleaned.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4')
}

/**
 * Formata valores monetários
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}
