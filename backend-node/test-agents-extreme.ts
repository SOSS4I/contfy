/**
 * TESTES EXTREMOS DOS AGENTES DE IA
 *
 * Testa cenários de borda, dados errados, valores absurdos, etc.
 * "Cliente bem brasileiro" - todos os erros possíveis
 */

import { PrismaClient } from '@prisma/client'
import { MonthlyDocumentRequestAgent } from './src/services/agents/monthly/1-document-request.agent'
import { DocumentValidatorAgent } from './src/services/agents/monthly/2-document-validator.agent'
import { NFeExtractorAgent } from './src/services/agents/monthly/3-nfe-extractor.agent'
import { TaxCalculatorSimplesAgent } from './src/services/agents/monthly/4-tax-calculator-simples.agent'
import { TaxCalculatorPresumidoAgent } from './src/services/agents/monthly/5-tax-calculator-presumido.agent'
import { DASGeneratorAgent } from './src/services/agents/monthly/6-das-generator.agent'
import { AccountingJournalAgent } from './src/services/agents/monthly/7-accounting-journal.agent'
import { ReportGeneratorAgent } from './src/services/agents/monthly/8-report-generator.agent'
import { AccountingBalanceValidator } from './src/services/agents/monthly/9-accounting-balance-validator.agent'
import { TaxConsistencyValidator } from './src/services/agents/monthly/10-tax-consistency-validator.agent'
import { DataIntegrityValidator } from './src/services/agents/monthly/11-data-integrity-validator.agent'

let passed = 0
let failed = 0

function test(name: string, success: boolean, detail?: string) {
  if (success) {
    passed++
    console.log(`  ✅ ${name}`)
  } else {
    failed++
    console.log(`  ❌ ${name}${detail ? ' - ' + detail : ''}`)
  }
}

async function main() {
  console.log('\n' + '='.repeat(80))
  console.log('🧪 TESTES EXTREMOS DOS AGENTES - CENÁRIOS DE BORDA')
  console.log('='.repeat(80) + '\n')

  // ===== AGENT 2: Document Validator =====
  console.log('\n📋 AGENT 2 - Document Validator (Testes Extremos)')
  console.log('-'.repeat(50))

  const agent2 = new DocumentValidatorAgent()

  // Teste: Nenhum documento enviado
  const r2a = await agent2.validate([], [{ type: 'NFe_EMITIDAS', mandatory: true }])
  test('Nenhum documento enviado → INCOMPLETE', r2a.status === 'INCOMPLETE')

  // Teste: Documento muito pequeno (corrompido)
  const r2b = await agent2.validate(
    [{ type: 'NFe_EMITIDAS', file_name: 'nota.xml', file_size: 100 }],
    [{ type: 'NFe_EMITIDAS', mandatory: true }]
  )
  test('Arquivo muito pequeno (100 bytes) → ERROR', r2b.status === 'ERROR')

  // Teste: Arquivo muito grande
  const r2c = await agent2.validate(
    [{ type: 'NFe_EMITIDAS', file_name: 'nota.xml', file_size: 100 * 1024 * 1024 }],
    [{ type: 'NFe_EMITIDAS', mandatory: true }]
  )
  test('Arquivo muito grande (100MB) → ERROR', r2c.status === 'ERROR')

  // Teste: Formato errado (NFe como PDF em vez de XML)
  const r2d = await agent2.validate(
    [{ type: 'NFe_EMITIDAS', file_name: 'nota.pdf', file_size: 50000 }],
    [{ type: 'NFe_EMITIDAS', mandatory: true }]
  )
  test('NFe em formato PDF (deveria ser XML) → ERROR', r2d.status === 'ERROR')

  // Teste: Todos os documentos corretos
  const r2e = await agent2.validate(
    [
      { type: 'NFe_EMITIDAS', file_name: 'notas.xml', file_size: 50000 },
      { type: 'NFe_RECEBIDAS', file_name: 'compras.xml', file_size: 30000 }
    ],
    [
      { type: 'NFe_EMITIDAS', mandatory: true },
      { type: 'NFe_RECEBIDAS', mandatory: true }
    ]
  )
  test('Todos os documentos corretos → COMPLETE', r2e.status === 'COMPLETE')

  // ===== AGENT 3: NFe Extractor =====
  console.log('\n📋 AGENT 3 - NFe Extractor (Testes Extremos)')
  console.log('-'.repeat(50))

  const agent3 = new NFeExtractorAgent()

  // Teste: XML inválido
  try {
    await agent3.extractFromXML('isso não é xml', 'EMITIDA')
    test('XML totalmente inválido → deveria dar erro', false, 'Não deu erro!')
  } catch (e: any) {
    test('XML totalmente inválido → erro capturado', true)
  }

  // Teste: XML vazio
  try {
    await agent3.extractFromXML('', 'EMITIDA')
    test('XML vazio → deveria dar erro', false, 'Não deu erro!')
  } catch (e: any) {
    test('XML vazio → erro capturado', true)
  }

  // Teste: XML sem tags NFe
  try {
    await agent3.extractFromXML('<?xml version="1.0"?><root><data>test</data></root>', 'EMITIDA')
    test('XML sem tags NFe → deveria dar erro', false, 'Não deu erro!')
  } catch (e: any) {
    test('XML sem tags NFe → erro capturado', true)
  }

  // Teste: Validação de XML
  test('validateXML com texto comum → false', !agent3.validateXML('hello world'))
  test('validateXML com XML vazio → false', !agent3.validateXML(''))
  test('validateXML com XML sem NFe → false', !agent3.validateXML('<root></root>'))

  // ===== AGENT 4: Tax Calculator Simples =====
  console.log('\n📋 AGENT 4 - Tax Calculator Simples (Testes Extremos)')
  console.log('-'.repeat(50))

  const agent4 = new TaxCalculatorSimplesAgent()

  // Teste: Receita zero (empresa nova)
  const r4a = await agent4.calculate(0, 0, 0, 'I')
  test('Receita zero → sem erro', r4a.valor_a_pagar === 0 || r4a.valor_a_pagar >= 0)

  // Teste: Receita de 1 centavo
  const r4b = await agent4.calculate(0.01, 100, 0, 'I')
  test('Receita de R$ 0.01 → calcula sem crash', typeof r4b.valor_a_pagar === 'number')

  // Teste: Receita no limite do Simples (R$ 4.8M)
  const r4c = await agent4.calculate(400000, 4800000, 1000000, 'I')
  test('Receita no limite R$ 4.8M → calcula', r4c.valor_a_pagar > 0)

  // Teste: Receita acima do limite
  try {
    await agent4.calculate(500000, 5000000, 1000000, 'I')
    test('Receita acima do limite → deveria dar erro', false)
  } catch (e: any) {
    test('Receita acima do limite → erro capturado', e.message.includes('4.8'))
  }

  // Teste: Fator R - Anexo III com fator alto (>= 28%)
  const r4d = await agent4.calculate(50000, 600000, 200000, 'III')
  test('Fator R >= 28% → usa Anexo III', r4d.anexo === 'III')

  // Teste: Fator R - Anexo III com fator baixo (< 28%)
  const r4e = await agent4.calculate(50000, 600000, 50000, 'III')
  test('Fator R < 28% → migra para Anexo V', r4e.anexo === 'V')

  // Teste: Todos os 5 anexos
  for (const anexo of ['I', 'II', 'III', 'IV', 'V']) {
    const r = await agent4.calculate(10000, 500000, 150000, anexo)
    test(`Anexo ${anexo} → calcula corretamente`, r.valor_a_pagar > 0 && r.aliquota_efetiva > 0)
  }

  // Teste: Receita alta na 6ª faixa
  const r4f = await agent4.calculate(300000, 4000000, 1500000, 'I')
  test('6ª faixa (R$ 3.6M-4.8M) → alíquota alta', r4f.aliquota_efetiva > 5 && r4f.valor_a_pagar > 0)

  // ===== AGENT 5: Tax Calculator Presumido =====
  console.log('\n📋 AGENT 5 - Tax Calculator Presumido (Testes Extremos)')
  console.log('-'.repeat(50))

  const agent5 = new TaxCalculatorPresumidoAgent()

  // Teste: Serviços
  const r5a = await agent5.calculate(100000, 300000, 'servicos', '6201')
  test('Lucro Presumido Serviços → presunção 32%', r5a.presuncao_irpj === 32)

  // Teste: Comércio
  const r5b = await agent5.calculate(100000, 300000, 'comercio', '4711')
  test('Lucro Presumido Comércio → presunção 8%', r5b.presuncao_irpj === 8)

  // Teste: Transportes
  const r5c = await agent5.calculate(100000, 300000, 'transportes', '4930')
  test('Lucro Presumido Transportes → presunção 16%', r5c.presuncao_irpj === 16)

  // Teste: Adicional de IRPJ (base > R$ 60k no trimestre)
  const r5d = await agent5.calculate(500000, 1500000, 'servicos', '6201')
  test('IRPJ com adicional → irpj_adicional > 0', r5d.irpj_adicional > 0)

  // Teste: Sem adicional (base < R$ 60k)
  const r5e = await agent5.calculate(10000, 30000, 'comercio', '4711')
  test('IRPJ sem adicional → irpj_adicional = 0', r5e.irpj_adicional === 0)

  // ===== AGENT 6: DAS Generator =====
  console.log('\n📋 AGENT 6 - DAS Generator (Testes Extremos)')
  console.log('-'.repeat(50))

  const agent6 = new DASGeneratorAgent()

  // Teste: Gerar DAS com CNPJ formatado
  const r6a = await agent6.generateDAS({
    client_name: 'TESTE EMPRESA LTDA',
    cnpj: '12.345.678/0001-95',
    reference_month: 1,
    reference_year: 2026,
    regime: 'SIMPLES_NACIONAL',
    anexo: 'III',
    valor_total: 1500.00,
    vencimento: '2026-02-20',
    breakdown: { IRPJ: 60, CSLL: 60, COFINS: 180, PIS: 30, CPP: 645, ISS: 525 }
  })
  test('Gerar DAS PDF → arquivo criado', r6a.endsWith('.pdf'))

  // Teste: Gerar DARF
  const r6b = await agent6.generateDARF({
    client_name: 'TESTE PRESUMIDO LTDA',
    cnpj: '98765432000110',
    reference_month: 1,
    reference_year: 2026,
    valor_total: 5000,
    vencimento: '2026-02-28',
    irpj: 5000
  }, 'IRPJ')
  test('Gerar DARF IRPJ → arquivo criado', r6b.endsWith('.pdf'))

  // ===== AGENT 7: Accounting Journal =====
  console.log('\n📋 AGENT 7 - Accounting Journal (Testes Extremos)')
  console.log('-'.repeat(50))

  const agent7 = new AccountingJournalAgent()

  // Teste: Sem NFes (mês sem movimento)
  const r7a = await agent7.generateEntries([], [], { valor_a_pagar: 0 }, 1, 2026)
  test('Mês sem movimento → 1 lançamento (DAS zero)', r7a.entries.length === 1)
  test('Mês sem movimento → balanceado', r7a.balanced === true)

  // Teste: Muitas NFes
  const manyNfes = Array.from({ length: 50 }, (_, i) => ({
    nfe_date: '2026-01-15',
    nfe_number: String(i + 1),
    nfe_key: `NFe${i}`,
    total_value: 1000 + i * 100,
    valor_icms: 0,
    valor_pis: 10,
    valor_cofins: 30,
    partner_name: `Cliente ${i}`
  }))
  const r7b = await agent7.generateEntries(manyNfes, [], { valor_a_pagar: 5000 }, 1, 2026)
  test(`50 NFes → ${r7b.entries.length} lançamentos`, r7b.entries.length > 50)
  test('50 NFes → balanceado', r7b.balanced === true)

  // ===== AGENT 8: Report Generator =====
  console.log('\n📋 AGENT 8 - Report Generator (Testes Extremos)')
  console.log('-'.repeat(50))

  const agent8 = new ReportGeneratorAgent()

  // Teste: Sem dados (mês vazio)
  const r8a = await agent8.generateMonthlyReport([], [], { valor_a_pagar: 0 }, [], 1, 2026)
  test('Mês vazio → DRE com zeros', r8a.dre.receita_bruta === 0)
  test('Mês vazio → margem 0%', r8a.dre.margem_liquida === 0)
  test('Mês vazio → tem reference_month', r8a.reference_month === 1)

  // Teste: Receita alta com muita despesa (prejuízo)
  const r8b = await agent8.generateMonthlyReport(
    [{ total_value: 10000, valor_icms: 0, valor_pis: 0, valor_cofins: 0 }],
    [{ total_value: 50000 }], // Despesas maiores que receitas
    { valor_a_pagar: 600 },
    [],
    1, 2026
  )
  test('Prejuízo → lucro líquido negativo', r8b.dre.lucro_liquido < 0)
  test('Prejuízo → margem negativa', r8b.dre.margem_liquida < 0)

  // ===== AGENT 9: Balance Validator =====
  console.log('\n📋 AGENT 9 - Balance Validator (Testes Extremos)')
  console.log('-'.repeat(50))

  const agent9 = new AccountingBalanceValidator()

  // Teste: Journal vazio
  const r9a = await agent9.validate({ entries: [] })
  test('Journal vazio → APPROVED (0 entries)', r9a.status === 'APPROVED')

  // Teste: Journal sem entries
  const r9b = await agent9.validate({})
  test('Journal sem campo entries → REJECTED', r9b.status === 'REJECTED')

  // Teste: Journal null
  const r9c = await agent9.validate(null)
  test('Journal null → REJECTED', r9c.status === 'REJECTED')

  // Teste: Entry com valor zero
  const r9d = await agent9.validate({
    entries: [{ account_debit: '1.1.2.01', account_credit: '3.1.1.01', value: 0, description: 'teste' }]
  })
  test('Entry com valor zero → warning', r9d.warnings.length > 0)

  // Teste: Validação individual
  const r9e = agent9.validateSingleEntry({ account_debit: '1.1.2.01', account_credit: '3.1.1.01', value: 100 })
  test('validateSingleEntry válido → true', r9e.valid === true)

  const r9f = agent9.validateSingleEntry({ value: 100 })
  test('validateSingleEntry sem contas → false', r9f.valid === false)

  // ===== AGENT 10: Tax Consistency Validator =====
  console.log('\n📋 AGENT 10 - Tax Consistency Validator (Testes Extremos)')
  console.log('-'.repeat(50))

  const agent10 = new TaxConsistencyValidator()

  // Teste: Dados nulos
  const r10a = await agent10.validate(null, null)
  test('Dados nulos → REJECTED', r10a.status === 'REJECTED')

  // Teste: Receita com imposto zero
  const r10b = await agent10.validate(
    { emitidas: [{ nfe_key: 'k1', total_value: 50000 }], totais: { total_receita: 50000 } },
    { receita_mes: 50000, valor_a_pagar: 0 }
  )
  test('Receita R$ 50k com imposto zero → warning', r10b.warnings.length > 0)

  // Teste: NFes duplicadas
  const r10c = await agent10.validate(
    {
      emitidas: [
        { nfe_key: 'CHAVE_DUPLICADA', total_value: 5000 },
        { nfe_key: 'CHAVE_DUPLICADA', total_value: 5000 }
      ],
      totais: { total_receita: 10000 }
    },
    { receita_mes: 10000, valor_a_pagar: 600 }
  )
  test('NFes duplicadas → REJECTED', r10c.status === 'REJECTED')

  // Teste: Despesas maiores que receita
  const r10d = await agent10.validate(
    {
      emitidas: [{ nfe_key: 'k1', total_value: 5000 }],
      recebidas: [{ total_value: 20000 }],
      totais: { total_receita: 5000 }
    },
    { receita_mes: 5000, valor_a_pagar: 300 }
  )
  test('Despesas > Receita → warning de prejuízo', r10d.warnings.some(w => w.includes('prejuízo')))

  // ===== AGENT 11: Data Integrity Validator =====
  console.log('\n📋 AGENT 11 - Data Integrity Validator (Testes Extremos)')
  console.log('-'.repeat(50))

  const agent11 = new DataIntegrityValidator()

  // Teste: Mês inválido
  const r11a = await agent11.validate({
    referenceMonth: 13, referenceYear: 2026
  })
  test('Mês 13 → REJECTED', r11a.status === 'REJECTED')

  // Teste: Ano inválido
  const r11b = await agent11.validate({
    referenceMonth: 1, referenceYear: 2050
  })
  test('Ano 2050 → REJECTED', r11b.status === 'REJECTED')

  // Teste: NFe com data fora do período
  const r11c = await agent11.validate({
    nfesExtracted: {
      emitidas: [{ nfe_key: 'k1', total_value: 1000, nfe_date: '2025-06-15', nfe_number: '001' }],
      totais: { total_receita: 1000 }
    },
    taxCalculation: { valor_a_pagar: 60, receita_mes: 1000 },
    journal: { entries: [] },
    report: {
      dre: { receita_bruta: 1000, deducoes: 0, receita_liquida: 1000, custos: 0, lucro_bruto: 1000, despesas_operacionais: 0, lucro_operacional: 1000, impostos: 60, lucro_liquido: 940, margem_liquida: 94 },
      indicators: { faturamento_vs_mes_anterior: 0, margem_vs_mes_anterior: 0, impostos_percentual: 6 },
      insights: ['Teste'], reference_month: 1, reference_year: 2026
    },
    referenceMonth: 1,
    referenceYear: 2026
  })
  test('NFe com data de outro mês → warning', r11c.warnings.some(w => w.includes('fora do período')))

  // Teste: Score 100 perfeito
  const r11d = await agent11.validate({
    nfesExtracted: {
      emitidas: [{ nfe_key: 'k1', total_value: 10000, nfe_date: '2026-01-15', nfe_number: '001' }],
      totais: { total_receita: 10000 }
    },
    taxCalculation: { valor_a_pagar: 600, receita_mes: 10000 },
    journal: { entries: [{ account_debit: '1.1.2.01', account_credit: '3.1.1.01', value: 10000 }] },
    report: {
      dre: { receita_bruta: 10000, deducoes: 0, receita_liquida: 10000, custos: 0, lucro_bruto: 10000, despesas_operacionais: 0, lucro_operacional: 10000, impostos: 600, lucro_liquido: 9400, margem_liquida: 94 },
      indicators: { faturamento_vs_mes_anterior: 0, margem_vs_mes_anterior: 0, impostos_percentual: 6 },
      insights: ['Insight 1'],
      reference_month: 1,
      reference_year: 2026
    },
    referenceMonth: 1,
    referenceYear: 2026
  })
  test('Dados perfeitos → APPROVED', r11d.status === 'APPROVED')
  test('Dados perfeitos → Score >= 90', r11d.integrity_score >= 90)

  // ===== RESULTADO FINAL =====
  console.log('\n' + '='.repeat(80))
  console.log(`📊 RESULTADO DOS TESTES EXTREMOS`)
  console.log(`   ✅ Passou: ${passed}`)
  console.log(`   ❌ Falhou: ${failed}`)
  console.log(`   Total: ${passed + failed}`)
  console.log(`   Taxa: ${((passed / (passed + failed)) * 100).toFixed(1)}%`)
  console.log('='.repeat(80) + '\n')
}

main().catch(console.error)
