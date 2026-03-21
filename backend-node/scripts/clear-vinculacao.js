/**
 * Script para limpar vinculação de contador de um cliente
 * Uso: node scripts/clear-vinculacao.js <client_id>
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function clearVinculacao(clientId) {
  try {
    // Atualizar cliente removendo contador_id
    const updated = await prisma.client.update({
      where: { id: parseInt(clientId) },
      data: {
        contadorId: null
      }
    })

    console.log(`✅ Vinculação removida com sucesso!`)
    console.log(`Cliente: ${updated.name} (ID: ${updated.id})`)
    console.log(`Contador anterior removido.`)
  } catch (error) {
    console.error('❌ Erro ao remover vinculação:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

// Pegar client_id do argumento ou usar 14 como padrão
const clientId = process.argv[2] || 14

console.log(`🔧 Removendo vinculação do cliente ID: ${clientId}...`)
clearVinculacao(clientId)
