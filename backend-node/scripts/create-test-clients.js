const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function createTestClients() {
  console.log('👥 Criando clientes de teste...\n')

  const clients = [
    { id: 15, name: 'E-commerce LTDA', email: 'ecommerce@test.com', password: 'test123' },
    { id: 16, name: 'LLC Dropshipper', email: 'llc@test.com', password: 'test123' },
    { id: 17, name: 'Trader PF', email: 'trader@test.com', password: 'test123' },
    { id: 18, name: 'SaaS Company', email: 'saas@test.com', password: 'test123' },
    { id: 19, name: 'Afiliado Digital', email: 'afiliado@test.com', password: 'test123' },
    { id: 20, name: 'Cripto Trader', email: 'cripto@test.com', password: 'test123' }
  ]

  for (const client of clients) {
    try {
      await prisma.client.upsert({
        where: { id: client.id },
        update: {},
        create: client
      })
      console.log(`✅ Cliente ${client.id}: ${client.name}`)
    } catch (err) {
      console.log(`⚠️  Cliente ${client.id} já existe`)
    }
  }

  await prisma.$disconnect()
  console.log('\n✅ Clientes criados!\n')
}

createTestClients()
