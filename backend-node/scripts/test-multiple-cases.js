/**
 * Teste de múltiplos casos para validar classificação fiscal da IA
 * Objetivo: Ver quantos casos a IA consegue resolver sozinha vs precisam de contador
 */

const axios = require('axios')

const API_URL = 'http://localhost:8000/api/v1'

// Múltiplos casos de teste
const CASOS_TESTE = [
  {
    nome: 'MEI Simples - Autônomo',
    clientId: 21,
    respostas: {
      person_type: 'mei',
      document_number: '12.345.678/0001-90',
      cnae_principal: '6201-5/00',
      company_registration_country: 'brazil',
      business_model: 'freelancer',
      revenue_source: 'brazilian_customers_cpf',
      payment_receipt_method: ['pix', 'bank_transfer_brazil'],
      monthly_revenue_range: 'up_to_3k',
      has_partners: 'no',
      has_employees: 'no',
      issues_brazilian_invoices: 'yes_always',
      receives_international_invoices: 'no',
      brazil_physical_activities: ['office'],
      brazil_expenses: ['software', 'accounting'],
      pays_foreign_taxes: 'no',
      preferred_tax_regime: 'mei',
      additional_info: 'Sou desenvolvedor freelancer, faço sites para pequenas empresas. Trabalho de casa, sem funcionários.',
      tax_doubts: '',
      current_accounting_situation: 'starting'
    },
    expectativa: 'MEI ou Simples Nacional (deve ser automático)'
  },

  {
    nome: 'PJ Simples Nacional - E-commerce',
    clientId: 22,
    respostas: {
      person_type: 'pj',
      document_number: '23.456.789/0001-01',
      cnae_principal: '4751-2/01',
      company_registration_country: 'brazil',
      business_model: 'ecommerce',
      revenue_source: 'marketplace_brazil',
      payment_receipt_method: ['pix', 'credit_card'],
      monthly_revenue_range: '30k_to_81k',
      has_partners: 'yes_1',
      profit_distribution: 'equal',
      has_employees: 'clt',
      employee_count: 2,
      issues_brazilian_invoices: 'yes_always',
      receives_international_invoices: 'no',
      brazil_physical_activities: ['warehouse', 'shipping'],
      brazil_expenses: ['ads', 'rent', 'salaries', 'products'],
      pays_foreign_taxes: 'no',
      preferred_tax_regime: 'simples_nacional',
      additional_info: 'Loja virtual de roupas. Vendo pelo Mercado Livre e Instagram. Tenho estoque próprio e 2 funcionários CLT.',
      tax_doubts: '',
      current_accounting_situation: 'has_contador'
    },
    expectativa: 'Simples Nacional (deve ser automático)'
  },

  {
    nome: 'LLC EUA + Dropshipping (caso complexo)',
    clientId: 20,
    respostas: {
      person_type: 'pf',
      document_number: '987.654.321-00',
      cnae_principal: '4751-2/01',
      company_registration_country: 'usa_llc',
      business_model: 'dropshipping',
      revenue_source: 'own_foreign_company',
      payment_receipt_method: ['stripe', 'paypal', 'wise'],
      monthly_revenue_range: '10k_to_30k',
      has_partners: 'no',
      has_employees: 'no',
      issues_brazilian_invoices: 'no_foreign',
      receives_international_invoices: 'yes_sometimes',
      brazil_physical_activities: ['none'],
      brazil_expenses: ['ads', 'software'],
      pays_foreign_taxes: 'yes_llc',
      preferred_tax_regime: 'not_sure',
      additional_info: 'Tenho LLC nos EUA, vendo produtos via dropshipping para americanos. Recebo via Stripe e transfiro lucros para o Brasil mensalmente. Pago impostos nos EUA.',
      tax_doubts: 'Como declarar lucros da LLC? Carnê-Leão?',
      current_accounting_situation: 'starting'
    },
    expectativa: 'Carnê-Leão PF (pode precisar de contador para casos internacionais)'
  },

  {
    nome: 'Trader/Investidor',
    clientId: 14,
    respostas: {
      person_type: 'pf',
      document_number: '111.222.333-44',
      cnae_principal: '6619-3/99',
      company_registration_country: 'not_registered',
      business_model: 'trader',
      revenue_source: 'investments',
      payment_receipt_method: ['bank_transfer_brazil'],
      monthly_revenue_range: '3k_to_10k',
      has_partners: 'no',
      has_employees: 'no',
      issues_brazilian_invoices: 'no_not_required',
      receives_international_invoices: 'no',
      brazil_physical_activities: ['none'],
      brazil_expenses: ['software'],
      pays_foreign_taxes: 'no',
      preferred_tax_regime: 'not_sure',
      additional_info: 'Faço day trade e swing trade de ações na B3. Ganho com dividendos e venda de ações.',
      tax_doubts: 'Como pagar imposto sobre day trade?',
      current_accounting_situation: 'none'
    },
    expectativa: 'PF com DARF mensal (deve ser automático)'
  },

  {
    nome: 'SaaS com faturamento alto',
    clientId: 15,
    respostas: {
      person_type: 'pj',
      document_number: '34.567.890/0001-12',
      cnae_principal: '6201-5/00',
      company_registration_country: 'brazil',
      business_model: 'saas',
      revenue_source: 'brazilian_customers_cnpj',
      payment_receipt_method: ['credit_card', 'boleto'],
      monthly_revenue_range: '200k_to_500k',
      has_partners: 'yes_2',
      profit_distribution: 'unequal',
      has_employees: 'mixed',
      employee_count: 15,
      issues_brazilian_invoices: 'yes_always',
      receives_international_invoices: 'no',
      brazil_physical_activities: ['office'],
      brazil_expenses: ['ads', 'software', 'rent', 'salaries'],
      pays_foreign_taxes: 'no',
      preferred_tax_regime: 'cheapest',
      additional_info: 'SaaS de gestão empresarial. Faturamento alto, acima do limite do Simples. 15 funcionários, escritório alugado.',
      tax_doubts: 'Lucro Presumido ou Lucro Real?',
      current_accounting_situation: 'has_contador'
    },
    expectativa: 'Lucro Presumido ou Real (pode precisar de análise)'
  },

  {
    nome: 'Afiliado Digital',
    clientId: 23,
    respostas: {
      person_type: 'pf',
      document_number: '555.666.777-88',
      cnae_principal: '7319-0/99',
      company_registration_country: 'not_registered',
      business_model: 'affiliate_marketing',
      revenue_source: 'platform_payments',
      payment_receipt_method: ['paypal', 'pix'],
      monthly_revenue_range: '10k_to_30k',
      has_partners: 'no',
      has_employees: 'no',
      issues_brazilian_invoices: 'no_informal',
      receives_international_invoices: 'no',
      brazil_physical_activities: ['none'],
      brazil_expenses: ['ads', 'software'],
      pays_foreign_taxes: 'no',
      preferred_tax_regime: 'not_sure',
      additional_info: 'Trabalho com marketing de afiliados. Recebo comissões de plataformas como Hotmart, Eduzz. Tudo informal ainda.',
      tax_doubts: 'Preciso abrir CNPJ?',
      current_accounting_situation: 'informal'
    },
    expectativa: 'PF Carnê-Leão ou abrir MEI (deve ser automático)'
  },

  {
    nome: 'Cripto Trader Internacional (muito complexo)',
    clientId: 24,
    respostas: {
      person_type: 'pf',
      document_number: '999.888.777-66',
      cnae_principal: '',
      company_registration_country: 'not_registered',
      business_model: 'trader',
      revenue_source: 'foreign_companies',
      payment_receipt_method: ['crypto', 'wise'],
      monthly_revenue_range: '81k_to_200k',
      has_partners: 'no',
      has_employees: 'no',
      issues_brazilian_invoices: 'no_not_required',
      receives_international_invoices: 'no',
      brazil_physical_activities: ['none'],
      brazil_expenses: ['none'],
      pays_foreign_taxes: 'not_sure',
      preferred_tax_regime: 'not_sure',
      additional_info: 'Faço trading de criptomoedas em exchanges internacionais (Binance, Coinbase). Recebo em stablecoins e converto para real. Operações grandes, acima de 100k/mês.',
      tax_doubts: 'Como declarar cripto? Tenho que pagar imposto?',
      current_accounting_situation: 'informal'
    },
    expectativa: 'MUITO COMPLEXO - deve pedir contador (cripto + internacional + alto volume)'
  }
]

async function limparSessoes() {
  const { PrismaClient } = require('@prisma/client')
  const prisma = new PrismaClient()

  console.log('🗑️  Limpando sessões antigas...\n')

  await prisma.fiscalClassification.deleteMany({})
  await prisma.legalResearchResult.deleteMany({})
  await prisma.onboardingResponse.deleteMany({})
  await prisma.onboardingSession.deleteMany({})

  await prisma.$disconnect()
  console.log('✅ Banco limpo\n')
}

async function testarCaso(caso, index) {
  console.log(`\n${'='.repeat(80)}`)
  console.log(`CASO ${index + 1}: ${caso.nome}`)
  console.log(`Expectativa: ${caso.expectativa}`)
  console.log('='.repeat(80))

  try {
    // 1. Buscar perguntas
    const questionsRes = await axios.get(`${API_URL}/onboarding/questions`)
    const questions = questionsRes.data.data

    // 2. Criar sessão
    const sessionRes = await axios.post(`${API_URL}/onboarding/start`, {
      client_id: caso.clientId
    })
    const session = sessionRes.data.data

    // 3. Responder perguntas
    for (const question of questions) {
      const resposta = caso.respostas[question.questionKey]

      if (resposta !== undefined) {
        await axios.post(`${API_URL}/onboarding/response`, {
          session_id: session.id,
          question_id: question.id,
          response_value: resposta
        })
      }
    }

    // 4. Completar onboarding
    console.log('\n⏳ Executando agentes IA...')
    const completeRes = await axios.post(`${API_URL}/onboarding/complete`, {
      session_id: session.id
    })

    // 5. Buscar resultados
    const statusRes = await axios.get(`${API_URL}/onboarding/status/${caso.clientId}`)
    const { data } = statusRes.data

    // 6. Analisar resultado
    const regime = data.legal_research?.taxRecommendations?.regime
    const confianca = data.legal_research?.confidenceScore || 0
    const precisaContador = regime === 'CONSULTAR_CONTADOR'

    console.log(`\n📊 RESULTADO:`)
    console.log(`   Regime: ${regime || 'N/A'}`)
    console.log(`   Confiança: ${(confianca * 100).toFixed(0)}%`)
    console.log(`   Precisa contador: ${precisaContador ? '🔴 SIM' : '🟢 NÃO'}`)

    if (data.legal_research?.taxRecommendations?.reason) {
      console.log(`   Motivo: ${data.legal_research.taxRecommendations.reason}`)
    }

    return {
      nome: caso.nome,
      regime,
      confianca,
      precisaContador,
      expectativa: caso.expectativa
    }

  } catch (error) {
    console.error(`\n❌ ERRO: ${error.response?.data?.error || error.message}`)
    return {
      nome: caso.nome,
      regime: 'ERRO',
      confianca: 0,
      precisaContador: true,
      erro: error.message
    }
  }
}

async function testarTodosCasos() {
  console.log('🧪 TESTE DE MÚLTIPLOS CASOS DE ONBOARDING\n')
  console.log(`Total de casos: ${CASOS_TESTE.length}\n`)

  await limparSessoes()

  const resultados = []

  for (let i = 0; i < CASOS_TESTE.length; i++) {
    const resultado = await testarCaso(CASOS_TESTE[i], i)
    resultados.push(resultado)

    // Aguardar 2 segundos entre casos
    if (i < CASOS_TESTE.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
  }

  // Resumo final
  console.log(`\n\n${'='.repeat(80)}`)
  console.log('📊 RESUMO FINAL')
  console.log('='.repeat(80))

  const automaticos = resultados.filter(r => !r.precisaContador && r.regime !== 'ERRO')
  const precisamContador = resultados.filter(r => r.precisaContador && r.regime !== 'ERRO')
  const erros = resultados.filter(r => r.regime === 'ERRO')

  console.log(`\n🟢 Automáticos (IA resolveu sozinha): ${automaticos.length}/${CASOS_TESTE.length}`)
  automaticos.forEach(r => {
    console.log(`   - ${r.nome}: ${r.regime} (${(r.confianca * 100).toFixed(0)}%)`)
  })

  console.log(`\n🔴 Precisam de Contador: ${precisamContador.length}/${CASOS_TESTE.length}`)
  precisamContador.forEach(r => {
    console.log(`   - ${r.nome}: ${r.regime} (${(r.confianca * 100).toFixed(0)}%)`)
  })

  if (erros.length > 0) {
    console.log(`\n❌ Erros: ${erros.length}/${CASOS_TESTE.length}`)
    erros.forEach(r => {
      console.log(`   - ${r.nome}: ${r.erro}`)
    })
  }

  console.log(`\n📈 Taxa de automação: ${((automaticos.length / CASOS_TESTE.length) * 100).toFixed(1)}%`)
  console.log('\n')
}

testarTodosCasos()
