/**
 * Script para criar perguntas padrão de onboarding
 *
 * Fluxo:
 *  1. person_type (PF/PJ/MEI) - sempre
 *  2. business_model - sempre
 *  3. company_country - somente PJ (PF e MEI são sempre Brasil)
 *  4. operation_location - sempre
 *  5. revenue_source - sempre
 *  6. payment_method - sempre
 *  7. brazil_activities - somente se empresa NÃO é brasileira
 *  8. payment_instrument_ads - somente se selecionou 'ads' em brazil_activities
 *  9. has_employees - sempre
 * 10. employee_count - somente se has_employees = true
 * 11. employee_location - somente se has_employees = true
 * 12. issues_invoices - sempre
 * 13. invoice_type - somente se issues_invoices = true
 * 14. foreign_taxes - sempre
 * 15. foreign_tax_countries - somente se foreign_taxes = true
 * 16. has_partners - somente PJ (MEI não pode ter sócio, PF não tem)
 * 17. monthly_revenue_range - sempre
 * 18. additional_info - sempre
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const questions = [
  {
    questionKey: 'person_type',
    questionText: 'Qual é o tipo de pessoa?',
    questionType: 'SELECT',
    options: JSON.stringify({
      choices: [
        { value: 'pf', label: 'Pessoa Física (PF)' },
        { value: 'pj', label: 'Pessoa Jurídica (PJ)' },
        { value: 'mei', label: 'Microempreendedor Individual (MEI)' }
      ]
    }),
    orderIndex: 1,
    isConditional: false
  },
  {
    questionKey: 'business_model',
    questionText: 'Qual é o seu modelo de negócio principal?',
    questionType: 'SELECT',
    options: JSON.stringify({
      choices: [
        { value: 'ecommerce', label: 'E-commerce / Loja Virtual' },
        { value: 'dropshipping', label: 'Dropshipping' },
        { value: 'services', label: 'Prestação de Serviços' },
        { value: 'affiliate', label: 'Marketing de Afiliados' },
        { value: 'saas', label: 'Software as a Service (SaaS)' },
        { value: 'consulting', label: 'Consultoria' },
        { value: 'freelancer', label: 'Freelancer / Autônomo' },
        { value: 'physical_store', label: 'Loja Física' },
        { value: 'industry', label: 'Indústria' },
        { value: 'other', label: 'Outro' }
      ]
    }),
    orderIndex: 2,
    isConditional: false
  },
  {
    questionKey: 'company_country',
    questionText: 'Em qual país sua empresa está registrada?',
    questionType: 'SELECT',
    options: JSON.stringify({
      choices: [
        { value: 'brazil', label: 'Brasil' },
        { value: 'usa', label: 'Estados Unidos (LLC, Corporation)' },
        { value: 'uk', label: 'Reino Unido' },
        { value: 'other', label: 'Outro país' }
      ]
    }),
    orderIndex: 3,
    isConditional: true,
    conditionLogic: JSON.stringify({
      field: 'person_type',
      operator: 'equals',
      value: 'pj'
    })
  },
  {
    questionKey: 'operation_location',
    questionText: 'Onde você opera / entrega seus produtos ou serviços?',
    questionType: 'MULTISELECT',
    options: JSON.stringify({
      choices: [
        { value: 'brazil', label: 'Brasil' },
        { value: 'usa', label: 'Estados Unidos' },
        { value: 'europe', label: 'Europa' },
        { value: 'latam', label: 'América Latina' },
        { value: 'asia', label: 'Ásia' },
        { value: 'worldwide', label: 'Mundial' }
      ]
    }),
    orderIndex: 4,
    isConditional: false
  },
  {
    questionKey: 'revenue_source',
    questionText: 'Qual é a principal origem da sua receita?',
    questionType: 'SELECT',
    options: JSON.stringify({
      choices: [
        { value: 'brazilian_customers', label: 'Clientes brasileiros (CPF/CNPJ)' },
        { value: 'foreign_customers', label: 'Clientes estrangeiros' },
        { value: 'foreign_company', label: 'Empresa estrangeira (LLC, etc)' },
        { value: 'marketplace_brazil', label: 'Marketplace brasileiro (Mercado Livre, etc)' },
        { value: 'marketplace_foreign', label: 'Marketplace estrangeiro (Amazon, eBay, etc)' },
        { value: 'mixed', label: 'Misto (Brasil + Exterior)' }
      ]
    }),
    orderIndex: 5,
    isConditional: false
  },
  {
    questionKey: 'payment_method',
    questionText: 'Como você recebe o dinheiro?',
    questionType: 'MULTISELECT',
    options: JSON.stringify({
      choices: [
        { value: 'bank_account_brazil', label: 'Conta bancária no Brasil' },
        { value: 'bank_account_foreign', label: 'Conta bancária no exterior' },
        { value: 'paypal', label: 'PayPal' },
        { value: 'stripe', label: 'Stripe' },
        { value: 'wise', label: 'Wise (TransferWise)' },
        { value: 'crypto', label: 'Criptomoedas' },
        { value: 'international_transfer', label: 'Transferência internacional' },
        { value: 'pix', label: 'PIX' },
        { value: 'other', label: 'Outro' }
      ]
    }),
    orderIndex: 6,
    isConditional: false
  },
  {
    questionKey: 'brazil_activities',
    questionText: 'Quais atividades você realiza no Brasil? (Empresa registrada no exterior)',
    questionType: 'MULTISELECT',
    options: JSON.stringify({
      choices: [
        { value: 'none', label: 'Nenhuma atividade no Brasil' },
        { value: 'ads', label: 'Anúncios pagos (Google Ads, Facebook Ads, etc)' },
        { value: 'office', label: 'Escritório / Sede' },
        { value: 'employees', label: 'Funcionários contratados' },
        { value: 'manufacturing', label: 'Fabricação / Produção' },
        { value: 'storage', label: 'Armazenagem / Estoque' },
        { value: 'shipping', label: 'Envio de produtos' },
        { value: 'customer_service', label: 'Atendimento ao cliente' },
        { value: 'other', label: 'Outras atividades' }
      ]
    }),
    orderIndex: 7,
    isConditional: true,
    conditionLogic: JSON.stringify({
      field: 'company_country',
      operator: 'not_equals',
      value: 'brazil'
    })
  },
  {
    questionKey: 'payment_instrument_ads',
    questionText: 'Como você paga os anúncios?',
    questionType: 'SELECT',
    options: JSON.stringify({
      choices: [
        { value: 'personal_card', label: 'Cartão de crédito pessoal (CPF)' },
        { value: 'corporate_card', label: 'Cartão de crédito corporativo (empresa)' },
        { value: 'bank_transfer', label: 'Transferência bancária' }
      ]
    }),
    orderIndex: 8,
    isConditional: true,
    conditionLogic: JSON.stringify({
      field: 'brazil_activities',
      operator: 'includes',
      value: 'ads'
    })
  },
  {
    questionKey: 'has_employees',
    questionText: 'Você tem funcionários registrados (CLT ou PJ)?',
    questionType: 'BOOLEAN',
    orderIndex: 9,
    isConditional: false
  },
  {
    questionKey: 'employee_count',
    questionText: 'Quantos funcionários você tem?',
    questionType: 'NUMBER',
    orderIndex: 10,
    isConditional: true,
    conditionLogic: JSON.stringify({
      field: 'has_employees',
      operator: 'equals',
      value: true
    })
  },
  {
    questionKey: 'employee_location',
    questionText: 'Onde seus funcionários estão localizados?',
    questionType: 'MULTISELECT',
    options: JSON.stringify({
      choices: [
        { value: 'brazil', label: 'Brasil' },
        { value: 'usa', label: 'Estados Unidos' },
        { value: 'other_countries', label: 'Outros países' }
      ]
    }),
    orderIndex: 11,
    isConditional: true,
    conditionLogic: JSON.stringify({
      field: 'has_employees',
      operator: 'equals',
      value: true
    })
  },
  {
    questionKey: 'issues_invoices',
    questionText: 'Você emite notas fiscais?',
    questionType: 'BOOLEAN',
    orderIndex: 12,
    isConditional: false
  },
  {
    questionKey: 'invoice_type',
    questionText: 'Qual tipo de nota fiscal você emite?',
    questionType: 'MULTISELECT',
    options: JSON.stringify({
      choices: [
        { value: 'nfe', label: 'NF-e (Nota Fiscal Eletrônica de Produto)' },
        { value: 'nfse', label: 'NFS-e (Nota Fiscal de Serviço)' },
        { value: 'nfce', label: 'NFC-e (Nota Fiscal ao Consumidor)' },
        { value: 'cte', label: 'CT-e (Conhecimento de Transporte)' },
        { value: 'other', label: 'Outro tipo' }
      ]
    }),
    orderIndex: 13,
    isConditional: true,
    conditionLogic: JSON.stringify({
      field: 'issues_invoices',
      operator: 'equals',
      value: true
    })
  },
  {
    questionKey: 'foreign_taxes',
    questionText: 'Você paga impostos em outros países?',
    questionType: 'BOOLEAN',
    orderIndex: 14,
    isConditional: false
  },
  {
    questionKey: 'foreign_tax_countries',
    questionText: 'Em quais países você paga impostos? (Liste todos)',
    questionType: 'TEXT',
    orderIndex: 15,
    isConditional: true,
    conditionLogic: JSON.stringify({
      field: 'foreign_taxes',
      operator: 'equals',
      value: true
    })
  },
  {
    questionKey: 'has_partners',
    questionText: 'Sua empresa tem sócios?',
    questionType: 'BOOLEAN',
    orderIndex: 16,
    isConditional: true,
    conditionLogic: JSON.stringify({
      field: 'person_type',
      operator: 'equals',
      value: 'pj'
    })
  },
  {
    questionKey: 'monthly_revenue_range',
    questionText: 'Qual é a sua faixa de faturamento mensal?',
    questionType: 'SELECT',
    options: JSON.stringify({
      choices: [
        { value: 'up_to_5k', label: 'Até R$ 5.000' },
        { value: '5k_to_20k', label: 'R$ 5.000 a R$ 20.000' },
        { value: '20k_to_50k', label: 'R$ 20.000 a R$ 50.000' },
        { value: '50k_to_100k', label: 'R$ 50.000 a R$ 100.000' },
        { value: '100k_to_500k', label: 'R$ 100.000 a R$ 500.000' },
        { value: 'above_500k', label: 'Acima de R$ 500.000' }
      ]
    }),
    orderIndex: 17,
    isConditional: false
  },
  {
    questionKey: 'additional_info',
    questionText: 'Há alguma informação adicional importante sobre seu negócio que devemos saber?',
    questionType: 'TEXT',
    orderIndex: 18,
    isConditional: false
  }
]

async function seedQuestions() {
  try {
    console.log('Iniciando seed de perguntas de onboarding...')

    // Verificar se já existem perguntas
    const existingCount = await prisma.onboardingQuestion.count()

    if (existingCount > 0) {
      console.log(`Ja existem ${existingCount} perguntas no banco`)
      console.log('Apagando perguntas antigas...')

      // Primeiro apagar respostas que referenciam essas perguntas
      await prisma.onboardingResponse.deleteMany({})
      await prisma.onboardingQuestion.deleteMany({})
    }

    // Criar perguntas
    for (const question of questions) {
      await prisma.onboardingQuestion.create({
        data: question
      })
    }

    console.log(`${questions.length} perguntas criadas com sucesso!`)
    console.log('Seed concluido!')

  } catch (error) {
    console.error('Erro ao criar perguntas:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

seedQuestions()
