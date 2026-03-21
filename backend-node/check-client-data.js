const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkClientData() {
  try {
    // ID do cliente SS NEGOCIOS DIGITAIS LTDA
    const clientId = 14;

    console.log(`\n🔍 Buscando dados do cliente ID ${clientId}...\n`);

    const cliente = await prisma.client.findUnique({
      where: { id: clientId },
      include: {
        contador: {
          select: {
            name: true,
            email: true
          }
        },
        accountingConfig: true,
        onboardingSessions: {
          include: {
            responses: {
              include: {
                question: true
              }
            },
            classification: true
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        }
      }
    });

    if (!cliente) {
      console.log('❌ Cliente não encontrado');
      return;
    }

    console.log('═══════════════════════════════════════════════════════');
    console.log(' DADOS BÁSICOS');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`Nome: ${cliente.name}`);
    console.log(`Email: ${cliente.email}`);
    console.log(`CNPJ: ${cliente.cnpj || 'Não informado'}`);
    console.log(`CPF: ${cliente.cpf || 'Não informado'}`);
    console.log(`Regime Tributário: ${cliente.regimeTributario || 'Não informado'}`);
    console.log(`CNAE Principal: ${cliente.cnaePrincipal || 'Não informado'}`);

    console.log('\n═══════════════════════════════════════════════════════');
    console.log(' ACCOUNTING CONFIG');
    console.log('═══════════════════════════════════════════════════════');
    if (cliente.accountingConfig) {
      console.log(JSON.stringify(cliente.accountingConfig, null, 2));
    } else {
      console.log('❌ Sem configuração contábil');
    }

    console.log('\n═══════════════════════════════════════════════════════');
    console.log(' ONBOARDING SESSIONS');
    console.log('═══════════════════════════════════════════════════════');
    if (cliente.onboardingSessions && cliente.onboardingSessions.length > 0) {
      const session = cliente.onboardingSessions[0];
      console.log(`\nSession ID: ${session.id}`);
      console.log(`Status: ${session.status}`);
      console.log(`\nRESPOSTAS DO ONBOARDING:`);
      console.log('─────────────────────────────────────────────────────');

      session.responses.forEach(resp => {
        const key = resp.question.questionKey;
        const value = typeof resp.responseValue === 'object'
          ? JSON.stringify(resp.responseValue)
          : resp.responseValue;
        console.log(`${key}: ${value}`);
      });

      if (session.classification) {
        console.log('\n═══════════════════════════════════════════════════════');
        console.log(' CLASSIFICAÇÃO FISCAL');
        console.log('═══════════════════════════════════════════════════════');
        console.log(JSON.stringify(session.classification, null, 2));
      }
    } else {
      console.log('❌ Nenhuma sessão de onboarding encontrada');
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkClientData();
