const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function listClients() {
  const clients = await prisma.client.findMany({
    orderBy: { id: 'asc' }
  })

  console.log(`\n📋 Total de clientes: ${clients.length}\n`)

  clients.forEach(c => {
    console.log(`  ID ${c.id}: ${c.name} (${c.email})`)
  })

  console.log('\n')
  await prisma.$disconnect()
}

listClients()
