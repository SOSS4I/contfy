const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient()

async function main() {
  // Add documents_deadline_day column (day of month when docs are due, e.g. 10 = dia 10)
  await p.$executeRawUnsafe(`
    ALTER TABLE client_accounting_config
    ADD COLUMN IF NOT EXISTS documents_deadline_day INTEGER DEFAULT 10
  `)
  console.log('Column documents_deadline_day added successfully')
  await p.$disconnect()
}

main().catch(e => { console.error(e.message); process.exit(1) })
