/**
 * Script para criar um contador admin inicial com senha segura
 * Execute: npx ts-node src/scripts/create-admin-contador.ts
 */

import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../utils/auth';

const prisma = new PrismaClient();

async function createAdminContador() {
  console.log('🔐 Criando contador admin com segurança...\n');

  const adminData = {
    name: 'Contador Principal',
    email: 'contador@exemplo.com',
    password: 'Contador@2025', // SENHA FORTE - MUDE EM PRODUÇÃO!
    cpf: '12345678901',
    phone: '(11) 98765-4321',
    crc: 'CRC 123456/O-1'
  };

  try {
    // Verificar se já existe
    const existing = await prisma.contador.findUnique({
      where: { email: adminData.email }
    });

    if (existing) {
      console.log('⚠️  Contador já existe no banco de dados.');
      console.log(`   Email: ${existing.email}`);
      console.log(`   Código: ${existing.codigoContador}`);
      console.log('\n💡 Para resetar a senha, delete o registro primeiro.');
      return;
    }

    // Hash da senha
    console.log('🔒 Gerando hash bcrypt da senha...');
    const passwordHash = await hashPassword(adminData.password);

    // Gerar código único
    let codigoContador: string = '';
    let codigoExists = true;

    while (codigoExists) {
      codigoContador = Math.floor(100000 + Math.random() * 900000).toString();
      const existingCode = await prisma.contador.findUnique({
        where: { codigoContador }
      });
      codigoExists = !!existingCode;
    }

    // Criar contador
    const contador = await prisma.contador.create({
      data: {
        name: adminData.name,
        email: adminData.email,
        passwordHash,
        cpf: adminData.cpf,
        phone: adminData.phone,
        crc: adminData.crc,
        codigoContador: codigoContador!,
        status: 'ativo'
      }
    });

    console.log('\n✅ Contador admin criado com sucesso!\n');
    console.log('═'.repeat(60));
    console.log('CREDENCIAIS DE ACESSO:');
    console.log('═'.repeat(60));
    console.log(`Email:  ${adminData.email}`);
    console.log(`Senha:  ${adminData.password}`);
    console.log(`Código: ${codigoContador}`);
    console.log('═'.repeat(60));
    console.log('\n⚠️  IMPORTANTE:');
    console.log('   1. GUARDE ESSAS CREDENCIAIS EM LOCAL SEGURO');
    console.log('   2. MUDE A SENHA APÓS O PRIMEIRO LOGIN');
    console.log('   3. NÃO COMPARTILHE ESSAS INFORMAÇÕES');
    console.log('\n🔐 O sistema agora está protegido com:');
    console.log('   - Senhas com hash bcrypt (10 rounds)');
    console.log('   - Tokens JWT com expiração de 7 dias');
    console.log('   - Rate limiting (5 tentativas / 15 min)');
    console.log('   - Logs de auditoria de segurança');
    console.log('\n');

  } catch (error) {
    console.error('❌ Erro ao criar contador:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar
createAdminContador()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
