const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function createNotificationsTable() {
  console.log('📋 Criando tabela de notificações...\n')

  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS admin_notifications (
        id SERIAL PRIMARY KEY,
        client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
        session_id INTEGER REFERENCES onboarding_sessions(id) ON DELETE SET NULL,

        type VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'PENDING',

        title VARCHAR(255) NOT NULL,
        message TEXT,
        severity VARCHAR(20) NOT NULL DEFAULT 'INFO',

        regime VARCHAR(100),
        confidence_score DECIMAL(3, 2),

        contador_id INTEGER REFERENCES users(id) ON DELETE SET NULL,

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        reviewed_at TIMESTAMP,
        reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,

        contador_notes TEXT,

        CONSTRAINT admin_notifications_type_check CHECK (type IN ('READY_TO_REVIEW', 'NEEDS_ANALYSIS')),
        CONSTRAINT admin_notifications_status_check CHECK (status IN ('PENDING', 'REVIEWED', 'APPROVED', 'REJECTED'))
      );
    `)

    console.log('✅ Tabela admin_notifications criada')

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_admin_notifications_type ON admin_notifications(type);
    `)
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_admin_notifications_status ON admin_notifications(status);
    `)
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_admin_notifications_client ON admin_notifications(client_id);
    `)
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_admin_notifications_created ON admin_notifications(created_at DESC);
    `)

    console.log('✅ Índices criados')
    console.log('\n✅ Tabela de notificações pronta!\n')

  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('⚠️  Tabela já existe\n')
    } else {
      console.error('❌ Erro:', error.message)
    }
  } finally {
    await prisma.$disconnect()
  }
}

createNotificationsTable()
