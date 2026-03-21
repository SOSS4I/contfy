/**
 * Script para limpar todas as sessões de onboarding
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function clearOnboardingSessions() {
  try {
    console.log('🗑️  Limpando sessões de onboarding...')

    // Apagar classificações fiscais
    const deletedClassifications = await prisma.fiscalClassification.deleteMany({})
    console.log(`✅ ${deletedClassifications.count} classificações fiscais apagadas`)

    // Apagar pesquisas legais
    const deletedResearch = await prisma.legalResearchResult.deleteMany({})
    console.log(`✅ ${deletedResearch.count} pesquisas legais apagadas`)

    // Apagar respostas
    const deletedResponses = await prisma.onboardingResponse.deleteMany({})
    console.log(`✅ ${deletedResponses.count} respostas apagadas`)

    // Apagar sessões
    const deletedSessions = await prisma.onboardingSession.deleteMany({})
    console.log(`✅ ${deletedSessions.count} sessões apagadas`)

    console.log('🎉 Limpeza concluída!')
  } catch (error) {
    console.error('❌ Erro ao limpar:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

clearOnboardingSessions()
