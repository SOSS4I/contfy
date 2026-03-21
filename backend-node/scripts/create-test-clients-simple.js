const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function createTestClients() {
  console.log('👥 Criando clientes de teste...\n')

  const clients = [
    { name: 'LLC Dropshipper', email: 'llc@test.com' },
    { name: 'Trader PF', email: 'trader@test.com' },
    { name: 'SaaS Company', email: 'saas@test.com' },
    { name: 'Afiliado Digital', email: 'afiliado@test.com' },
    { name: 'Cripto Trader', email: 'cripto@test.com' }
  ]

  for (const client of clients) {
    try {
      const existing = await prisma.client.findUnique({ where: { email: client.email } })

      if (existing) {
        console.log(`⚠️  ${client.name} já existe (ID: ${existing.id})`)
      } else {
        const created = await prisma.client.create({ data: client })
        console.log(`✅ Cliente ${created.id}: ${created.name}`)
      }
    } catch (err) {
      console.log(`❌ Erro ao criar ${client.name}:`, err.message)
    }
  }

  await prisma.$disconnect()
  console.log('\n✅ Clientes criados!\n')
}

createTestClients()
