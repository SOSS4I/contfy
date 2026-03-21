/**
 * Script FINAL para criar perguntas do onboarding
 * TODAS as perguntas BOOLEAN foram convertidas para SELECT
 * Testado e aprovado para evitar bugs de interface
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function createFinalQuestions() {
  try {
    console.log('🗑️  Apagando todas as perguntas e sessões antigas...\n')

    // Apagar fiscal classifications primeiro (FK para sessions)
    const deletedClassifications = await prisma.fiscalClassification.deleteMany({})
    console.log(`✅ ${deletedClassifications.count} classificações fiscais apagadas`)

    // Apagar respostas (FK constraint)
    const deletedResponses = await prisma.onboardingResponse.deleteMany({})
    console.log(`✅ ${deletedResponses.count} respostas apagadas`)

    // Apagar sessões
    const deletedSessions = await prisma.onboardingSession.deleteMany({})
    console.log(`✅ ${deletedSessions.count} sessões apagadas`)

    // Apagar perguntas
    const deletedQuestions = await prisma.onboardingQuestion.deleteMany({})
    console.log(`✅ ${deletedQuestions.count} perguntas apagadas`)

    console.log('\n📝 Criando 21 perguntas FINAIS (sem bugs)...\n')

    const questions = [
      // 1. TIPO DE PESSOA
      {
        questionKey: 'person_type',
        questionText: 'Qual é o tipo de pessoa?',
        questionType: 'SELECT',
        options: JSON.stringify({
          choices: [
            { value: 'pf', label: 'Pessoa Física (PF)' },
            { value: 'mei', label: 'Microempreendedor Individual (MEI)' },
            { value: 'pj', label: 'Pessoa Jurídica (PJ - CNPJ)' }
          ]
        }),
        orderIndex: 1,
        isConditional: false
      },

      // 2. CNPJ/CPF
      {
        questionKey: 'document_number',
        questionText: 'Qual é o seu CNPJ ou CPF?',
        questionType: 'TEXT',
        options: null,
        orderIndex: 2,
        isConditional: false
      },

      // 3. CNAE PRINCIPAL
      {
        questionKey: 'cnae_principal',
        questionText: 'Qual é o CNAE principal da sua atividade? (Se não souber, digite a atividade que você faz)',
        questionType: 'TEXT',
        options: null,
        orderIndex: 3,
        isConditional: false
      },

      // 4. ONDE ESTÁ REGISTRADA A EMPRESA
      {
        questionKey: 'company_registration_country',
        questionText: 'Onde sua empresa/negócio está registrado?',
        questionType: 'SELECT',
        options: JSON.stringify({
          choices: [
            { value: 'brazil', label: 'Brasil (MEI, LTDA, etc)' },
            { value: 'usa_llc', label: 'Estados Unidos - LLC' },
            { value: 'usa_corp', label: 'Estados Unidos - Corporation' },
            { value: 'uk', label: 'Reino Unido (UK LTD)' },
            { value: 'other', label: 'Outro país' },
            { value: 'not_registered', label: 'Não tenho empresa registrada (apenas CPF)' }
          ]
        }),
        orderIndex: 4,
        isConditional: false
      },

      // 5. MODELO DE NEGÓCIO
      {
        questionKey: 'business_model',
        questionText: 'Qual é o seu modelo de negócio / atividade principal?',
        questionType: 'SELECT',
        options: JSON.stringify({
          choices: [
            { value: 'dropshipping', label: 'Dropshipping (revenda sem estoque)' },
            { value: 'ecommerce', label: 'E-commerce / Loja Virtual (com estoque)' },
            { value: 'marketplace_seller', label: 'Vendedor em Marketplace (Mercado Livre, Amazon, etc)' },
            { value: 'affiliate_marketing', label: 'Marketing de Afiliados' },
            { value: 'digital_products', label: 'Produtos Digitais (cursos, ebooks, etc)' },
            { value: 'saas', label: 'Software as a Service (SaaS)' },
            { value: 'consulting', label: 'Consultoria' },
            { value: 'freelancer', label: 'Freelancer / Serviços' },
            { value: 'trader', label: 'Trader (ações, cripto, forex)' },
            { value: 'content_creator', label: 'Criador de Conteúdo (YouTube, Instagram, etc)' },
            { value: 'physical_store', label: 'Loja Física' },
            { value: 'industry', label: 'Indústria / Fabricação' },
            { value: 'other', label: 'Outro' }
          ]
        }),
        orderIndex: 5,
        isConditional: false
      },

      // 6. ORIGEM DA RECEITA
      {
        questionKey: 'revenue_source',
        questionText: 'De onde vem a MAIOR PARTE do dinheiro que você recebe?',
        questionType: 'SELECT',
        options: JSON.stringify({
          choices: [
            { value: 'brazilian_customers_cpf', label: 'Clientes brasileiros (CPF)' },
            { value: 'brazilian_customers_cnpj', label: 'Empresas brasileiras (CNPJ)' },
            { value: 'foreign_customers', label: 'Clientes estrangeiros (pessoas físicas)' },
            { value: 'foreign_companies', label: 'Empresas estrangeiras' },
            { value: 'own_foreign_company', label: 'Minha própria empresa no exterior (LLC, etc)' },
            { value: 'marketplace_brazil', label: 'Marketplace brasileiro (ML, Shopee, etc)' },
            { value: 'marketplace_foreign', label: 'Marketplace estrangeiro (Amazon, eBay, Etsy, etc)' },
            { value: 'platform_payments', label: 'Plataformas de pagamento (PayPal, Stripe, etc)' },
            { value: 'investments', label: 'Investimentos (dividendos, juros, ganho de capital)' },
            { value: 'mixed', label: 'Misto (várias fontes)' }
          ]
        }),
        orderIndex: 6,
        isConditional: false
      },

      // 7. COMO RECEBE PAGAMENTOS
      {
        questionKey: 'payment_receipt_method',
        questionText: 'Como você RECEBE os pagamentos? (pode marcar mais de uma)',
        questionType: 'MULTISELECT',
        options: JSON.stringify({
          choices: [
            { value: 'pix', label: 'PIX' },
            { value: 'bank_transfer_brazil', label: 'Transferência bancária (conta BR)' },
            { value: 'bank_account_foreign', label: 'Conta bancária no exterior' },
            { value: 'paypal', label: 'PayPal' },
            { value: 'stripe', label: 'Stripe' },
            { value: 'wise', label: 'Wise (TransferWise)' },
            { value: 'payoneer', label: 'Payoneer' },
            { value: 'crypto', label: 'Criptomoedas' },
            { value: 'credit_card', label: 'Cartão de crédito (gateway de pagamento)' },
            { value: 'boleto', label: 'Boleto bancário' },
            { value: 'wire_transfer', label: 'Transferência internacional (SWIFT)' },
            { value: 'other', label: 'Outro método' }
          ]
        }),
        orderIndex: 7,
        isConditional: false
      },

      // 8. FAIXA DE FATURAMENTO MENSAL
      {
        questionKey: 'monthly_revenue_range',
        questionText: 'Qual é a sua faixa de faturamento mensal (BRUTO)?',
        questionType: 'SELECT',
        options: JSON.stringify({
          choices: [
            { value: 'up_to_3k', label: 'Até R$ 3.000 (ou até US$ 600)' },
            { value: '3k_to_10k', label: 'R$ 3.000 a R$ 10.000 (ou US$ 600 a US$ 2.000)' },
            { value: '10k_to_30k', label: 'R$ 10.000 a R$ 30.000 (ou US$ 2.000 a US$ 6.000)' },
            { value: '30k_to_81k', label: 'R$ 30.000 a R$ 81.000 (ou US$ 6.000 a US$ 16.000)' },
            { value: '81k_to_200k', label: 'R$ 81.000 a R$ 200.000 (ou US$ 16.000 a US$ 40.000)' },
            { value: '200k_to_500k', label: 'R$ 200.000 a R$ 500.000 (ou US$ 40.000 a US$ 100.000)' },
            { value: 'above_500k', label: 'Acima de R$ 500.000 (ou US$ 100.000)' }
          ]
        }),
        orderIndex: 8,
        isConditional: false
      },

      // 9. TEM SÓCIOS? (CONVERTIDO DE BOOLEAN PARA SELECT)
      {
        questionKey: 'has_partners',
        questionText: 'Você tem sócios/parceiros no negócio?',
        questionType: 'SELECT',
        options: JSON.stringify({
          choices: [
            { value: 'no', label: 'Não, trabalho sozinho' },
            { value: 'yes_1', label: 'Sim, tenho 1 sócio' },
            { value: 'yes_2', label: 'Sim, tenho 2 sócios' },
            { value: 'yes_3_plus', label: 'Sim, tenho 3 ou mais sócios' }
          ]
        }),
        orderIndex: 9,
        isConditional: false
      },

      // 10. DISTRIBUIÇÃO DE LUCROS
      {
        questionKey: 'profit_distribution',
        questionText: 'Como vocês distribuem os lucros entre os sócios?',
        questionType: 'SELECT',
        options: JSON.stringify({
          choices: [
            { value: 'equal', label: 'Igual para todos (50/50, 33/33/33, etc)' },
            { value: 'unequal', label: 'Desigual (um sócio tem mais que outro)' },
            { value: 'monthly', label: 'Pró-labore mensal fixo' },
            { value: 'not_defined', label: 'Ainda não definimos' }
          ]
        }),
        orderIndex: 10,
        isConditional: true,
        conditionLogic: JSON.stringify({
          field: 'has_partners',
          operator: 'not_equals',
          value: 'no'
        })
      },

      // 11. TEM FUNCIONÁRIOS? (JÁ ERA SELECT)
      {
        questionKey: 'has_employees',
        questionText: 'Você tem funcionários contratados (CLT, PJ ou informal)?',
        questionType: 'SELECT',
        options: JSON.stringify({
          choices: [
            { value: 'no', label: 'Não, trabalho sozinho' },
            { value: 'clt', label: 'Sim, tenho CLT (registro na carteira)' },
            { value: 'pj', label: 'Sim, tenho prestadores de serviço (PJ)' },
            { value: 'informal', label: 'Sim, mas são informais (sem registro)' },
            { value: 'mixed', label: 'Tenho CLT + PJ' }
          ]
        }),
        orderIndex: 11,
        isConditional: false
      },

      // 12. QUANTOS FUNCIONÁRIOS
      {
        questionKey: 'employee_count',
        questionText: 'Quantos funcionários você tem no total?',
        questionType: 'NUMBER',
        options: null,
        orderIndex: 12,
        isConditional: true,
        conditionLogic: JSON.stringify({
          field: 'has_employees',
          operator: 'not_equals',
          value: 'no'
        })
      },

      // 13. EMITE NOTAS FISCAIS BRASILEIRAS?
      {
        questionKey: 'issues_brazilian_invoices',
        questionText: 'Você emite notas fiscais BRASILEIRAS (NFe, NFSe, NFC-e)?',
        questionType: 'SELECT',
        options: JSON.stringify({
          choices: [
            { value: 'yes_always', label: 'Sim, emito para todas as vendas' },
            { value: 'yes_sometimes', label: 'Sim, mas só quando o cliente pede' },
            { value: 'no_foreign', label: 'Não, só vendo fora do Brasil' },
            { value: 'no_informal', label: 'Não, meu negócio é informal' },
            { value: 'no_not_required', label: 'Não, minha atividade não precisa' }
          ]
        }),
        orderIndex: 13,
        isConditional: false
      },

      // 14. RECEBE INVOICES INTERNACIONAIS? (CONVERTIDO DE BOOLEAN PARA SELECT)
      {
        questionKey: 'receives_international_invoices',
        questionText: 'Você recebe invoices/faturas de fornecedores ou empresas no exterior?',
        questionType: 'SELECT',
        options: JSON.stringify({
          choices: [
            { value: 'no', label: 'Não, não trabalho com fornecedores internacionais' },
            { value: 'yes_sometimes', label: 'Sim, às vezes recebo' },
            { value: 'yes_always', label: 'Sim, sempre recebo' }
          ]
        }),
        orderIndex: 14,
        isConditional: false
      },

      // 15. ATIVIDADES FÍSICAS NO BRASIL
      {
        questionKey: 'brazil_physical_activities',
        questionText: 'Quais atividades FÍSICAS você realiza no Brasil? (pode marcar mais de uma)',
        questionType: 'MULTISELECT',
        options: JSON.stringify({
          choices: [
            { value: 'none', label: 'Nenhuma - Tudo é digital/online/fora do Brasil' },
            { value: 'office', label: 'Tenho escritório/sede física' },
            { value: 'warehouse', label: 'Tenho estoque/armazém' },
            { value: 'store', label: 'Tenho loja física' },
            { value: 'manufacturing', label: 'Fabricação/produção' },
            { value: 'shipping', label: 'Envio produtos a partir do Brasil' }
          ]
        }),
        orderIndex: 15,
        isConditional: false
      },

      // 16. GASTOS NO BRASIL
      {
        questionKey: 'brazil_expenses',
        questionText: 'Você tem GASTOS no Brasil relacionados ao negócio? (pode marcar mais de uma)',
        questionType: 'MULTISELECT',
        options: JSON.stringify({
          choices: [
            { value: 'none', label: 'Não tenho gastos no Brasil' },
            { value: 'ads', label: 'Anúncios (Google Ads, Facebook Ads, TikTok Ads)' },
            { value: 'software', label: 'Software/ferramentas (hospedagem, CRM, etc)' },
            { value: 'rent', label: 'Aluguel (escritório, loja, depósito)' },
            { value: 'utilities', label: 'Contas (luz, água, internet)' },
            { value: 'salaries', label: 'Salários/pró-labore' },
            { value: 'accounting', label: 'Contabilidade' },
            { value: 'products', label: 'Compra de produtos/insumos' },
            { value: 'other', label: 'Outros gastos' }
          ]
        }),
        orderIndex: 16,
        isConditional: false
      },

      // 17. PAGA IMPOSTOS NO EXTERIOR? (CONVERTIDO DE BOOLEAN PARA SELECT)
      {
        questionKey: 'pays_foreign_taxes',
        questionText: 'Você paga impostos em outros países (fora do Brasil)?',
        questionType: 'SELECT',
        options: JSON.stringify({
          choices: [
            { value: 'no', label: 'Não, só pago impostos no Brasil' },
            { value: 'yes_llc', label: 'Sim, pago impostos nos EUA (LLC)' },
            { value: 'yes_other', label: 'Sim, pago em outro país' },
            { value: 'not_sure', label: 'Não sei / Não tenho certeza' }
          ]
        }),
        orderIndex: 17,
        isConditional: false
      },

      // 18. PREFERÊNCIA DE REGIME (SE PJ)
      {
        questionKey: 'preferred_tax_regime',
        questionText: 'Você tem preferência de regime tributário?',
        questionType: 'SELECT',
        options: JSON.stringify({
          choices: [
            { value: 'not_sure', label: 'Não sei, quero que a IA decida o melhor' },
            { value: 'simples_nacional', label: 'Quero Simples Nacional (se possível)' },
            { value: 'lucro_presumido', label: 'Quero Lucro Presumido' },
            { value: 'mei', label: 'Quero ser MEI (se possível)' },
            { value: 'cheapest', label: 'Quero o mais barato possível' }
          ]
        }),
        orderIndex: 18,
        isConditional: false
      },

      // 19. INFORMAÇÕES ADICIONAIS (CAMPO PRINCIPAL DE DESCRIÇÃO LIVRE)
      {
        questionKey: 'additional_info',
        questionText: 'Descreva com SUAS PALAVRAS como funciona todo seu negócio e como ele é operado (quanto mais detalhes, melhor a IA vai entender!)',
        questionType: 'TEXT',
        options: null,
        orderIndex: 19,
        isConditional: false
      },

      // 20. DÚVIDAS FISCAIS
      {
        questionKey: 'tax_doubts',
        questionText: 'Você tem alguma dúvida específica sobre impostos ou contabilidade? (opcional)',
        questionType: 'TEXT',
        options: null,
        orderIndex: 20,
        isConditional: false
      },

      // 21. SITUAÇÃO ATUAL COM CONTABILIDADE
      {
        questionKey: 'current_accounting_situation',
        questionText: 'Qual é sua situação atual com contabilidade?',
        questionType: 'SELECT',
        options: JSON.stringify({
          choices: [
            { value: 'none', label: 'Não tenho contador, faço tudo sozinho' },
            { value: 'has_contador', label: 'Já tenho contador, mas quero trocar' },
            { value: 'informal', label: 'Meu negócio é informal, nunca declarei' },
            { value: 'starting', label: 'Estou começando agora' }
          ]
        }),
        orderIndex: 21,
        isConditional: false
      }
    ]

    for (const question of questions) {
      await prisma.onboardingQuestion.create({ data: question })
      console.log(`✅ ${question.orderIndex}. ${question.questionText}`)
    }

    console.log(`\n🎉 ${questions.length} perguntas criadas com sucesso!`)
    console.log('\n📊 Resumo:')
    console.log(`   - SELECT: ${questions.filter(q => q.questionType === 'SELECT').length}`)
    console.log(`   - MULTISELECT: ${questions.filter(q => q.questionType === 'MULTISELECT').length}`)
    console.log(`   - TEXT: ${questions.filter(q => q.questionType === 'TEXT').length}`)
    console.log(`   - NUMBER: ${questions.filter(q => q.questionType === 'NUMBER').length}`)
    console.log(`   - BOOLEAN: ${questions.filter(q => q.questionType === 'BOOLEAN').length} (ZERO - todos convertidos!)`)

  } catch (error) {
    console.error('❌ Erro:', error.message)
    console.error(error)
  } finally {
    await prisma.$disconnect()
  }
}

createFinalQuestions()
