/**
 * Teste de casos de comércio tradicional (físico)
 * Sorveteria, supermercado, vendinha, etc.
 */

const axios = require('axios')

const API_URL = 'http://localhost:8000/api/v1'

const CASOS_COMERCIO = [
  {
    nome: 'Sorveteria com funcionários',
    clientId: 6,
    respostas: {
      person_type: 'pj',
      document_number: '12.345.678/0001-01',
      cnae_principal: '5611-2/03', // Sorveteria
      company_registration_country: 'brazil',
      business_model: 'retail',
      revenue_source: 'brazilian_customers_cpf',
      payment_receipt_method: ['cash', 'credit_card', 'pix'],
      monthly_revenue_range: '10k_to_30k',
      has_partners: 'yes_1',
      profit_distribution: 'equal',
      has_employees: 'clt',
      employee_count: 3,
      issues_brazilian_invoices: 'yes_always',
      receives_international_invoices: 'no',
      brazil_physical_activities: ['retail_store'],
      brazil_expenses: ['rent', 'products', 'salaries', 'utilities'],
      pays_foreign_taxes: 'no',
      preferred_tax_regime: 'cheapest',
      additional_info: 'Sorveteria física com 3 funcionários CLT. Vendemos sorvetes e açaí. Loja alugada no centro da cidade.',
      tax_doubts: 'Qual o melhor regime para comércio?',
      current_accounting_situation: 'starting'
    },
    expectativa: 'Simples Nacional Anexo I (comércio)'
  },

  {
    nome: 'Supermercado pequeno',
    clientId: 7,
    respostas: {
      person_type: 'pj',
      document_number: '23.456.789/0001-02',
      cnae_principal: '4712-1/00', // Minimercado
      company_registration_country: 'brazil',
      business_model: 'retail',
      revenue_source: 'brazilian_customers_cpf',
      payment_receipt_method: ['cash', 'credit_card', 'debit_card', 'pix'],
      monthly_revenue_range: '30k_to_81k',
      has_partners: 'yes_2',
      profit_distribution: 'unequal',
      has_employees: 'mixed',
      employee_count: 8,
      issues_brazilian_invoices: 'yes_always',
      receives_international_invoices: 'no',
      brazil_physical_activities: ['retail_store', 'warehouse'],
      brazil_expenses: ['rent', 'products', 'salaries', 'utilities', 'security'],
      pays_foreign_taxes: 'no',
      preferred_tax_regime: 'simples_nacional',
      additional_info: 'Minimercado de bairro. 8 funcionários (6 CLT + 2 PJ). Faturamento de cerca de 50-60k/mês. Temos estoque próprio.',
      tax_doubts: '',
      current_accounting_situation: 'has_contador'
    },
    expectativa: 'Simples Nacional Anexo I'
  },

  {
    nome: 'Vendinha/Mercearia pequena (MEI possível)',
    clientId: 8,
    respostas: {
      person_type: 'mei',
      document_number: '34.567.890/0001-03',
      cnae_principal: '4712-1/00', // Minimercado
      company_registration_country: 'brazil',
      business_model: 'retail',
      revenue_source: 'brazilian_customers_cpf',
      payment_receipt_method: ['cash', 'pix'],
      monthly_revenue_range: 'up_to_3k',
      has_partners: 'no',
      has_employees: 'no',
      issues_brazilian_invoices: 'no_not_required',
      receives_international_invoices: 'no',
      brazil_physical_activities: ['retail_store'],
      brazil_expenses: ['rent', 'products'],
      pays_foreign_taxes: 'no',
      preferred_tax_regime: 'mei',
      additional_info: 'Vendinha pequena, só eu trabalhando. Vendo produtos básicos no bairro. Faturamento baixo.',
      tax_doubts: 'Posso ser MEI?',
      current_accounting_situation: 'informal'
    },
    expectativa: 'MEI (dentro do limite de R$ 81k/ano)'
  },

  {
    nome: 'Padaria média com produção própria',
    clientId: 9,
    respostas: {
      person_type: 'pj',
      document_number: '45.678.901/0001-04',
      cnae_principal: '1091-1/02', // Padaria
      company_registration_country: 'brazil',
      business_model: 'manufacturing_retail',
      revenue_source: 'brazilian_customers_cpf',
      payment_receipt_method: ['cash', 'credit_card', 'pix'],
      monthly_revenue_range: '30k_to_81k',
      has_partners: 'yes_1',
      profit_distribution: 'equal',
      has_employees: 'clt',
      employee_count: 5,
      issues_brazilian_invoices: 'yes_sometimes',
      receives_international_invoices: 'no',
      brazil_physical_activities: ['retail_store', 'manufacturing'],
      brazil_expenses: ['rent', 'products', 'salaries', 'utilities', 'equipment'],
      pays_foreign_taxes: 'no',
      preferred_tax_regime: 'simples_nacional',
      additional_info: 'Padaria com produção própria. Fazemos pães, bolos, salgados. 5 funcionários CLT. Faturamento médio 50k/mês.',
      tax_doubts: 'Produção e venda juntos, qual anexo?',
      current_accounting_situation: 'has_contador'
    },
    expectativa: 'Simples Nacional Anexo I ou II (depende se fabricação > 30%)'
  },

  {
    nome: 'Restaurante pequeno',
    clientId: 10,
    respostas: {
      person_type: 'pj',
      document_number: '56.789.012/0001-05',
      cnae_principal: '5611-2/01', // Restaurante
      company_registration_country: 'brazil',
      business_model: 'food_service',
      revenue_source: 'brazilian_customers_cpf',
      payment_receipt_method: ['cash', 'credit_card', 'pix'],
      monthly_revenue_range: '10k_to_30k',
      has_partners: 'no',
      has_employees: 'mixed',
      employee_count: 4,
      issues_brazilian_invoices: 'yes_sometimes',
      receives_international_invoices: 'no',
      brazil_physical_activities: ['retail_store'],
      brazil_expenses: ['rent', 'products', 'salaries', 'utilities', 'gas'],
      pays_foreign_taxes: 'no',
      preferred_tax_regime: 'simples_nacional',
      additional_info: 'Restaurante familiar. Comida caseira. 4 funcionários (2 CLT + 2 informal ainda). Faturamento 15-20k/mês.',
      tax_doubts: 'Como regularizar funcionários informais?',
      current_accounting_situation: 'starting'
    },
    expectativa: 'Simples Nacional Anexo I'
  },

  {
    nome: 'Loja de roupas',
    clientId: 11,
    respostas: {
      person_type: 'pj',
      document_number: '67.890.123/0001-06',
      cnae_principal: '4781-4/00', // Comércio varejista de artigos do vestuário
      company_registration_country: 'brazil',
      business_model: 'retail',
      revenue_source: 'brazilian_customers_cpf',
      payment_receipt_method: ['cash', 'credit_card', 'pix'],
      monthly_revenue_range: '10k_to_30k',
      has_partners: 'yes_1',
      profit_distribution: 'equal',
      has_employees: 'clt',
      employee_count: 2,
      issues_brazilian_invoices: 'yes_always',
      receives_international_invoices: 'no',
      brazil_physical_activities: ['retail_store'],
      brazil_expenses: ['rent', 'products', 'salaries', 'ads'],
      pays_foreign_taxes: 'no',
      preferred_tax_regime: 'simples_nacional',
      additional_info: 'Loja de roupas femininas. Shopping center. 2 vendedoras CLT. Estoque de fornecedores nacionais.',
      tax_doubts: '',
      current_accounting_situation: 'has_contador'
    },
    expectativa: 'Simples Nacional Anexo I'
  }
]

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
    console.log(`   Motivo: ${data.legal_research?.taxRecommendations?.reason?.substring(0, 200)}...`)

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
  console.log('🏪 TESTE DE COMÉRCIO TRADICIONAL\n')
  console.log(`Total de casos: ${CASOS_COMERCIO.length}\n`)

  const resultados = []

  for (let i = 0; i < CASOS_COMERCIO.length; i++) {
    const resultado = await testarCaso(CASOS_COMERCIO[i], i)
    resultados.push(resultado)

    // Aguardar 2 segundos entre casos
    if (i < CASOS_COMERCIO.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
  }

  // Resumo final
  console.log(`\n\n${'='.repeat(80)}`)
  console.log('📊 RESUMO FINAL - COMÉRCIO TRADICIONAL')
  console.log('='.repeat(80))

  const automaticos = resultados.filter(r => !r.precisaContador && r.regime !== 'ERRO')
  const precisamContador = resultados.filter(r => r.precisaContador && r.regime !== 'ERRO')
  const erros = resultados.filter(r => r.regime === 'ERRO')

  console.log(`\n🟢 Automáticos (IA resolveu): ${automaticos.length}/${CASOS_COMERCIO.length}`)
  automaticos.forEach(r => {
    console.log(`   ✓ ${r.nome}: ${r.regime} (${(r.confianca * 100).toFixed(0)}%)`)
  })

  console.log(`\n🔴 Precisam de Contador: ${precisamContador.length}/${CASOS_COMERCIO.length}`)
  precisamContador.forEach(r => {
    console.log(`   ! ${r.nome}: ${r.regime}`)
  })

  if (erros.length > 0) {
    console.log(`\n❌ Erros: ${erros.length}/${CASOS_COMERCIO.length}`)
    erros.forEach(r => {
      console.log(`   ✗ ${r.nome}: ${r.erro}`)
    })
  }

  console.log(`\n📈 Taxa de automação: ${((automaticos.length / CASOS_COMERCIO.length) * 100).toFixed(1)}%`)
  console.log('\n')
}

testarTodosCasos()
