/**
 * Script para RECRIAR todas as perguntas do onboarding
 * Versão completa e sem erros
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function recreateQuestions() {
  try {
    console.log('🗑️  Apagando perguntas antigas...')

    // Apagar respostas primeiro (FK constraint)
    await prisma.onboardingResponse.deleteMany({})
    console.log('✅ Respostas apagadas')

    // Apagar perguntas
    await prisma.onboardingQuestion.deleteMany({})
    console.log('✅ Perguntas apagadas')

    console.log('\n📝 Criando novas perguntas...\n')

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

      // 9. TEM SÓCIOS?
      {
        questionKey: 'has_partners',
        questionText: 'Você tem sócios/parceiros no negócio?',
        questionType: 'BOOLEAN',
        options: null,
        orderIndex: 9,
        isConditional: false
      },

      // 10. QUANTOS SÓCIOS
      {
        questionKey: 'partner_count',
        questionText: 'Quantos sócios você tem?',
        questionType: 'NUMBER',
        options: null,
        orderIndex: 10,
        isConditional: true,
        conditionLogic: JSON.stringify({ field: 'has_partners', operator: 'equals', value: true })
      },

      // 11. DISTRIBUIÇÃO DE LUCROS
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
        orderIndex: 11,
        isConditional: true,
        conditionLogic: JSON.stringify({ field: 'has_partners', operator: 'equals', value: true })
      },

      // 12. TEM FUNCIONÁRIOS?
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
        orderIndex: 12,
        isConditional: false
      },

      // 13. QUANTOS FUNCIONÁRIOS
      {
        questionKey: 'employee_count',
        questionText: 'Quantos funcionários você tem no total?',
        questionType: 'NUMBER',
        options: null,
        orderIndex: 13,
        isConditional: true,
        conditionLogic: JSON.stringify({ field: 'has_employees', operator: 'not_equals', value: 'no' })
      },

      // 14. EMITE NOTAS FISCAIS BRASILEIRAS?
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
        orderIndex: 14,
        isConditional: false
      },

      // 15. RECEBE INVOICES INTERNACIONAIS?
      {
        questionKey: 'receives_international_invoices',
        questionText: 'Você recebe invoices/faturas de fornecedores ou empresas no exterior?',
        questionType: 'BOOLEAN',
        options: null,
        orderIndex: 15,
        isConditional: false
      },

      // 16. ATIVIDADES FÍSICAS NO BRASIL
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
        orderIndex: 16,
        isConditional: false
      },

      // 17. GASTOS NO BRASIL
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
        orderIndex: 17,
        isConditional: false
      },

      // 18. PAGA IMPOSTOS NO EXTERIOR?
      {
        questionKey: 'pays_foreign_taxes',
        questionText: 'Você paga impostos em outros países (fora do Brasil)?',
        questionType: 'BOOLEAN',
        options: null,
        orderIndex: 18,
        isConditional: false
      },

      // 19. PREFERÊNCIA DE REGIME (SE PJ)
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
        orderIndex: 19,
        isConditional: false
      },

      // 20. INFORMAÇÕES ADICIONAIS
      {
        questionKey: 'additional_info',
        questionText: 'Descreva com suas palavras como funciona seu negócio (opcional, mas ajuda muito!)',
        questionType: 'TEXT',
        options: null,
        orderIndex: 20,
        isConditional: false
      },

      // 21. DÚVIDAS FISCAIS
      {
        questionKey: 'tax_doubts',
        questionText: 'Você tem alguma dúvida específica sobre impostos ou contabilidade? (opcional)',
        questionType: 'TEXT',
        options: null,
        orderIndex: 21,
        isConditional: false
      }
    ]

    for (const question of questions) {
      await prisma.onboardingQuestion.create({ data: question })
      console.log(`✅ ${question.orderIndex}. ${question.questionText}`)
    }

    console.log(`\n🎉 ${questions.length} perguntas criadas com sucesso!`)

  } catch (error) {
    console.error('❌ Erro:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

recreateQuestions()
