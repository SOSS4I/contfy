/**
 * CRON JOB: Monthly Processing Automation
 *
 * Este job roda automaticamente no dia 1 de cada mês às 06:00
 * e inicia o processamento mensal para todos os clientes ativos
 */

import cron from 'node-cron'
import { prisma } from '../../utils/prisma'
import { MonthlyProcessingOrchestrator } from '../monthly-processing-orchestrator'

const orchestrator = new MonthlyProcessingOrchestrator()

/**
 * CRON Schedule: Dia 1 de cada mês às 06:00
 * Format: second minute hour day-of-month month day-of-week
 */
const CRON_SCHEDULE = '0 0 6 1 * *' // 06:00 no dia 1 de cada mês

/**
 * Inicia o processamento mensal automático para todos os clientes
 */
async function runMonthlyProcessing() {
  console.log('\n' + '='.repeat(80))
  console.log('🤖 CRON JOB: Iniciando processamento mensal automático')
  console.log('='.repeat(80) + '\n')

  const today = new Date()
  const referenceMonth = today.getMonth() === 0 ? 12 : today.getMonth() // Mês anterior
  const referenceYear = today.getMonth() === 0 ? today.getFullYear() - 1 : today.getFullYear()

  console.log(`📅 Processando mês ${referenceMonth}/${referenceYear}`)

  try {
    // Buscar todos os clientes que têm configuração contábil aprovada
    const clients = await prisma.clientAccountingConfig.findMany({
      where: {
        status: 'APPROVED' // Apenas clientes aprovados pelo contador
      },
      include: {
        client: true
      }
    })

    console.log(`✅ ${clients.length} clientes encontrados com configuração aprovada\n`)

    let successCount = 0
    let errorCount = 0

    // Processar cada cliente
    for (const config of clients) {
      const clientId = config.clientId
      const clientName = config.client.name || config.client.name

      console.log(`\n📊 Processando cliente: ${clientName} (${clientId})`)

      try {
        // Verificar se já existe um ciclo para este mês
        const existingCycle = await prisma.monthlyAccountingCycle.findFirst({
          where: {
            clientId: clientId,
            referenceMonth: referenceMonth,
            referenceYear: referenceYear
          }
        })

        if (existingCycle) {
          console.log(`   ⏭️  Ciclo já existe (status: ${existingCycle.status}) - pulando`)
          continue
        }

        // Iniciar processamento
        const result = await orchestrator.processMonthlyAccounting(
          clientId,
          referenceMonth,
          referenceYear
        )

        if (result.success) {
          successCount++
          console.log(`   ✅ Processamento iniciado - Cycle ID: ${result.cycle_id}`)
          console.log(`   📧 Email enviado solicitando documentos`)
        } else {
          errorCount++
          console.log(`   ❌ Erro: ${result.error}`)
        }

      } catch (error: any) {
        errorCount++
        console.error(`   ❌ Erro ao processar cliente: ${error.message}`)
      }

      // Aguardar 2 segundos entre cada cliente (evitar sobrecarga)
      await new Promise(resolve => setTimeout(resolve, 2000))
    }

    console.log('\n' + '='.repeat(80))
    console.log('📊 RESUMO DO PROCESSAMENTO')
    console.log('='.repeat(80))
    console.log(`✅ Sucessos: ${successCount}`)
    console.log(`❌ Erros: ${errorCount}`)
    console.log(`📊 Total: ${clients.length}`)
    console.log('='.repeat(80) + '\n')

  } catch (error: any) {
    console.error('❌ ERRO CRÍTICO NO CRON JOB:', error.message)
  }
}

/**
 * Teste manual do processamento (para desenvolvimento)
 */
export async function runManualProcessing() {
  console.log('🧪 Executando processamento manual (modo teste)...\n')
  await runMonthlyProcessing()
}

/**
 * Inicia o CRON job
 */
export function startMonthlyCron() {
  console.log('⏰ CRON configurado para rodar no dia 1 de cada mês às 06:00')
  console.log(`   Schedule: ${CRON_SCHEDULE}`)

  // Agendar o CRON
  cron.schedule(CRON_SCHEDULE, async () => {
    await runMonthlyProcessing()
  }, {
    timezone: 'America/Sao_Paulo'
  })

  console.log('✅ CRON ativo e aguardando próxima execução\n')
}

/**
 * Para desenvolvimento: executar imediatamente
 */
export function runImmediately() {
  console.log('🚀 Executando processamento mensal AGORA (desenvolvimento)\n')
  runMonthlyProcessing()
}
