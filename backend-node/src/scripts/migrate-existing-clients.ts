import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../utils/auth';

const prisma = new PrismaClient();

async function migrateExistingClients() {
  console.log('🔄 Migrando clientes existentes...\n');

  try {
    // Buscar todos os clientes
    const clients = await prisma.$queryRaw<any[]>`SELECT id, email FROM clients WHERE password_hash IS NULL OR password_hash = ''`;

    console.log(`Encontrados ${clients.length} clientes para migrar\n`);

    if (clients.length === 0) {
      console.log('✅ Nenhum cliente precisa de migração!');
      return;
    }

    // Senha padrão temporária (usuários devem redefinir)
    const defaultPassword = 'TempPassword@2025';
    const defaultHash = await hashPassword(defaultPassword);

    console.log('🔒 Gerando hash padrão para clientes existentes...');

    // Atualizar cada cliente
    for (const client of clients) {
      await prisma.$executeRaw`
        UPDATE clients
        SET password_hash = ${defaultHash}
        WHERE id = ${client.id}
      `;
      console.log(`  ✓ Cliente ${client.email || client.id} atualizado`);
    }

    console.log('\n✅ Migração concluída!');
    console.log('⚠️  IMPORTANTE: Todos os clientes existentes receberam a senha temporária: TempPassword@2025');
    console.log('⚠️  Instrua os clientes a alterarem suas senhas no primeiro acesso.\n');

  } catch (error: any) {
    console.error('❌ Erro na migração:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

migrateExistingClients()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
