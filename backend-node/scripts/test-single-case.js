/**
 * Teste simples de um caso para debug
 */

const axios = require('axios')

const API_URL = 'http://localhost:8000/api/v1'

async function testarCasoSimples() {
  console.log('🧪 TESTE SIMPLES - MEI Autônomo\n')

  try {
    // 1. Buscar perguntas
    const questionsRes = await axios.get(`${API_URL}/onboarding/questions`)
    const questions = questionsRes.data.data

    console.log(`✅ ${questions.length} perguntas carregadas\n`)

    // 2. Criar sessão
    const sessionRes = await axios.post(`${API_URL}/onboarding/start`, {
      client_id: 21
    })
    const session = sessionRes.data.data

    console.log(`✅ Sessão ${session.id} criada\n`)

    // 3. Respostas do MEI Autônomo
    const respostas = {
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
    }

    // 4. Responder perguntas
    console.log('📝 Respondendo perguntas...\n')
    for (const question of questions) {
      const resposta = respostas[question.questionKey]

      if (resposta !== undefined) {
        await axios.post(`${API_URL}/onboarding/response`, {
          session_id: session.id,
          question_id: question.id,
          response_value: resposta
        })
        console.log(`  ✓ ${question.questionKey}`)
      }
    }

    // 5. Completar onboarding
    console.log('\n⏳ Executando agentes IA...\n')
    const completeRes = await axios.post(`${API_URL}/onboarding/complete`, {
      session_id: session.id
    })

    const result = completeRes.data

    console.log('\n' + '='.repeat(80))
    console.log('📊 RESULTADO')
    console.log('='.repeat(80))
    console.log('\n🔍 Contexto Fiscal:')
    console.log(`  Tipo: ${result.fiscal_context.person_type.toUpperCase()}`)
    console.log(`  Modelo: ${result.fiscal_context.business_model}`)
    console.log(`  Receita estimada: R$ ${result.fiscal_context.estimated_monthly_revenue_brl.toLocaleString('pt-BR')}`)
    console.log(`  Internacional: ${result.fiscal_context.is_international ? 'SIM' : 'NÃO'}`)
    console.log(`  Complexo: ${result.fiscal_context.has_complex_structure ? 'SIM' : 'NÃO'}`)

    console.log('\n📋 Pesquisa Legal:')
    console.log(`  Regime recomendado: ${result.legal_research.tax_recommendations.regime}`)
    console.log(`  Confiança: ${(result.legal_research.confidence_score * 100).toFixed(0)}%`)
    console.log(`  Motivo: ${result.legal_research.tax_recommendations.reason}`)

    if (result.legal_research.applicable_laws && result.legal_research.applicable_laws.length > 0) {
      console.log(`\n⚖️  Leis aplicáveis:`)
      result.legal_research.applicable_laws.forEach((law, i) => {
        console.log(`  ${i + 1}. ${law.law} - ${law.article}`)
        console.log(`     ${law.summary}`)
      })
    }

    console.log('\n' + '='.repeat(80))

    // 6. Verificar notificação criada
    const { PrismaClient } = require('@prisma/client')
    const prisma = new PrismaClient()

    const notification = await prisma.$queryRawUnsafe(`
      SELECT * FROM admin_notifications
      WHERE client_id = 21
      ORDER BY created_at DESC
      LIMIT 1
    `)

    if (notification && notification.length > 0) {
      console.log('\n📬 Notificação criada:')
      console.log(`  Tipo: ${notification[0].type}`)
      console.log(`  Título: ${notification[0].title}`)
      console.log(`  Mensagem: ${notification[0].message}`)
      console.log(`  Severidade: ${notification[0].severity}`)
    }

    await prisma.$disconnect()

  } catch (error) {
    console.error('\n❌ ERRO:', error.response?.data || error.message)
    if (error.response?.data?.details) {
      console.error('Detalhes:', error.response.data.details)
    }
  }
}

testarCasoSimples()
