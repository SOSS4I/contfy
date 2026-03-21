/**
 * Teste da página de resultados
 * Verifica se todos os dados necessários estão presentes
 */

const axios = require('axios')

const API_URL = 'http://localhost:8000/api/v1'
const CLIENT_ID = 14

async function testarPaginaResultados() {
  console.log('🧪 TESTE DA PÁGINA DE RESULTADOS\n')

  try {
    console.log('1️⃣  Buscando status do onboarding...')
    const response = await axios.get(`${API_URL}/onboarding/status/${CLIENT_ID}`)

    console.log(`   ✅ Status: ${response.status}\n`)

    const { data } = response.data

    // Verificar estrutura da resposta
    console.log('2️⃣  Verificando estrutura da resposta...')

    const checks = {
      'data existe': !!data,
      'data.session existe': !!data?.session,
      'data.legal_research existe': !!data?.legal_research,
      'data.classification existe': !!data?.classification,
      'session.status = COMPLETED': data?.session?.status === 'COMPLETED',
      'legal_research.taxRecommendations existe': !!data?.legal_research?.taxRecommendations,
      'legal_research.applicableLaws existe': !!data?.legal_research?.applicableLaws,
      'legal_research.confidenceScore existe': data?.legal_research?.confidenceScore !== undefined,
      'classification.classificationData existe': !!data?.classification?.classificationData,
    }

    let allPassed = true
    for (const [check, passed] of Object.entries(checks)) {
      if (passed) {
        console.log(`   ✅ ${check}`)
      } else {
        console.log(`   ❌ ${check}`)
        allPassed = false
      }
    }

    if (!allPassed) {
      console.log('\n❌ ALGUNS CHECKS FALHARAM!\n')
      console.log('Estrutura recebida:')
      console.log(JSON.stringify(data, null, 2))
      process.exit(1)
    }

    // Exibir dados principais
    console.log('\n3️⃣  Dados principais:')
    console.log(`   📋 Regime: ${data.legal_research.taxRecommendations.regime || 'N/A'}`)
    console.log(`   💰 Confiança: ${(data.legal_research.confidenceScore * 100).toFixed(0)}%`)
    console.log(`   📜 Leis aplicáveis: ${data.legal_research.applicableLaws.length}`)

    if (data.legal_research.taxRecommendations.monthly_obligations) {
      console.log(`   📅 Obrigações mensais: ${data.legal_research.taxRecommendations.monthly_obligations.length}`)
    }

    if (data.legal_research.taxRecommendations.annual_obligations) {
      console.log(`   📆 Obrigações anuais: ${data.legal_research.taxRecommendations.annual_obligations.length}`)
    }

    console.log('\n✅ PÁGINA DE RESULTADOS VAI FUNCIONAR PERFEITAMENTE!\n')

  } catch (error) {
    console.error('\n❌ ERRO:', error.response?.data || error.message)
    process.exit(1)
  }
}

testarPaginaResultados()
