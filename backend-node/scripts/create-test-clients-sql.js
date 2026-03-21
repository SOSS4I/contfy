const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function createTestClients() {
  console.log('👥 Criando clientes de teste com SQL direto...\n')

  const clients = [
    { id: 16, name: 'Trader PF', email: 'trader@test.com', password: 'test123' },
    { id: 17, name: 'SaaS Company', email: 'saas@test.com', password: 'test123' },
    { id: 18, name: 'Afiliado Digital', email: 'afiliado@test.com', password: 'test123' },
    { id: 19, name: 'Cripto Trader', email: 'cripto@test.com', password: 'test123' },
    { id: 21, name: 'MEI Autônomo', email: 'mei@test.com', password: 'test123' },
    { id: 22, name: 'E-commerce PJ', email: 'ecommerce@test.com', password: 'test123' },
    { id: 23, name: 'Investidor', email: 'investidor@test.com', password: 'test123' },
    { id: 24, name: 'Dropshipper Internacional', email: 'dropship@test.com', password: 'test123' }
  ]

  for (const client of clients) {
    try {
      await prisma.$executeRaw`
        INSERT INTO clients (id, name, email, tax_regime, created_at, updated_at)
        VALUES (${client.id}, ${client.name}, ${client.email}, 'SIMPLES_NACIONAL', NOW(), NOW())
        ON CONFLICT (id) DO NOTHING
      `
      console.log(`✅ Cliente ${client.id}: ${client.name}`)
    } catch (err) {
      console.log(`❌ Erro ao criar ${client.name}:`, err.message)
    }
  }

  await prisma.$disconnect()
  console.log('\n✅ Clientes criados!\n')
}

createTestClients()
