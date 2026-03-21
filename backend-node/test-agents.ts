/**
 * Script de teste completo para todos os 11 agentes de IA
 *
 * Testa o fluxo completo do processamento mensal:
 * 1. Insere documentos de teste no banco
 * 2. Dispara o processamento continuo (Agents 2-11)
 * 3. Valida os resultados
 */

import { PrismaClient, Prisma } from '@prisma/client'
import { MonthlyProcessingOrchestrator } from './src/services/monthly-processing-orchestrator'
import * as path from 'path'

const prisma = new PrismaClient()

async function main() {
  console.log('\n' + '='.repeat(80))
  console.log('🧪 TESTE COMPLETO DOS 11 AGENTES DE IA')
  console.log('='.repeat(80) + '\n')

  const CYCLE_ID = 1 // Criado pelo teste do Agent 1
  const CLIENT_ID = 14

  try {
    // Verificar se o ciclo existe
    const cycle = await prisma.monthlyAccountingCycle.findUnique({
      where: { id: CYCLE_ID }
    })

    if (!cycle) {
      console.error('❌ Ciclo não encontrado. Execute primeiro: POST /monthly-processing/start')
      return
    }

    console.log(`✅ Ciclo encontrado: ID=${cycle.id}, Status=${cycle.status}`)
    console.log(`   Cliente: ${cycle.clientId}, Período: ${cycle.referenceMonth}/${cycle.referenceYear}`)

    // Limpar dados de teste anteriores
    await prisma.clientNFeData.deleteMany({
      where: { cycle_id: CYCLE_ID, clientId: CLIENT_ID }
    })
    await prisma.clientMonthlyDocument.deleteMany({
      where: { cycle_id: CYCLE_ID, clientId: CLIENT_ID }
    })

    // Resetar status do ciclo
    await prisma.monthlyAccountingCycle.update({
      where: { id: CYCLE_ID },
      data: {
        status: 'PENDING_DOCS',
        processingLog: null,
        tax_calculation: Prisma.JsonNull,
        accounting_entries: Prisma.JsonNull,
        das_pdf_path: null,
        das_value: null,
        monthly_report_data: Prisma.JsonNull,
        error_message: null,
        updatedAt: new Date()
      }
    })

    console.log('\n📄 Inserindo documentos de teste no banco...')

    const uploadsDir = path.join(__dirname, 'uploads', 'documents')

    // NFe Emitida 1
    const doc1 = await prisma.clientMonthlyDocument.create({
      data: {
        cycle_id: CYCLE_ID,
        clientId: CLIENT_ID,
        documentType: 'nfe_emitida',
        fileName: 'test_nfe_emitida_1.xml',
        filePath: path.join(uploadsDir, 'test_nfe_emitida_1.xml'),
        fileSize: 1500
      }
    })
    console.log(`   ✅ Doc 1: NFe Emitida 1 (ID: ${doc1.id})`)

    // NFe Emitida 2
    const doc2 = await prisma.clientMonthlyDocument.create({
      data: {
        cycle_id: CYCLE_ID,
        clientId: CLIENT_ID,
        documentType: 'nfe_emitida',
        fileName: 'test_nfe_emitida_2.xml',
        filePath: path.join(uploadsDir, 'test_nfe_emitida_2.xml'),
        fileSize: 1400
      }
    })
    console.log(`   ✅ Doc 2: NFe Emitida 2 (ID: ${doc2.id})`)

    // NFe Recebida
    const doc3 = await prisma.clientMonthlyDocument.create({
      data: {
        cycle_id: CYCLE_ID,
        clientId: CLIENT_ID,
        documentType: 'nfe_recebida',
        fileName: 'test_nfe_recebida_1.xml',
        filePath: path.join(uploadsDir, 'test_nfe_recebida_1.xml'),
        fileSize: 1300
      }
    })
    console.log(`   ✅ Doc 3: NFe Recebida 1 (ID: ${doc3.id})`)

    console.log('\n🚀 Iniciando processamento contínuo (Agents 2-11)...')
    console.log('   Isso vai testar TODOS os agentes em sequência.\n')

    // Inicializar orchestrator e rodar processamento
    const orchestrator = new MonthlyProcessingOrchestrator()
    const result = await orchestrator.continueProcessingAfterUpload(CYCLE_ID)

    console.log('\n' + '='.repeat(80))
    console.log('📊 RESULTADO FINAL DO TESTE')
    console.log('='.repeat(80))
    console.log(`   Status: ${result.status}`)
    console.log(`   Sucesso: ${result.success}`)

    if (result.error) {
      console.error(`   ❌ Erro: ${result.error}`)
    }

    if (result.results) {
      console.log('\n   📋 Detalhes:')

      if (result.results.documents_validated) {
        console.log(`   Agent 2 (Validação): ${result.results.documents_validated.status}`)
      }

      if (result.results.nfes_extracted) {
        console.log(`   Agent 3 (NFe): ${result.results.nfes_extracted.emitidas?.length || 0} emitidas, ${result.results.nfes_extracted.recebidas?.length || 0} recebidas`)
        console.log(`   Receita Total: R$ ${result.results.nfes_extracted.totais?.total_receita?.toFixed(2) || '0.00'}`)
      }

      if (result.results.tax_calculation) {
        const tax = result.results.tax_calculation
        console.log(`   Agent 4 (Impostos): ${tax.regime} - Anexo ${tax.anexo}`)
        console.log(`   Alíquota Efetiva: ${tax.aliquota_efetiva}%`)
        console.log(`   Valor DAS: R$ ${tax.valor_a_pagar?.toFixed(2) || tax.valor_total?.toFixed(2)}`)
      }

      if (result.results.das_file_path) {
        console.log(`   Agent 6 (DAS): ${result.results.das_file_path}`)
      }

      if (result.results.accounting_entries) {
        const journal = result.results.accounting_entries
        console.log(`   Agent 7 (Contábil): ${journal.entries?.length || 0} lançamentos`)
        console.log(`   Balanceado: ${journal.balanced ? 'SIM ✓' : 'NÃO ✗'}`)
      }

      if (result.results.report) {
        const report = result.results.report
        console.log(`   Agent 8 (Relatório): Receita R$ ${report.dre?.receita_bruta?.toFixed(2)}`)
        console.log(`   Lucro Líquido: R$ ${report.dre?.lucro_liquido?.toFixed(2)}`)
        console.log(`   Margem: ${report.dre?.margem_liquida?.toFixed(2)}%`)
      }

      if (result.results.validation) {
        console.log(`   Agents 9-11 (Validação): ${result.results.validation.overall_status}`)
      }
    }

    console.log('\n' + '='.repeat(80))
    console.log(result.success ? '✅ TODOS OS TESTES PASSARAM!' : '❌ TESTES FALHARAM')
    console.log('='.repeat(80) + '\n')

  } catch (error: any) {
    console.error('\n❌ ERRO CRÍTICO NO TESTE:', error.message)
    console.error(error.stack)
  } finally {
    await prisma.$disconnect()
  }
}

main()
