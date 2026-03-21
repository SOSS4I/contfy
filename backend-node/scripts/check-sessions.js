const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkSessions() {
  const sessions = await prisma.onboardingSession.findMany({
    where: { clientId: 14 },
    orderBy: { createdAt: 'desc' }
  })

  console.log(`\nSessões do cliente 14: ${sessions.length}\n`)
  sessions.forEach(s => {
    console.log(`  ID ${s.id}: ${s.status} (criada em ${s.createdAt})`)
  })

  await prisma.$disconnect()
}

checkSessions()
