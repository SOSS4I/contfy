const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
});

async function testConnection() {
  console.log('🔍 Testando conexão com o banco de dados...\n');

  try {
    console.log('⏳ Tentando conectar...');

    // Teste 1: Conexão básica
    await prisma.$connect();
    console.log('✅ Conexão estabelecida com sucesso!\n');

    // Teste 2: Query simples
    console.log('⏳ Executando query de teste...');
    const result = await prisma.$queryRaw`SELECT NOW() as current_time, version() as version`;
    console.log('✅ Query executada com sucesso!');
    console.log('   Hora do servidor:', result[0].current_time);
    console.log('   Versão PostgreSQL:', result[0].version.split(' ')[1], '\n');

    // Teste 3: Contar tabelas
    console.log('⏳ Verificando tabelas...');
    const clients = await prisma.client.count();
    const contadores = await prisma.contador.count();
    console.log('✅ Tabelas acessíveis!');
    console.log(`   - Clientes: ${clients}`);
    console.log(`   - Contadores: ${contadores}\n`);

    console.log('🎉 TUDO FUNCIONANDO PERFEITAMENTE!\n');

  } catch (error) {
    console.error('❌ ERRO NA CONEXÃO:\n');

    if (error.message.includes("Can't reach database")) {
      console.error('💡 PROBLEMA: Não consegue alcançar o servidor do banco');
      console.error('   Possíveis causas:');
      console.error('   1. Projeto Supabase pausado/inativo');
      console.error('   2. Firewall bloqueando conexão');
      console.error('   3. IP bloqueado nas configurações do Supabase');
      console.error('   4. Internet instável\n');
      console.error('   Solução: Acesse https://supabase.com/dashboard');
      console.error('   e verifique se o projeto está ATIVO (verde)\n');
    } else if (error.message.includes('password authentication failed')) {
      console.error('💡 PROBLEMA: Senha incorreta');
      console.error('   Solução: Verifique a senha no .env\n');
    } else {
      console.error('   Erro:', error.message, '\n');
    }

    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
