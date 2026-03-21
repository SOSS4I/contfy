const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkClients() {
  const clients = await prisma.client.findMany({
    where: { id: { in: [14, 15, 16, 17, 18, 19, 20] } },
    select: { id: true, name: true, email: true }
  })

  console.log(`\nClientes encontrados: ${clients.length}/7\n`)
  clients.forEach(c => console.log(`  ID ${c.id}: ${c.name} (${c.email})`))

  const missing = [14, 15, 16, 17, 18, 19, 20].filter(id => !clients.find(c => c.id === id))
  if (missing.length > 0) {
    console.log(`\nFaltam: ${missing.join(', ')}`)
  }

  await prisma.$disconnect()
}

checkClients()
