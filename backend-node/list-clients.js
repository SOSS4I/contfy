const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function listClients() {
  try {
    console.log('📋 Listando todos os clientes do banco de dados...\n');

    const clients = await prisma.client.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true
      },
      orderBy: {
        id: 'asc'
      }
    });

    console.log(`Total de clientes: ${clients.length}\n`);

    if (clients.length === 0) {
      console.log('❌ Nenhum cliente encontrado no banco de dados');
    } else {
      console.log('Clientes cadastrados:');
      console.log('═══════════════════════════════════════════════════════');
      clients.forEach(client => {
        console.log(`ID: ${client.id} | Nome: ${client.name || 'Sem nome'} | Email: ${client.email}`);
        console.log(`   Criado em: ${client.createdAt.toLocaleString('pt-BR')}`);
        console.log('───────────────────────────────────────────────────────');
      });
    }

  } catch (error) {
    console.error('❌ Erro ao listar clientes:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

listClients();
