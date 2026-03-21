/**
 * TEST SCRIPT: Monthly Processing Orchestrator
 *
 * Este script testa o orchestrador completo com dados de exemplo
 */

import { PrismaClient } from '@prisma/client'
import { MonthlyProcessingOrchestrator } from '../src/services/monthly-processing-orchestrator'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()
const orchestrator = new MonthlyProcessingOrchestrator()

async function main() {
  console.log('\n' + '='.repeat(80))
  console.log('🧪 TESTE DO ORCHESTRADOR DE PROCESSAMENTO MENSAL')
  console.log('='.repeat(80) + '\n')

  try {
    // ===== STEP 1: Criar cliente de teste =====
    console.log('📋 STEP 1: Criando cliente de teste...')

    // Verificar se já existe cliente de teste
    let testClient = await prisma.client.findFirst({
      where: { cnpj: '12345678000199' }
    })

    if (!testClient) {
      testClient = await prisma.client.create({
        data: {
          nome: 'Sorveteria Gelato Ltda',
          razao_social: 'Sorveteria Gelato Comercio e Industria Ltda',
          cnpj: '12345678000199',
          email: 'contato@gelato.com.br',
          telefone: '11999887766',
          tipo: 'PJ',
          status: 'ativo'
        }
      })
      console.log(`✅ Cliente criado: ${testClient.id}`)
    } else {
      console.log(`✅ Cliente já existe: ${testClient.id}`)
    }

    // ===== STEP 2: Criar configuração contábil =====
    console.log('\n📋 STEP 2: Criando configuração contábil...')

    let config = await prisma.clientAccountingConfig.findUnique({
      where: { clientId: testClient.id }
    })

    if (!config) {
      config = await prisma.clientAccountingConfig.create({
        data: {
          clientId: testClient.id,
          regimeTributario: 'SIMPLES_NACIONAL',
          anexoSimples: 'III', // Serviços com mais de 28% de folha
          cnae: '5611-2/01', // Restaurante
          tipoAtividade: 'servicos',
          hasEmployees: true,
          numEmployees: 8,
          estimatedMonthlyRevenue: 50000,
          contadorInstructions: 'Cliente tem 8 funcionários. Verificar Fator R mensalmente.',
          status: 'APPROVED'
        }
      })
      console.log(`✅ Configuração criada`)
    } else {
      console.log(`✅ Configuração já existe`)
    }

    // ===== STEP 3: Iniciar processamento mensal =====
    console.log('\n📋 STEP 3: Iniciando processamento mensal...')

    const referenceMonth = 11 // Novembro
    const referenceYear = 2025

    const result1 = await orchestrator.processMonthlyAccounting(
      testClient.id,
      referenceMonth,
      referenceYear
    )

    console.log('\n✅ Resultado STEP 1 (Solicitação de Documentos):')
    console.log(`   Status: ${result1.status}`)
    console.log(`   Cycle ID: ${result1.cycle_id}`)
    console.log(`   Documentos solicitados: ${result1.results?.documents_requested?.documents_needed?.length || 0}`)

    if (result1.results?.documents_requested) {
      console.log('\n   📄 Lista de documentos:')
      for (const doc of result1.results.documents_requested.documents_needed) {
        console.log(`      - ${doc.name} (${doc.type})`)
        console.log(`        Obrigatório: ${doc.mandatory ? 'SIM' : 'NÃO'}`)
        console.log(`        Prazo: ${doc.deadline}`)
      }
    }

    if (!result1.cycle_id) {
      throw new Error('Cycle ID não foi retornado')
    }

    // ===== STEP 4: Simular upload de documentos =====
    console.log('\n📋 STEP 4: Simulando upload de documentos...')

    // Criar XMLs de NFe de exemplo
    const nfeEmitida1 = createExampleNFe('EMITIDA', 1, 15000, '2025-11-05')
    const nfeEmitida2 = createExampleNFe('EMITIDA', 2, 20000, '2025-11-15')
    const nfeEmitida3 = createExampleNFe('EMITIDA', 3, 15000, '2025-11-25')

    const nfeRecebida1 = createExampleNFe('RECEBIDA', 101, 5000, '2025-11-10')
    const nfeRecebida2 = createExampleNFe('RECEBIDA', 102, 3000, '2025-11-20')

    // Salvar NFes em arquivos
    const uploadsDir = path.join(__dirname, '../uploads/documents')
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true })
    }

    const nfeEmitida1Path = path.join(uploadsDir, 'nfe-emitida-1.xml')
    const nfeEmitida2Path = path.join(uploadsDir, 'nfe-emitida-2.xml')
    const nfeEmitida3Path = path.join(uploadsDir, 'nfe-emitida-3.xml')
    const nfeRecebida1Path = path.join(uploadsDir, 'nfe-recebida-1.xml')
    const nfeRecebida2Path = path.join(uploadsDir, 'nfe-recebida-2.xml')

    fs.writeFileSync(nfeEmitida1Path, nfeEmitida1)
    fs.writeFileSync(nfeEmitida2Path, nfeEmitida2)
    fs.writeFileSync(nfeEmitida3Path, nfeEmitida3)
    fs.writeFileSync(nfeRecebida1Path, nfeRecebida1)
    fs.writeFileSync(nfeRecebida2Path, nfeRecebida2)

    // Registrar documentos no banco
    await prisma.clientMonthlyDocument.createMany({
      data: [
        {
          clientId: testClient.id,
          referenceMonth: referenceMonth,
          referenceYear: referenceYear,
          documentType: 'nfe_emitida',
          fileName: 'nfe-emitida-1.xml',
          filePath: nfeEmitida1Path,
          fileSize: nfeEmitida1.length,
          status: 'UPLOADED'
        },
        {
          clientId: testClient.id,
          referenceMonth: referenceMonth,
          referenceYear: referenceYear,
          documentType: 'nfe_emitida',
          fileName: 'nfe-emitida-2.xml',
          filePath: nfeEmitida2Path,
          fileSize: nfeEmitida2.length,
          status: 'UPLOADED'
        },
        {
          clientId: testClient.id,
          referenceMonth: referenceMonth,
          referenceYear: referenceYear,
          documentType: 'nfe_emitida',
          fileName: 'nfe-emitida-3.xml',
          filePath: nfeEmitida3Path,
          fileSize: nfeEmitida3.length,
          status: 'UPLOADED'
        },
        {
          clientId: testClient.id,
          referenceMonth: referenceMonth,
          referenceYear: referenceYear,
          documentType: 'nfe_recebida',
          fileName: 'nfe-recebida-1.xml',
          filePath: nfeRecebida1Path,
          fileSize: nfeRecebida1.length,
          status: 'UPLOADED'
        },
        {
          clientId: testClient.id,
          referenceMonth: referenceMonth,
          referenceYear: referenceYear,
          documentType: 'nfe_recebida',
          fileName: 'nfe-recebida-2.xml',
          filePath: nfeRecebida2Path,
          fileSize: nfeRecebida2.length,
          status: 'UPLOADED'
        },
        {
          clientId: testClient.id,
          referenceMonth: referenceMonth,
          referenceYear: referenceYear,
          documentType: 'folha_pagamento',
          fileName: 'folha-novembro-2025.pdf',
          filePath: '/fake/path/folha.pdf',
          fileSize: 50000,
          status: 'UPLOADED'
        }
      ]
    })

    console.log('✅ 6 documentos simulados e registrados no banco')

    // ===== STEP 5: Continuar processamento =====
    console.log('\n📋 STEP 5: Continuando processamento após upload...')

    const result2 = await orchestrator.continueProcessingAfterUpload(result1.cycle_id)

    console.log('\n✅ Resultado Final:')
    console.log(`   Status: ${result2.status}`)
    console.log(`   Sucesso: ${result2.success ? 'SIM' : 'NÃO'}`)

    if (result2.error) {
      console.log(`   ❌ Erro: ${result2.error}`)
    }

    if (result2.results) {
      console.log('\n📊 Resultados detalhados:')

      // Validação de documentos
      if (result2.results.documents_validated) {
        console.log(`   ✓ Documentos validados: ${result2.results.documents_validated.status}`)
      }

      // NFes extraídas
      if (result2.results.nfes_extracted) {
        const { emitidas, recebidas, totais } = result2.results.nfes_extracted
        console.log(`   ✓ NFes emitidas: ${emitidas.length}`)
        console.log(`   ✓ NFes recebidas: ${recebidas.length}`)
        console.log(`   ✓ Receita total: R$ ${totais.total_receita.toFixed(2)}`)
      }

      // Cálculo de impostos
      if (result2.results.tax_calculation) {
        const tax = result2.results.tax_calculation
        console.log(`   ✓ Regime: Simples Nacional - Anexo ${tax.anexo}`)
        console.log(`   ✓ Alíquota efetiva: ${tax.aliquota_efetiva}%`)
        console.log(`   ✓ Valor a pagar: R$ ${tax.valor_a_pagar.toFixed(2)}`)
        console.log(`   ✓ Vencimento: ${tax.vencimento}`)
      }

      // Guia DAS
      if (result2.results.das_file_path) {
        console.log(`   ✓ DAS gerado: ${path.basename(result2.results.das_file_path)}`)
      }

      // Lançamentos contábeis
      if (result2.results.accounting_entries) {
        const journal = result2.results.accounting_entries
        console.log(`   ✓ Lançamentos contábeis: ${journal.entries.length}`)
        console.log(`   ✓ Balanceado: ${journal.balanced ? 'SIM' : 'NÃO'}`)
      }

      // Relatório gerencial
      if (result2.results.report) {
        const report = result2.results.report
        console.log(`   ✓ DRE - Receita Bruta: R$ ${report.dre.receita_bruta.toFixed(2)}`)
        console.log(`   ✓ DRE - Lucro Líquido: R$ ${report.dre.lucro_liquido.toFixed(2)}`)
        console.log(`   ✓ DRE - Margem Líquida: ${report.dre.margem_liquida.toFixed(2)}%`)
        console.log(`   ✓ Insights gerados: ${report.insights?.length || 0}`)
      }

      // Validação final
      if (result2.results.validation) {
        const val = result2.results.validation
        console.log(`   ✓ Validação final: ${val.status}`)
        if (val.errors.length > 0) {
          console.log(`   ⚠️  Erros: ${val.errors.join(', ')}`)
        }
        if (val.warnings.length > 0) {
          console.log(`   ⚠️  Avisos: ${val.warnings.join(', ')}`)
        }
      }
    }

    console.log('\n' + '='.repeat(80))
    console.log('✅ TESTE CONCLUÍDO COM SUCESSO!')
    console.log('='.repeat(80) + '\n')

  } catch (error: any) {
    console.error('\n❌ ERRO NO TESTE:', error.message)
    console.error(error.stack)
  } finally {
    await prisma.$disconnect()
  }
}

/**
 * Cria um XML de NFe de exemplo
 */
function createExampleNFe(tipo: 'EMITIDA' | 'RECEBIDA', numero: number, valor: number, data: string): string {
  const chave = `35${data.replace(/-/g, '')}${numero.toString().padStart(9, '0')}${Math.random().toString().substring(2, 10)}`

  return `<?xml version="1.0" encoding="UTF-8"?>
<nfeProc versao="4.00">
  <NFe>
    <infNFe Id="NFe${chave}" versao="4.00">
      <ide>
        <cUF>35</cUF>
        <nNF>${numero}</nNF>
        <serie>1</serie>
        <dhEmi>${data}T10:00:00-03:00</dhEmi>
        <tpNF>${tipo === 'EMITIDA' ? '1' : '0'}</tpNF>
      </ide>
      <emit>
        <CNPJ>${tipo === 'EMITIDA' ? '12345678000199' : '98765432000100'}</CNPJ>
        <xNome>${tipo === 'EMITIDA' ? 'Sorveteria Gelato Ltda' : 'Fornecedor Exemplo Ltda'}</xNome>
        <enderEmit>
          <xLgr>Rua das Flores</xLgr>
          <nro>123</nro>
          <xBairro>Centro</xBairro>
          <cMun>3550308</cMun>
          <xMun>São Paulo</xMun>
          <UF>SP</UF>
          <CEP>01000000</CEP>
        </enderEmit>
      </emit>
      <dest>
        <CNPJ>${tipo === 'EMITIDA' ? '98765432000100' : '12345678000199'}</CNPJ>
        <xNome>${tipo === 'EMITIDA' ? 'Cliente Exemplo Ltda' : 'Sorveteria Gelato Ltda'}</xNome>
      </dest>
      <det nItem="1">
        <prod>
          <cProd>001</cProd>
          <xProd>${tipo === 'EMITIDA' ? 'Sorvete Artesanal' : 'Matéria Prima'}</xProd>
          <CFOP>${tipo === 'EMITIDA' ? '5102' : '1102'}</CFOP>
          <uCom>UN</uCom>
          <qCom>10</qCom>
          <vUnCom>${(valor / 10).toFixed(2)}</vUnCom>
          <vProd>${valor.toFixed(2)}</vProd>
        </prod>
        <imposto>
          <ICMS>
            <ICMS00>
              <orig>0</orig>
              <CST>00</CST>
              <vBC>${valor.toFixed(2)}</vBC>
              <pICMS>7.00</pICMS>
              <vICMS>${(valor * 0.07).toFixed(2)}</vICMS>
            </ICMS00>
          </ICMS>
          <PIS>
            <PISAliq>
              <CST>01</CST>
              <vBC>${valor.toFixed(2)}</vBC>
              <pPIS>1.65</pPIS>
              <vPIS>${(valor * 0.0165).toFixed(2)}</vPIS>
            </PISAliq>
          </PIS>
          <COFINS>
            <COFINSAliq>
              <CST>01</CST>
              <vBC>${valor.toFixed(2)}</vBC>
              <pCOFINS>7.60</pCOFINS>
              <vCOFINS>${(valor * 0.076).toFixed(2)}</vCOFINS>
            </COFINSAliq>
          </COFINS>
        </imposto>
      </det>
      <total>
        <ICMSTot>
          <vBC>${valor.toFixed(2)}</vBC>
          <vICMS>${(valor * 0.07).toFixed(2)}</vICMS>
          <vPIS>${(valor * 0.0165).toFixed(2)}</vPIS>
          <vCOFINS>${(valor * 0.076).toFixed(2)}</vCOFINS>
          <vNF>${valor.toFixed(2)}</vNF>
        </ICMSTot>
      </total>
    </infNFe>
  </NFe>
  <protNFe versao="4.00">
    <infProt>
      <tpAmb>1</tpAmb>
      <verAplic>SP_NFE_PL009_V4</verAplic>
      <chNFe>${chave}</chNFe>
      <dhRecbto>${data}T10:05:00-03:00</dhRecbto>
      <nProt>135${Math.random().toString().substring(2, 17)}</nProt>
      <digVal>${Math.random().toString(36).substring(2, 30)}</digVal>
      <cStat>100</cStat>
      <xMotivo>Autorizado o uso da NF-e</xMotivo>
    </infProt>
  </protNFe>
</nfeProc>`
}

// Executar teste
main()
