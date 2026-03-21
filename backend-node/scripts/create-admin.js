const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function createAdmin() {
  console.log('👤 Criando usuário ADMIN...\n')

  const email = 'admin@contabilidade.com'
  const password = 'admin123' // Senha simples para desenvolvimento

  try {
    // Verificar se já existe
    const existing = await prisma.user.findUnique({
      where: { email }
    })

    if (existing) {
      // Atualizar para ADMIN
      await prisma.user.update({
        where: { email },
        data: { role: 'ADMIN' }
      })
      console.log('✅ Usuário existente atualizado para ADMIN')
      console.log(`   Email: ${email}`)
      console.log(`   Senha: ${password}`)
    } else {
      // Criar novo
      await prisma.user.create({
        data: {
          email,
          passwordHash: password, // Em produção, fazer hash
          name: 'Administrador',
          role: 'ADMIN',
          isActive: true,
          isVerified: true
        }
      })
      console.log('✅ Usuário ADMIN criado com sucesso!')
      console.log(`   Email: ${email}`)
      console.log(`   Senha: ${password}`)
    }

    console.log('\n📍 Acesse: http://localhost:3001/login')
    console.log('   Use as credenciais acima para fazer login\n')

  } catch (error) {
    console.error('❌ Erro:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

createAdmin()
