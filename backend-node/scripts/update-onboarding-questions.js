/**
 * Script para atualizar perguntas do onboarding
 * Deixa mais claro para operações internacionais
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function updateQuestions() {
  try {
    console.log('🔄 Atualizando perguntas do onboarding...')

    // Atualizar pergunta de notas fiscais
    await prisma.onboardingQuestion.update({
      where: { questionKey: 'issues_invoices' },
      data: {
        questionText: 'Você emite notas fiscais BRASILEIRAS (NFe, NFSe, etc)?',
      }
    })
    console.log('✅ Pergunta "issues_invoices" atualizada')

    // Atualizar pergunta de atividades no Brasil
    await prisma.onboardingQuestion.update({
      where: { questionKey: 'brazil_activities' },
      data: {
        questionText: 'Quais atividades você realiza FISICAMENTE no Brasil?',
      }
    })
    console.log('✅ Pergunta "brazil_activities" atualizada')

    // Atualizar pergunta de método de pagamento
    await prisma.onboardingQuestion.update({
      where: { questionKey: 'payment_method' },
      data: {
        questionText: 'Como você RECEBE os pagamentos dos clientes/empresa?',
      }
    })
    console.log('✅ Pergunta "payment_method" atualizada')

    // Atualizar pergunta de atividades no Brasil com opções mais claras
    await prisma.onboardingQuestion.update({
      where: { questionKey: 'brazil_activities' },
      data: {
        options: JSON.stringify({
          choices: [
            { value: 'none', label: 'Nenhuma - Tudo é feito fora do Brasil' },
            { value: 'ads_marketing', label: 'Anúncios/Marketing (Google Ads, Facebook Ads, etc)' },
            { value: 'office', label: 'Tenho escritório/sede física' },
            { value: 'employees', label: 'Tenho funcionários CLT' },
            { value: 'manufacturing', label: 'Fabricação/Produção' },
            { value: 'storage', label: 'Armazenagem/Estoque' },
            { value: 'shipping', label: 'Envio de produtos a partir do Brasil' },
            { value: 'customer_service', label: 'Atendimento ao cliente' },
            { value: 'other', label: 'Outras atividades físicas no Brasil' }
          ]
        })
      }
    })
    console.log('✅ Opções de "brazil_activities" atualizadas')

    // Adicionar nova pergunta sobre invoices internacionais
    const existingInvoiceQuestion = await prisma.onboardingQuestion.findFirst({
      where: { questionKey: 'receives_international_invoices' }
    })

    if (!existingInvoiceQuestion) {
      await prisma.onboardingQuestion.create({
        data: {
          questionKey: 'receives_international_invoices',
          questionText: 'Você recebe invoices/faturas de fornecedores internacionais?',
          questionType: 'BOOLEAN',
          options: null,
          orderIndex: 13,
          isConditional: false,
          conditionLogic: null
        }
      })
      console.log('✅ Nova pergunta "receives_international_invoices" criada')

      // Ajustar order_index das perguntas seguintes
      await prisma.$executeRaw`
        UPDATE onboarding_questions
        SET order_index = order_index + 1
        WHERE order_index >= 13 AND question_key != 'receives_international_invoices'
      `
      console.log('✅ Ordem das perguntas ajustada')
    }

    console.log('🎉 Perguntas atualizadas com sucesso!')

  } catch (error) {
    console.error('❌ Erro ao atualizar perguntas:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

updateQuestions()
