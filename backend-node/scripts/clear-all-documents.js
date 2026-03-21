/**
 * Script para apagar TODOS os documentos do Supabase
 * CUIDADO: Esta operação é irreversível!
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function clearAllDocuments() {
  try {
    console.log('🗑️  Iniciando limpeza de documentos...')

    // Contar documentos antes de apagar
    const count = await prisma.document.count()
    console.log(`📊 Total de documentos no banco: ${count}`)

    if (count === 0) {
      console.log('✅ Não há documentos para apagar')
      return
    }

    // Apagar TODOS os documentos
    const deleted = await prisma.document.deleteMany({})

    console.log(`✅ ${deleted.count} documentos apagados com sucesso!`)
    console.log('🎉 Banco de dados limpo!')
  } catch (error) {
    console.error('❌ Erro ao apagar documentos:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

clearAllDocuments()
