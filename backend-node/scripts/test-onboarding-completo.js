/**
 * Script para testar o sistema de onboarding completo
 * Simula o caso do usuário: LLC nos EUA + Dropshipping
 */

const axios = require('axios')

const API_URL = 'http://localhost:8000/api/v1'
const CLIENT_ID = 14 // ID do cliente de teste

// Respostas simulando o caso: LLC EUA + Dropshipping
const RESPOSTAS_LLC_USA = {
  person_type: 'pf',
  business_model: 'dropshipping',
  company_country: 'usa',
  operation_countries: ['usa', 'international'],
  revenue_source: 'foreign_company',
  payment_methods: ['wire_transfer'],
  brazil_activities: ['ads_marketing'],
  has_employees: false,
  employee_count: 0,
  issues_invoices: false,
  foreign_taxes: true,
  has_partners: false,
  partner_count: 0,
  monthly_revenue_range: '10000_50000',
  annual_revenue_range: '100000_500000',
  business_description: 'Dropshipping com LLC registrada nos EUA. Recebo pagamentos direto da LLC. No Brasil, apenas pago anúncios com cartão corporativo.',
  additional_info: 'Meu contador atual declara 3% sobre o lucro, mas não tenho certeza se está correto.',
  tax_doubts: 'Qual é o regime tributário correto para esse caso? A alíquota de 3% está correta?'
}

async function testarOnboardingCompleto() {
  console.log('🧪 TESTE COMPLETO DO SISTEMA DE ONBOARDING')
  console.log('=' .repeat(60))
  console.log(`Cliente ID: ${CLIENT_ID}`)
  console.log(`Cenário: LLC EUA + Dropshipping (Caso do Usuário)`)
  console.log('=' .repeat(60))
  console.log('')

  try {
    // PASSO 1: Iniciar sessão de onboarding
    console.log('📋 PASSO 1: Iniciando sessão de onboarding...')
    const startResponse = await axios.post(`${API_URL}/onboarding/start`, {
      client_id: CLIENT_ID
    })
    const session = startResponse.data.data
    console.log(`✅ Sessão criada: ID ${session.id}`)
    console.log(`   Status: ${session.status}`)
    console.log(`   Total de perguntas: ${session.totalSteps}`)
    console.log('')

    // PASSO 2: Buscar perguntas
    console.log('❓ PASSO 2: Buscando perguntas...')
    const questionsResponse = await axios.get(`${API_URL}/onboarding/questions`)
    const questions = questionsResponse.data.data
    console.log(`✅ ${questions.length} perguntas carregadas`)
    console.log('')

    // PASSO 3: Responder todas as perguntas
    console.log('✍️  PASSO 3: Respondendo perguntas...')
    for (const question of questions) {
      const answer = RESPOSTAS_LLC_USA[question.questionKey]

      if (answer !== undefined) {
        await axios.post(`${API_URL}/onboarding/response`, {
          session_id: session.id,
          question_id: question.id,
          response_value: answer
        })
        console.log(`   ✓ ${question.questionKey}: ${JSON.stringify(answer)}`)
      }
    }
    console.log('✅ Todas as respostas salvas')
    console.log('')

    // PASSO 4: Completar onboarding (executar agentes de IA)
    console.log('🤖 PASSO 4: Executando agentes de IA...')
    console.log('   Isso pode levar alguns segundos...')
    console.log('')

    const completeResponse = await axios.post(`${API_URL}/onboarding/complete`, {
      session_id: session.id
    })

    const result = completeResponse.data

    console.log('✅ ANÁLISE CONCLUÍDA!')
    console.log('=' .repeat(60))
    console.log('')

    // RESULTADOS: Análise do Onboarding Agent
    console.log('📊 ANÁLISE DO AGENTE DE ONBOARDING:')
    console.log('-' .repeat(60))
    console.log(`Tipo de Pessoa: ${result.analysis.person_type}`)
    console.log(`Modelo de Negócio: ${result.analysis.business_model}`)
    console.log(`País da Empresa: ${result.analysis.company_country}`)
    console.log(`Empresa Estrangeira: ${result.analysis.is_foreign_company ? 'SIM' : 'NÃO'}`)
    console.log(`Recebe do Exterior: ${result.analysis.receives_from_abroad ? 'SIM' : 'NÃO'}`)
    console.log('')

    // RESULTADOS: Pesquisa Legal
    const taxRec = result.legal_research.tax_recommendations
    console.log('⚖️  RESULTADO DA PESQUISA LEGAL:')
    console.log('-' .repeat(60))
    console.log(`🎯 REGIME: ${taxRec.regime}`)
    console.log(`📌 SUB-REGIME: ${taxRec.sub_regime}`)
    console.log(`💡 RAZÃO: ${taxRec.reason}`)
    console.log('')

    // Obrigações Mensais
    console.log('📅 OBRIGAÇÕES MENSAIS:')
    taxRec.monthly_obligations.forEach(obl => {
      console.log(`   • ${obl.name}`)
      console.log(`     Prazo: ${obl.deadline}`)
      console.log(`     Base: ${obl.base_calculation}`)
      console.log(`     Alíquota: ${obl.aliquot}`)
    })
    console.log('')

    // Obrigações Anuais
    console.log('📅 OBRIGAÇÕES ANUAIS:')
    taxRec.annual_obligations.forEach(obl => {
      console.log(`   • ${obl.name}`)
      console.log(`     Prazo: ${obl.deadline}`)
    })
    console.log('')

    // ERROS COMUNS (VALIDAR SE IDENTIFICA O 3%)
    console.log('⚠️  ERROS COMUNS A EVITAR:')
    console.log('-' .repeat(60))
    taxRec.common_mistakes.forEach((mistake, index) => {
      console.log(`${index + 1}. ❌ ERRO: ${mistake.mistake}`)
      console.log(`   Por que está errado: ${mistake.why_wrong}`)
      console.log(`   ✅ CORRETO: ${mistake.correct}`)
      console.log('')
    })

    // Conselho Profissional
    console.log('💼 ORIENTAÇÃO PROFISSIONAL:')
    console.log('-' .repeat(60))
    console.log(taxRec.professional_advice)
    console.log('')

    // Leis Aplicáveis
    console.log('📚 LEIS E NORMAS APLICÁVEIS:')
    console.log('-' .repeat(60))
    result.legal_research.applicable_laws.forEach(law => {
      console.log(`• ${law.law}`)
      console.log(`  ${law.article}`)
      console.log(`  ${law.summary}`)
      console.log('')
    })

    // Confiança
    console.log('🎯 NÍVEL DE CONFIANÇA DA ANÁLISE:')
    console.log('-' .repeat(60))
    const confidence = (result.legal_research.confidence_score * 100).toFixed(0)
    console.log(`${confidence}% - ${result.legal_research.confidence_score >= 0.9 ? 'ALTA CONFIANÇA' : 'MÉDIA CONFIANÇA'}`)
    console.log('')

    // Classificação Fiscal
    console.log('🏷️  CLASSIFICAÇÃO FISCAL:')
    console.log('-' .repeat(60))
    const config = result.classification.custom_config
    console.log('Documentos Necessários:')
    config.document_types_required.forEach(doc => {
      console.log(`   • ${doc}`)
    })
    console.log('')

    console.log('Configuração de Cálculo de Impostos:')
    console.log(`   Regime: ${config.tax_calculation_config.regime}`)
    console.log(`   Base: ${config.tax_calculation_config.base}`)
    console.log(`   Pagamento Mensal: ${config.tax_calculation_config.monthly_payment ? 'SIM' : 'NÃO'}`)
    console.log(`   Crédito de Imposto Estrangeiro: ${config.tax_calculation_config.foreign_tax_credit ? 'SIM' : 'NÃO'}`)
    console.log('')

    // VALIDAÇÃO CRÍTICA
    console.log('=' .repeat(60))
    console.log('🔍 VALIDAÇÃO CRÍTICA DO TESTE:')
    console.log('=' .repeat(60))

    const validacoes = []

    // Validar regime correto
    if (taxRec.regime === 'PESSOA_FISICA' && taxRec.sub_regime === 'CARNE_LEAO') {
      console.log('✅ Regime identificado corretamente: Pessoa Física + Carnê-Leão')
      validacoes.push(true)
    } else {
      console.log('❌ ERRO: Regime incorreto!')
      validacoes.push(false)
    }

    // Validar que identificou erro do 3%
    const encontrouErro3Porcento = taxRec.common_mistakes.some(m =>
      m.mistake.toLowerCase().includes('3%') ||
      m.mistake.toLowerCase().includes('lucro presumido')
    )

    if (encontrouErro3Porcento) {
      console.log('✅ Sistema identificou que 3% é INCORRETO')
      validacoes.push(true)
    } else {
      console.log('❌ ERRO: Sistema não identificou problema do 3%')
      validacoes.push(false)
    }

    // Validar alíquota progressiva
    const mencionaProgressiva = taxRec.monthly_obligations.some(obl =>
      obl.aliquot.toLowerCase().includes('progressiva') ||
      obl.aliquot.toLowerCase().includes('27,5') ||
      obl.aliquot.toLowerCase().includes('27.5')
    )

    if (mencionaProgressiva) {
      console.log('✅ Alíquota progressiva (0% a 27,5%) identificada')
      validacoes.push(true)
    } else {
      console.log('❌ ERRO: Alíquota progressiva não identificada')
      validacoes.push(false)
    }

    console.log('')
    console.log('=' .repeat(60))

    const todosPassaram = validacoes.every(v => v === true)
    if (todosPassaram) {
      console.log('🎉 TESTE PASSOU COM SUCESSO!')
      console.log('✅ O sistema identificou corretamente o caso do usuário')
      console.log('✅ Indicou que 3% está ERRADO')
      console.log('✅ Recomendou Carnê-Leão com alíquota progressiva')
    } else {
      console.log('❌ TESTE FALHOU!')
      console.log('Algumas validações não passaram.')
    }

    console.log('=' .repeat(60))

  } catch (error) {
    console.error('❌ ERRO NO TESTE:', error.response?.data || error.message)
    if (error.response?.data) {
      console.error('Detalhes:', JSON.stringify(error.response.data, null, 2))
    }
  }
}

// Executar teste
testarOnboardingCompleto()
