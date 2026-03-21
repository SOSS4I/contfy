const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient()

async function main() {
  const cols = await p.$queryRawUnsafe("SELECT column_name FROM information_schema.columns WHERE table_name='client_accounting_config' ORDER BY ordinal_position")
  console.log('Columns:', cols.map(c => c.column_name).join(', '))
  await p.$disconnect()
}

main().catch(e => { console.error(e.message); process.exit(1) })
