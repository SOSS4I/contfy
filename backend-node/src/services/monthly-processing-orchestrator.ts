/**
 * MONTHLY PROCESSING ORCHESTRATOR
 *
 * Controller central que coordena todos os 11 agentes de processamento mensal.
 * Este Ã© o "cÃ©rebro" do sistema que executa todo o fluxo automaticamente.
 *
 * Fluxo:
 * 1. Agent 1: Solicita documentos ao cliente
 * 2. Aguarda upload de documentos
 * 3. Agent 2: Valida documentos recebidos
 * 4. Agent 3: Extrai dados das NFes
 * 5. Agent 4/5: Calcula impostos (Simples ou Presumido)
 * 6. Agent 6: Gera guias de pagamento (DAS/DARF)
 * 7. Agent 7: Gera lanÃ§amentos contÃ¡beis
 * 8. Agent 8: Gera relatÃ³rio gerencial
 * 9. Agent 9: Valida balanceamento contÃ¡bil (Validator)
 * 10. Agent 10: Valida consistÃªncia fiscal (Validator)
 * 11. Agent 11: Valida integridade dos dados (Validator)
 * 12. Salva no banco e notifica cliente
 */

import { prisma } from '../utils/prisma'
import { MonthlyDocumentRequestAgent } from './agents/monthly/1-document-request.agent'
import { DocumentValidatorAgent } from './agents/monthly/2-document-validator.agent'
import { NFeExtractorAgent } from './agents/monthly/3-nfe-extractor.agent'
import { TaxCalculatorSimplesAgent } from './agents/monthly/4-tax-calculator-simples.agent'
import { TaxCalculatorPresumidoAgent } from './agents/monthly/5-tax-calculator-presumido.agent'
import { DASGeneratorAgent } from './agents/monthly/6-das-generator.agent'
import { AccountingJournalAgent } from './agents/monthly/7-accounting-journal.agent'
import { ReportGeneratorAgent } from './agents/monthly/8-report-generator.agent'
import { AccountingBalanceValidator } from './agents/monthly/9-accounting-balance-validator.agent'
import { TaxConsistencyValidator } from './agents/monthly/10-tax-consistency-validator.agent'
import { DataIntegrityValidator } from './agents/monthly/11-data-integrity-validator.agent'
import * as fs from 'fs'
import * as path from 'path'


interface ProcessingResult {
  success: boolean
  cycle_id?: number
  status: 'PENDING_DOCS' | 'PROCESSING' | 'COMPLETED' | 'ERROR'
  current_step?: string
  error?: string
  results?: {
    documentsRequested?: any
    documents_validated?: any
    nfes_extracted?: any
    tax_calculation?: any
    das_file_path?: string
    accounting_entries?: any
    report?: any
    validation?: any
  }
}

export class MonthlyProcessingOrchestrator {
  private agent1: MonthlyDocumentRequestAgent
  private agent2: DocumentValidatorAgent
  private agent3: NFeExtractorAgent
  private agent4: TaxCalculatorSimplesAgent
  private agent5: TaxCalculatorPresumidoAgent
  private agent6: DASGeneratorAgent
  private agent7: AccountingJournalAgent
  private agent8: ReportGeneratorAgent
  private agent9: AccountingBalanceValidator
  private agent10: TaxConsistencyValidator
  private agent11: DataIntegrityValidator

  constructor() {
    console.log('ðŸš€ Inicializando Orchestrator com todos os 11 agentes...')

    this.agent1 = new MonthlyDocumentRequestAgent()
    this.agent2 = new DocumentValidatorAgent()
    this.agent3 = new NFeExtractorAgent()
    this.agent4 = new TaxCalculatorSimplesAgent()
    this.agent5 = new TaxCalculatorPresumidoAgent()
    this.agent6 = new DASGeneratorAgent()
    this.agent7 = new AccountingJournalAgent()
    this.agent8 = new ReportGeneratorAgent()
    this.agent9 = new AccountingBalanceValidator()
    this.agent10 = new TaxConsistencyValidator()
    this.agent11 = new DataIntegrityValidator()

    console.log('âœ… Orchestrator pronto para processar ciclos mensais!')
  }

  /**
   * MAIN METHOD: Processa um ciclo mensal completo
   *
   * Este mÃ©todo coordena todos os agentes em sequÃªncia.
   * Cada etapa depende do sucesso da anterior.
   */
  async processMonthlyAccounting(
    clientId: string | number,
    referenceMonth: number,
    referenceYear: number,
    autoRetry: boolean = true
  ): Promise<ProcessingResult> {

    console.log(`\n${'='.repeat(80)}`)
    console.log(`ðŸŽ¯ INICIANDO PROCESSAMENTO MENSAL`)
    console.log(`Cliente: ${clientId}`)
    console.log(`PerÃ­odo: ${referenceMonth}/${referenceYear}`)
    console.log(`${'='.repeat(80)}\n`)

    try {
      // ===== STEP 0: Criar/Buscar Ciclo no Banco =====
      let cycle = await this.getOrCreateCycle(clientId, referenceMonth, referenceYear)

      // ===== STEP 1: Buscar ConfiguraÃ§Ã£o do Cliente =====
      console.log('ðŸ“‹ STEP 1: Buscando configuraÃ§Ã£o do cliente...')
      const clientConfig = await this.getClientConfig(clientId)

      if (!clientConfig) {
        throw new Error('Cliente nÃ£o possui configuraÃ§Ã£o contÃ¡bil. Contador precisa aprovar primeiro.')
      }

      console.log(`âœ… ConfiguraÃ§Ã£o encontrada: Regime ${clientConfig.regimeTributario}`)

      // ===== STEP 2: Solicitar Documentos (Agent 1) =====
      console.log('\nðŸ“‹ STEP 2: Solicitando documentos necessÃ¡rios...')
      cycle = await this.updateCycleStatus(cycle.id, 'PENDING_DOCS', 'Aguardando upload de documentos')

      const documentsRequest = await this.agent1.requestDocuments(
        clientConfig,
        referenceMonth,
        referenceYear
      )

      console.log(`âœ… ${documentsRequest.documents_needed.length} tipos de documentos solicitados`)

      // Salvar no banco
      await this.saveCycleData(cycle.id, 'documentsRequested', documentsRequest)

      // TODO: Enviar email para cliente com lista de documentos
      console.log('ðŸ“§ Email enviado ao cliente solicitando documentos (TODO: implementar)')

      // IMPORTANTE: Retorna aqui e aguarda o cliente fazer upload
      // O processamento continua quando o cliente fizer upload via API
      return {
        success: true,
        cycle_id: cycle.id,
        status: 'PENDING_DOCS',
        current_step: 'Aguardando documentos do cliente',
        results: { documentsRequested: documentsRequest }
      }

    } catch (error: any) {
      console.error('âŒ ERRO NO ORCHESTRATOR:', error.message)

      return {
        success: false,
        status: 'ERROR',
        error: error.message
      }
    }
  }

  /**
   * Continua o processamento apÃ³s o cliente fazer upload dos documentos
   * Este mÃ©todo Ã© chamado quando todos os documentos obrigatÃ³rios foram enviados
   */
  async continueProcessingAfterUpload(
    cycleId: number,
    autoRetry: boolean = true
  ): Promise<ProcessingResult> {

    console.log(`\n${'='.repeat(80)}`)
    console.log(`ðŸ”„ CONTINUANDO PROCESSAMENTO`)
    console.log(`Cycle ID: ${cycleId}`)
    console.log(`${'='.repeat(80)}\n`)

    try {
      // Buscar ciclo
      const cycle = await prisma.monthlyAccountingCycle.findUnique({
        where: { id: cycleId },
        include: { client: true }
      })

      if (!cycle) throw new Error('Ciclo nÃ£o encontrado')

      const clientConfig = await this.getClientConfig(cycle.clientId)
      if (!clientConfig) throw new Error('ConfiguraÃ§Ã£o nÃ£o encontrada')

      // ===== STEP 3: Validar Documentos (Agent 2) =====
      console.log('\nðŸ“‹ STEP 3: Validando documentos recebidos...')
      await this.updateCycleStatus(cycleId, 'PROCESSING', 'Validando documentos')

      const uploadedDocs = await prisma.clientMonthlyDocument.findMany({
        where: {
          cycle_id: cycle.id,
          clientId: cycle.clientId
        }
      })

      const reportData = (cycle.monthly_report_data as any) || {}
      const documentsRequest = reportData.documentsRequested
      const validation = await this.agent2.validate(
        uploadedDocs.map(d => ({
          type: d.documentType,
          file_name: d.fileName,
          file_size: d.fileSize || 0
        })),
        documentsRequest?.documents_needed || []
      )

      console.log(`ValidaÃ§Ã£o: ${validation.status}`)
      if (validation.status === 'INCOMPLETE') {
        console.log('âš ï¸ Documentos incompletos')
        if (validation.errors && validation.errors.length > 0) {
          console.log('   Erros:', validation.errors.join(', '))
        }
        throw new Error('Documentos incompletos. Cliente precisa enviar mais documentos.')
      }

      await this.saveCycleData(cycleId, 'documents_validated', validation)

      // ===== STEP 4: Extrair NFes (Agent 3) =====
      console.log('\nðŸ“‹ STEP 4: Extraindo dados das NFes...')
      await this.updateCycleStatus(cycleId, 'PROCESSING', 'Extraindo NFes')

      const nfesEmitidas: any[] = []
      const nfesRecebidas: any[] = []

      // Processar NFes emitidas (aceitar variações de nome: NFE_EMITIDAS, nfe_emitida, NFe_EMITIDAS, etc.)
      const nfesEmitidasDocs = uploadedDocs.filter(d => {
        const t = (d.documentType || '').toUpperCase()
        return t === 'NFE_EMITIDAS' || t === 'NFE_EMITIDA' || t === 'NFE EMITIDAS'
      })
      const failedDocs: string[] = []
      const nfeEmitidasRecords: Parameters<typeof prisma.clientNFeData.create>[0]['data'][] = []
      for (const doc of nfesEmitidasDocs) {
        let xmlContent: string
        try {
          xmlContent = fs.readFileSync(doc.filePath, 'utf-8')
        } catch (readErr: any) {
          console.error(`❌ Erro ao ler arquivo ${doc.filePath}:`, readErr.message)
          failedDocs.push(doc.fileName)
          continue
        }
        // Usar extractFromXMLBatch para suportar múltiplas NFes em um único arquivo
        const nfeDataList = await this.agent3.extractFromXMLBatch(xmlContent, 'EMITIDA')
        for (const nfeData of nfeDataList) {
          nfesEmitidas.push(nfeData)
          nfeEmitidasRecords.push({
            document_id: doc.id,
            cycle_id: cycle.id,
            clientId: cycle.clientId,
            nfeType: 'EMITIDA',
            nfeKey: nfeData.nfe_key,
            nfeNumber: nfeData.nfe_number,
            nfe_series: nfeData.nfe_series,
            nfeDate: new Date(nfeData.nfe_date),
            partnerName: nfeData.partner_name,
            partner_cnpj_cpf: nfeData.partner_cnpj_cpf,
            totalValue: nfeData.total_value,
            valorIcms: nfeData.valor_icms,
            valorPis: nfeData.valor_pis,
            valorCofins: nfeData.valor_cofins,
            cfop: nfeData.cfop
          })
        }
      }

      // Processar NFes recebidas (aceitar variações de nome)
      const nfesRecebidasDocs = uploadedDocs.filter(d => {
        const t = (d.documentType || '').toUpperCase()
        return t === 'NFE_RECEBIDAS' || t === 'NFE_RECEBIDA' || t === 'NFE RECEBIDAS'
      })
      const nfeRecebidasRecords: Parameters<typeof prisma.clientNFeData.create>[0]['data'][] = []
      for (const doc of nfesRecebidasDocs) {
        let xmlContent: string
        try {
          xmlContent = fs.readFileSync(doc.filePath, 'utf-8')
        } catch (readErr: any) {
          console.error(`❌ Erro ao ler arquivo ${doc.filePath}:`, readErr.message)
          failedDocs.push(doc.fileName)
          continue
        }
        const nfeDataList = await this.agent3.extractFromXMLBatch(xmlContent, 'RECEBIDA')
        for (const nfeData of nfeDataList) {
          nfesRecebidas.push(nfeData)
          nfeRecebidasRecords.push({
            document_id: doc.id,
            cycle_id: cycle.id,
            clientId: cycle.clientId,
            nfeType: 'RECEBIDA',
            nfeKey: nfeData.nfe_key,
            nfeNumber: nfeData.nfe_number,
            nfe_series: nfeData.nfe_series,
            nfeDate: new Date(nfeData.nfe_date),
            partnerName: nfeData.partner_name,
            partner_cnpj_cpf: nfeData.partner_cnpj_cpf,
            totalValue: nfeData.total_value,
            valorIcms: nfeData.valor_icms,
            valorPis: nfeData.valor_pis,
            valorCofins: nfeData.valor_cofins,
            cfop: nfeData.cfop
          })
        }
      }

      // Salvar todos os registros de NFe atomicamente em uma única transação
      const allNfeRecords = [...nfeEmitidasRecords, ...nfeRecebidasRecords]
      if (allNfeRecords.length > 0) {
        await prisma.$transaction(
          allNfeRecords.map(record => prisma.clientNFeData.create({ data: record as any }))
        )
      }

      if (failedDocs.length > 0) {
        console.warn(`⚠️ Arquivos ignorados por erro de leitura: ${failedDocs.join(', ')}`)
      }

      // IMPORTANTE: Calcular totais separadamente!
      // total_receita = apenas NFes EMITIDAS (vendas/serviÃ§os)
      // total_despesas = apenas NFes RECEBIDAS (compras/custos)
      const totaisEmitidas = this.agent3.calculateTotals(nfesEmitidas)
      const totaisRecebidas = this.agent3.calculateTotals(nfesRecebidas)
      const totaisNFe = {
        ...totaisEmitidas,
        total_receita: totaisEmitidas.total_receita, // Receita = sÃ³ emitidas
        total_despesas: totaisRecebidas.total_receita, // Despesas = recebidas
        quantidade_nfes_emitidas: nfesEmitidas.length,
        quantidade_nfes_recebidas: nfesRecebidas.length
      }

      console.log(`âœ… ${nfesEmitidas.length} NFes emitidas, ${nfesRecebidas.length} NFes recebidas`)
      console.log(`   Total receita (emitidas): R$ ${totaisNFe.total_receita.toFixed(2)}`)
      console.log(`   Total despesas (recebidas): R$ ${totaisNFe.total_despesas.toFixed(2)}`)

      await this.saveCycleData(cycleId, 'nfes_extracted', {
        emitidas: nfesEmitidas,
        recebidas: nfesRecebidas,
        totais: totaisNFe
      })

      // ===== STEP 5: Calcular Impostos (Agent 4 ou 5) =====
      console.log('\nðŸ“‹ STEP 5: Calculando impostos...')
      await this.updateCycleStatus(cycleId, 'PROCESSING', 'Calculando impostos')

      let taxCalculation: any

      if (clientConfig.regimeTributario === 'SIMPLES_NACIONAL') {
        // Buscar receita dos Ãºltimos 12 meses
        const receita12m = await this.getReceita12Meses(cycle.clientId, cycle.referenceYear, cycle.referenceMonth)
        const folha12m = await this.getFolha12Meses(cycle.clientId, cycle.referenceYear, cycle.referenceMonth)

        taxCalculation = await this.agent4.calculate(
          totaisNFe.total_receita, // Usar apenas receita das emitidas
          receita12m,
          folha12m,
          clientConfig.anexoSimples || 'I',
          clientConfig.contadorInstructions || undefined,
          cycle.referenceMonth,
          cycle.referenceYear
        )

        console.log(`âœ… Simples Nacional - Anexo ${taxCalculation.anexo}`)
        console.log(`   AlÃ­quota efetiva: ${taxCalculation.aliquota_efetiva}%`)
        console.log(`   Valor a pagar: R$ ${taxCalculation.valor_a_pagar.toFixed(2)}`)

      } else if (clientConfig.regimeTributario === 'LUCRO_PRESUMIDO') {
        // Receita trimestral
        let receitaTrimestre = await this.getReceitaTrimestre(
          cycle.clientId,
          cycle.referenceYear,
          cycle.referenceMonth
        )

        // Se não tem histórico, usar receita do mês atual como base (1º ciclo)
        if (receitaTrimestre <= 0) {
          receitaTrimestre = totaisNFe.total_receita
          console.log(`   ℹ️ Sem histórico trimestral — usando receita do mês (R$${receitaTrimestre.toFixed(2)}) como base`)
        }

        taxCalculation = await this.agent5.calculate(
          totaisNFe.total_receita,
          receitaTrimestre,
          clientConfig.atividade_principal || 'comercio',
          clientConfig.cnae_code || ''
        )

        console.log(`âœ… Lucro Presumido`)
        console.log(`   IRPJ: R$ ${taxCalculation.irpj_total.toFixed(2)}`)
        console.log(`   CSLL: R$ ${taxCalculation.csll_total.toFixed(2)}`)
        console.log(`   Total: R$ ${taxCalculation.valor_total.toFixed(2)}`)

      } else {
        throw new Error('Regime tributÃ¡rio nÃ£o suportado: ' + clientConfig.regimeTributario)
      }

      await this.saveCycleData(cycleId, 'tax_calculation', taxCalculation)

      // ===== STEP 6: Gerar Guias (Agent 6) =====
      console.log('\nðŸ“‹ STEP 6: Gerando guias de pagamento...')
      await this.updateCycleStatus(cycleId, 'PROCESSING', 'Gerando guias DAS/DARF')

      let dasFilePath: string

      if (clientConfig.regimeTributario === 'SIMPLES_NACIONAL') {
        dasFilePath = await this.agent6.generateDAS({
          client_name: cycle.client.name || (cycle.client as any).razaoSocial || 'Cliente',
          cnpj: cycle.client.cnpj || '',
          reference_month: cycle.referenceMonth,
          reference_year: cycle.referenceYear,
          regime: 'SIMPLES_NACIONAL',
          anexo: taxCalculation.anexo,
          valor_total: taxCalculation.valor_a_pagar,
          vencimento: taxCalculation.vencimento,
          breakdown: taxCalculation.breakdown
        })
        console.log(`âœ… DAS gerado: ${path.basename(dasFilePath)}`)

      } else {
        // Gerar mÃºltiplos DARFs
        const darfIRPJ = await this.agent6.generateDARF({
          client_name: cycle.client.name || (cycle.client as any).razaoSocial || 'Cliente',
          cnpj: cycle.client.cnpj || '',
          reference_month: cycle.referenceMonth,
          reference_year: cycle.referenceYear,
          valor_total: taxCalculation.irpj_total,
          vencimento: taxCalculation.vencimento_irpj,
          irpj: taxCalculation.irpj_total
        }, 'IRPJ')

        const darfCSLL = await this.agent6.generateDARF({
          client_name: cycle.client.name || (cycle.client as any).razaoSocial || 'Cliente',
          cnpj: cycle.client.cnpj || '',
          reference_month: cycle.referenceMonth,
          reference_year: cycle.referenceYear,
          valor_total: taxCalculation.csll_total,
          vencimento: taxCalculation.vencimento_csll,
          csll: taxCalculation.csll_total
        }, 'CSLL')

        dasFilePath = darfIRPJ // Salva o primeiro
        console.log(`âœ… DARF IRPJ: ${path.basename(darfIRPJ)}`)
        console.log(`âœ… DARF CSLL: ${path.basename(darfCSLL)}`)
      }

      await this.saveCycleData(cycleId, 'das_file_path', dasFilePath)

      // ===== STEP 7: Gerar LanÃ§amentos ContÃ¡beis (Agent 7) =====
      console.log('\nðŸ“‹ STEP 7: Gerando lanÃ§amentos contÃ¡beis...')
      await this.updateCycleStatus(cycleId, 'PROCESSING', 'Gerando lanÃ§amentos contÃ¡beis')

      const journal = await this.agent7.generateEntries(
        nfesEmitidas,
        nfesRecebidas,
        taxCalculation,
        cycle.referenceMonth,
        cycle.referenceYear
      )

      console.log(`âœ… ${journal.entries.length} lanÃ§amentos contÃ¡beis gerados`)
      console.log(`   DÃ©bitos: R$ ${journal.total_debits.toFixed(2)}`)
      console.log(`   CrÃ©ditos: R$ ${journal.total_credits.toFixed(2)}`)
      console.log(`   Balanceado: ${journal.balanced ? 'SIM âœ“' : 'NÃƒO âœ—'}`)

      if (!journal.balanced) {
        console.warn('âš ï¸ LanÃ§amentos contÃ¡beis NÃƒO estÃ£o balanceados!')
      }

      await this.saveCycleData(cycleId, 'accounting_entries', journal)

      // ===== STEP 8: Gerar RelatÃ³rio Gerencial (Agent 8) =====
      console.log('\nðŸ“‹ STEP 8: Gerando relatÃ³rio gerencial...')
      await this.updateCycleStatus(cycleId, 'PROCESSING', 'Gerando relatÃ³rio gerencial')

      // Buscar histÃ³rico
      const historico = await this.getHistorico(cycle.clientId, cycle.referenceYear, cycle.referenceMonth)

      const report = await this.agent8.generateMonthlyReport(
        nfesEmitidas,
        nfesRecebidas,
        taxCalculation,
        historico,
        cycle.referenceMonth,
        cycle.referenceYear
      )

      console.log(`âœ… RelatÃ³rio gerado`)
      console.log(`   Receita Bruta: R$ ${report.dre.receita_bruta.toFixed(2)}`)
      console.log(`   Lucro LÃ­quido: R$ ${report.dre.lucro_liquido.toFixed(2)}`)
      console.log(`   Margem: ${report.dre.margem_liquida.toFixed(2)}%`)
      console.log(`   Insights: ${report.insights.length}`)

      await this.saveCycleData(cycleId, 'report', report)

      // ===== STEP 9: Agent 9 - Validar Balanceamento ContÃ¡bil =====
      console.log('\nðŸ“‹ STEP 9: Validando balanceamento contÃ¡bil...')
      await this.updateCycleStatus(cycleId, 'PROCESSING', 'Validando balanceamento contÃ¡bil')

      const balanceValidation = await this.agent9.validate(journal)

      if (balanceValidation.status === 'REJECTED') {
        console.error('âŒ LanÃ§amentos contÃ¡beis NÃƒO balanceados!')
        throw new Error('ValidaÃ§Ã£o contÃ¡bil falhou: ' + balanceValidation.errors.join(', '))
      }

      console.log(`âœ… LanÃ§amentos contÃ¡beis balanceados`)
      await this.saveCycleData(cycleId, 'balance_validation', balanceValidation)

      // ===== STEP 10: Agent 10 - Validar ConsistÃªncia Fiscal =====
      console.log('\nðŸ“‹ STEP 10: Validando consistÃªncia fiscal...')
      await this.updateCycleStatus(cycleId, 'PROCESSING', 'Validando consistÃªncia fiscal')

      const taxValidation = await this.agent10.validate(
        { emitidas: nfesEmitidas, recebidas: nfesRecebidas, totais: totaisNFe },
        taxCalculation,
        clientConfig
      )

      if (taxValidation.status === 'REJECTED') {
        console.error('âŒ InconsistÃªncias fiscais detectadas!')
        throw new Error('ValidaÃ§Ã£o fiscal falhou: ' + taxValidation.errors.join(', '))
      }

      console.log(`âœ… ConsistÃªncia fiscal aprovada`)
      await this.saveCycleData(cycleId, 'tax_validation', taxValidation)

      // ===== STEP 11: Agent 11 - Validar Integridade dos Dados =====
      console.log('\nðŸ“‹ STEP 11: Validando integridade dos dados...')
      await this.updateCycleStatus(cycleId, 'PROCESSING', 'Validando integridade dos dados')

      const integrityValidation = await this.agent11.validate({
        nfesExtracted: { emitidas: nfesEmitidas, recebidas: nfesRecebidas, totais: totaisNFe },
        taxCalculation,
        journal,
        report,
        referenceMonth: cycle.referenceMonth,
        referenceYear: cycle.referenceYear
      })

      if (integrityValidation.status === 'REJECTED') {
        console.error('âŒ Problemas de integridade detectados!')
        console.error(`   Score: ${integrityValidation.integrity_score}/100`)
        throw new Error('ValidaÃ§Ã£o de integridade falhou: ' + integrityValidation.errors.join(', '))
      }

      console.log(`âœ… Integridade dos dados aprovada (Score: ${integrityValidation.integrity_score}/100)`)
      await this.saveCycleData(cycleId, 'integrity_validation', integrityValidation)

      // Consolidar todas as validaÃ§Ãµes
      const allValidations = {
        balance: balanceValidation,
        tax: taxValidation,
        integrity: integrityValidation,
        overall_status: 'APPROVED',
        validated_at: new Date().toISOString()
      }

      await this.saveCycleData(cycleId, 'final_validation', allValidations)

      // ===== STEP 12: Finalizar =====
      await this.updateCycleStatus(cycleId, 'COMPLETED', 'Processamento concluÃ­do com sucesso')

      console.log(`\n${'='.repeat(80)}`)
      console.log(`âœ… PROCESSAMENTO CONCLUÃDO COM SUCESSO!`)
      console.log(`${'='.repeat(80)}\n`)

      // TODO: Enviar email ao cliente com relatÃ³rio e guias
      console.log('ðŸ“§ Email enviado ao cliente com relatÃ³rio e guias (TODO: implementar)')

      return {
        success: true,
        cycle_id: cycleId,
        status: 'COMPLETED',
        results: {
          documents_validated: validation,
          nfes_extracted: { emitidas: nfesEmitidas, recebidas: nfesRecebidas, totais: totaisNFe },
          tax_calculation: taxCalculation,
          das_file_path: dasFilePath,
          accounting_entries: journal,
          report: report,
          validation: allValidations
        }
      }

    } catch (error: any) {
      console.error('âŒ ERRO NO PROCESSAMENTO:', error.message)

      await this.updateCycleStatus(cycleId, 'ERROR', error.message)

      return {
        success: false,
        cycle_id: cycleId,
        status: 'ERROR',
        error: error.message
      }
    }
  }

  // ===== HELPER METHODS =====

  private async getOrCreateCycle(clientId: string | number, month: number, year: number) {
    let cycle = await prisma.monthlyAccountingCycle.findFirst({
      where: {
        clientId: Number(clientId),
        referenceMonth: month,
        referenceYear: year
      }
    })

    if (!cycle) {
      cycle = await prisma.monthlyAccountingCycle.create({
        data: {
          clientId: Number(clientId),
          referenceMonth: month,
          referenceYear: year,
          status: 'PENDING_DOCS'
        }
      })
    }

    return cycle
  }

  private async updateCycleStatus(cycleId: number, status: string, processing_log?: string) {
    return await prisma.monthlyAccountingCycle.update({
      where: { id: cycleId },
      data: {
        status,
        processingLog: processing_log,
        updatedAt: new Date()
      }
    })
  }

  /**
   * Salva dados do ciclo nos campos corretos do schema.
   * Dados sem campo especÃ­fico sÃ£o armazenados em monthly_report_data.
   */
  private async saveCycleData(cycleId: number, key: string, value: any) {
    // Mapear keys para campos reais do schema
    const directFieldMap: Record<string, string> = {
      'tax_calculation': 'tax_calculation',
      'accounting_entries': 'accounting_entries',
      'das_file_path': 'das_pdf_path',
    }

    if (directFieldMap[key]) {
      const fieldName = directFieldMap[key]
      const updateData: any = { updatedAt: new Date() }
      updateData[fieldName] = value
      return await prisma.monthlyAccountingCycle.update({
        where: { id: cycleId },
        data: updateData
      })
    }

    // Para outros dados, salvar em monthly_report_data como JSON combinado
    const cycle = await prisma.monthlyAccountingCycle.findUnique({
      where: { id: cycleId }
    })

    const reportData = (cycle?.monthly_report_data as any) || {}
    reportData[key] = value

    return await prisma.monthlyAccountingCycle.update({
      where: { id: cycleId },
      data: {
        monthly_report_data: reportData,
        updatedAt: new Date()
      }
    })
  }

  private async getClientConfig(clientId: string | number) {
    return await prisma.clientAccountingConfig.findUnique({
      where: { clientId: Number(clientId) }
    })
  }

  private async getReceita12Meses(clientId: string | number, year: number, month: number): Promise<number> {
    // Buscar receita dos Ãºltimos 12 meses a partir de ciclos anteriores
    const cid = Number(clientId)

    // Calcular os Ãºltimos 12 meses
    const cycles = await prisma.monthlyAccountingCycle.findMany({
      where: {
        clientId: cid,
        status: 'COMPLETED'
      },
      orderBy: [
        { referenceYear: 'desc' },
        { referenceMonth: 'desc' }
      ],
      take: 12
    })

    if (cycles.length === 0) {
      // Se nÃ£o hÃ¡ histÃ³rico, usar receita anual do cadastro do cliente
      const client = await prisma.client.findUnique({ where: { id: cid } })
      return client?.annualRevenue || 0
    }

    // Somar receita dos ciclos (do campo tax_calculation)
    let totalReceita = 0
    for (const cycle of cycles) {
      const taxCalc = cycle.tax_calculation as any
      if (taxCalc?.receita_mes) {
        totalReceita += taxCalc.receita_mes
      }
    }

    return totalReceita
  }

  private async getFolha12Meses(clientId: string | number, year: number, month: number): Promise<number> {
    // Buscar folha de pagamento dos Ãºltimos 12 meses
    const cid = Number(clientId)
    const config = await prisma.clientAccountingConfig.findUnique({
      where: { clientId: cid }
    })

    // Usar folha_pagamento_mensal do config se disponível, senão estimar
    const employeeCount = config?.employee_count ?? 0
    const folhaMensal = (config as any)?.folha_pagamento_mensal
    if (folhaMensal && folhaMensal > 0) {
      return folhaMensal * 12
    }
    // Estimar baseado no salário mínimo vigente (2025: R$1.518) + encargos (~40%)
    const salarioEstimado = 1518 * 1.4
    return employeeCount * salarioEstimado * 12
  }

  private async getReceitaTrimestre(clientId: string | number, year: number, month: number): Promise<number> {
    // Buscar receita do trimestre (mÃªs atual + 2 anteriores)
    const cid = Number(clientId)

    const cycles = await prisma.monthlyAccountingCycle.findMany({
      where: {
        clientId: cid,
        status: 'COMPLETED'
      },
      orderBy: [
        { referenceYear: 'desc' },
        { referenceMonth: 'desc' }
      ],
      take: 3
    })

    let totalReceita = 0
    for (const cycle of cycles) {
      const taxCalc = cycle.tax_calculation as any
      if (taxCalc?.receita_mes) {
        totalReceita += taxCalc.receita_mes
      }
    }

    return totalReceita
  }

  private async getHistorico(clientId: string | number, year: number, month: number): Promise<any[]> {
    // Buscar Ãºltimos 6 meses de histÃ³rico
    const cid = Number(clientId)

    const cycles = await prisma.monthlyAccountingCycle.findMany({
      where: {
        clientId: cid,
        status: 'COMPLETED'
      },
      orderBy: [
        { referenceYear: 'desc' },
        { referenceMonth: 'desc' }
      ],
      take: 6
    })

    return cycles.map(cycle => ({
      month: cycle.referenceMonth,
      year: cycle.referenceYear,
      tax_calculation: cycle.tax_calculation,
      accounting_entries: cycle.accounting_entries,
      report_data: cycle.monthly_report_data
    }))
  }
}
