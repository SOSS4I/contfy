import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../utils/auth';

const prisma = new PrismaClient();

async function createSpecificAdmin() {
  console.log('🔐 Criando conta admin específica...\n');

  const adminData = {
    name: 'Contador Principal Admin',
    email: 'admin@contabilidade.com',
    password: 'Admin@Contabil2025',
    cpf: '00011122233',
    phone: '(11) 99999-0000',
    crc: 'CRC 123456/O-1',
    codigoContador: '019796'
  };

  try {
    // Verificar se já existe
    const existing = await prisma.contador.findUnique({
      where: { email: adminData.email }
    });

    if (existing) {
      console.log('✅ Contador admin já existe!');
      console.log(`   Email: ${existing.email}`);
      console.log(`   Código: ${existing.codigoContador}\n`);
      return existing;
    }

    // Hash da senha
    console.log('🔒 Gerando hash bcrypt da senha...');
    const passwordHash = await hashPassword(adminData.password);

    // Criar contador
    const contador = await prisma.contador.create({
      data: {
        name: adminData.name,
        email: adminData.email,
        passwordHash,
        cpf: adminData.cpf,
        phone: adminData.phone,
        crc: adminData.crc,
        codigoContador: adminData.codigoContador,
        status: 'ativo'
      }
    });

    console.log('\n✅ Contador admin criado com sucesso!\n');
    console.log('═'.repeat(60));
    console.log('CREDENCIAIS DE ACESSO:');
    console.log('═'.repeat(60));
    console.log(`Nome:   ${adminData.name}`);
    console.log(`Email:  ${adminData.email}`);
    console.log(`Senha:  ${adminData.password}`);
    console.log(`Código: ${adminData.codigoContador}`);
    console.log('═'.repeat(60));
    console.log('\n📝 Credenciais salvas em: CREDENCIAIS_ADMIN.md\n');

    return contador;

  } catch (error: any) {
    console.error('❌ Erro ao criar contador:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createSpecificAdmin()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
