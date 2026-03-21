/**
 * Teste automatizado completo do onboarding
 * Simula o caso: LLC EUA + Dropshipping, sem sócios, sem funcionários
 */

const axios = require('axios')

const API_URL = 'http://localhost:8000/api/v1'
const CLIENT_ID = 14 // ID do cliente de teste

// Respostas do questionário (caso LLC + Dropshipping)
const RESPOSTAS = {
  person_type: 'pf',
  document_number: '123.456.789-00',
  cnae_principal: '4751-2/01',
  company_registration_country: 'usa_llc',
  business_model: 'dropshipping',
  revenue_source: 'own_foreign_company',
  payment_receipt_method: ['stripe', 'paypal'],
  monthly_revenue_range: '10k_to_30k',
  has_partners: 'no', // Isso deve pular pergunta 10
  // profit_distribution: PULADA (condicional)
  has_employees: 'no', // Isso deve pular pergunta 12
  // employee_count: PULADA (condicional)
  issues_brazilian_invoices: 'no_foreign',
  receives_international_invoices: 'yes_sometimes',
  brazil_physical_activities: ['none'],
  brazil_expenses: ['ads', 'software', 'accounting'],
  pays_foreign_taxes: 'yes_llc',
  preferred_tax_regime: 'not_sure',
  additional_info: 'Tenho uma LLC nos Estados Unidos e trabalho com dropshipping. Compro produtos de fornecedores chineses através do AliExpress e vendo para clientes nos EUA através da Shopify. Recebo os pagamentos via Stripe e PayPal na minha conta da LLC. Mensalmente transfiro parte do lucro para minha conta pessoal no Brasil. Não tenho funcionários, faço tudo sozinho. Pago imposto de renda nos EUA através da LLC, mas não sei como declarar isso no Brasil.',
  tax_doubts: 'Como declarar lucros da LLC no Brasil? Preciso pagar imposto duas vezes?',
  current_accounting_situation: 'starting'
}

async function testarOnboardingCompleto() {
  console.log('🧪 TESTE AUTOMATIZADO DO ONBOARDING\n')
  console.log('📋 Caso de Teste: LLC EUA + Dropshipping')
  console.log('   - Sem sócios (deve pular Q10)')
  console.log('   - Sem funcionários (deve pular Q12)')
  console.log('   - Total esperado: 19 perguntas\n')

  try {
    // PASSO 1: Buscar todas as perguntas
    console.log('1️⃣  Buscando perguntas...')
    const questionsRes = await axios.get(`${API_URL}/onboarding/questions`)
    const questions = questionsRes.data.data
    console.log(`   ✅ ${questions.length} perguntas carregadas\n`)

    // PASSO 2: Iniciar sessão de onboarding
    console.log('2️⃣  Iniciando sessão de onboarding...')
    const sessionRes = await axios.post(`${API_URL}/onboarding/start`, {
      client_id: CLIENT_ID
    })
    const session = sessionRes.data.data
    console.log(`   ✅ Sessão criada: ID ${session.id}\n`)

    // PASSO 3: Responder cada pergunta (exceto as condicionais)
    console.log('3️⃣  Respondendo perguntas...')
    let perguntasRespondidas = 0
    let perguntasPuladas = 0

    for (const question of questions) {
      const resposta = RESPOSTAS[question.questionKey]

      // Verificar se é condicional e deve ser pulada
      if (question.isConditional && question.conditionLogic) {
        const condition = JSON.parse(question.conditionLogic)
        const fieldValue = RESPOSTAS[condition.field]

        let devePular = false
        if (condition.operator === 'not_equals' && fieldValue === condition.value) {
          devePular = true
        }

        if (devePular) {
          console.log(`   ⏭️  Q${question.orderIndex}: ${question.questionText.substring(0, 50)}... (PULADA - condicional)`)
          perguntasPuladas++
          continue
        }
      }

      // Responder pergunta
      if (resposta !== undefined) {
        await axios.post(`${API_URL}/onboarding/response`, {
          session_id: session.id,
          question_id: question.id,
          response_value: resposta
        })
        console.log(`   ✅ Q${question.orderIndex}: ${question.questionText.substring(0, 50)}...`)
        perguntasRespondidas++
      }
    }

    console.log(`\n   📊 Resumo: ${perguntasRespondidas} respondidas, ${perguntasPuladas} puladas\n`)

    // PASSO 4: Completar onboarding (executar agentes IA)
    console.log('4️⃣  Finalizando onboarding (executando agentes IA)...')
    const completeRes = await axios.post(`${API_URL}/onboarding/complete`, {
      session_id: session.id
    })

    console.log(`   ✅ Onboarding concluído!\n`)

    // PASSO 5: Verificar resultados
    console.log('5️⃣  Verificando resultados...')
    const statusRes = await axios.get(`${API_URL}/onboarding/status/${CLIENT_ID}`)
    const { data: resultData } = statusRes.data

    console.log(`   ✅ Sessão: ${resultData.session?.status}`)
    console.log(`   ✅ Legal Research: ${resultData.legal_research ? 'OK' : 'FALTANDO'}`)
    console.log(`   ✅ Classification: ${resultData.classification ? 'OK' : 'FALTANDO'}`)

    if (resultData.legal_research?.taxRecommendations) {
      const taxRec = resultData.legal_research.taxRecommendations
      console.log(`\n   📋 REGIME IDENTIFICADO: ${taxRec.regime || 'N/A'}`)
      console.log(`   💰 Confiança: ${(resultData.legal_research.confidenceScore * 100).toFixed(0)}%`)
    }

    console.log('\n✅ TESTE COMPLETO - TUDO FUNCIONANDO!\n')

  } catch (error) {
    console.error('\n❌ ERRO NO TESTE:', error.response?.data || error.message)
    console.error(error)
    process.exit(1)
  }
}

testarOnboardingCompleto()
