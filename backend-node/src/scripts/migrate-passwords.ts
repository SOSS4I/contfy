/**
 * Script para migrar clientes existentes adicionando senhas seguras
 * Execute: npx ts-node src/scripts/migrate-passwords.ts
 */

import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../utils/auth';

const prisma = new PrismaClient();

// SENHA PADRÃO TEMPORÁRIA - Clientes devem mudar no primeiro login!
const DEFAULT_PASSWORD = 'Mudar@2025';

async function migratePasswords() {
  console.log('🔐 Migrando senhas de clientes para sistema seguro...\n');

  try {
    // Buscar todos os clientes
    const clients = await prisma.client.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        passwordHash: true
      }
    });

    console.log(`📊 Encontrados ${clients.length} clientes no banco de dados\n`);

    let updated = 0;
    let skipped = 0;

    for (const client of clients) {
      // Pular se já tem senha hash válida (começa com $2b$ do bcrypt)
      if (client.passwordHash && client.passwordHash.startsWith('$2b$')) {
        console.log(`⏭️  Cliente ${client.email} já tem senha segura`);
        skipped++;
        continue;
      }

      // Gerar hash da senha padrão
      const passwordHash = await hashPassword(DEFAULT_PASSWORD);

      // Atualizar cliente
      await prisma.client.update({
        where: { id: client.id },
        data: { passwordHash }
      });

      console.log(`✅ Cliente ${client.email} - senha atualizada`);
      updated++;
    }

    console.log('\n' + '═'.repeat(60));
    console.log('RESUMO DA MIGRAÇÃO');
    console.log('═'.repeat(60));
    console.log(`Total de clientes:     ${clients.length}`);
    console.log(`Senhas atualizadas:    ${updated}`);
    console.log(`Já tinham senha:       ${skipped}`);
    console.log('═'.repeat(60));

    if (updated > 0) {
      console.log('\n⚠️  SENHA PADRÃO TEMPORÁRIA:');
      console.log(`   ${DEFAULT_PASSWORD}`);
      console.log('\n📧 AÇÃO NECESSÁRIA:');
      console.log('   1. Notifique TODOS os clientes para mudarem a senha');
      console.log('   2. Implemente fluxo de "primeiro login"');
      console.log('   3. Considere implementar reset de senha por email');
    }

    console.log('\n✅ Migração concluída com sucesso!\n');

  } catch (error) {
    console.error('❌ Erro na migração:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar
migratePasswords()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
