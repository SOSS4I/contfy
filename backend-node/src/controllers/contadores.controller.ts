import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { hashPassword, generateUniqueCode } from '../utils/auth';

// POST /contadores - Criar contador
export async function criarContador(req: Request, res: Response) {
  try {
    const { name, email, phone, cpf, password } = req.body;

    // Verificar se email já existe
    const emailExists = await prisma.contador.findUnique({
      where: { email },
    });

    if (emailExists) {
      return res.status(400).json({ detail: 'Email já cadastrado' });
    }

    // Gerar código único
    let codigo = generateUniqueCode();
    let codeExists = await prisma.contador.findUnique({
      where: { codigoContador: codigo },
    });

    // Tentar até 10 vezes para gerar código único
    let attempts = 0;
    while (codeExists && attempts < 10) {
      codigo = generateUniqueCode();
      codeExists = await prisma.contador.findUnique({
        where: { codigoContador: codigo },
      });
      attempts++;
    }

    if (codeExists) {
      return res.status(500).json({ detail: 'Erro ao gerar código único' });
    }

    // Hash da senha
    const passwordHash = await hashPassword(password);

    // Criar contador
    const contador = await prisma.contador.create({
      data: {
        name,
        email,
        phone,
        cpf,
        passwordHash,
        codigoContador: codigo,
        status: 'ativo',
      },
    });

    // Não retornar o hash da senha
    const { passwordHash: _, ...contadorSemSenha } = contador;

    res.status(201).json(contadorSemSenha);
  } catch (error: any) {
    console.error('Erro ao criar contador:', error);
    res.status(500).json({ detail: 'Erro ao criar contador' });
  }
}

// GET /contadores/codigo/:codigo - Buscar contador por código
export async function buscarContadorPorCodigo(req: Request, res: Response) {
  try {
    const { codigo } = req.params;

    const contador = await prisma.contador.findUnique({
      where: { codigoContador: codigo },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        cpf: true,
        codigoContador: true,
        status: true,
        createdAt: true,
      },
    });

    if (!contador) {
      return res.status(404).json({ detail: 'Contador não encontrado' });
    }

    res.json(contador);
  } catch (error: any) {
    console.error('Erro ao buscar contador:', error);
    res.status(500).json({ detail: 'Erro ao buscar contador' });
  }
}

// PUT /contadores/:id - Atualizar perfil do contador
export async function atualizarContador(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { name, email, phone } = req.body;

    const contador = await prisma.contador.findUnique({
      where: { id: Number(id) },
    });

    if (!contador) {
      return res.status(404).json({ detail: 'Contador não encontrado' });
    }

    if (email && email !== contador.email) {
      const emailExists = await prisma.contador.findUnique({ where: { email } });
      if (emailExists) {
        return res.status(400).json({ detail: 'Email já cadastrado' });
      }
    }

    const updated = await prisma.contador.update({
      where: { id: Number(id) },
      data: {
        ...(name && { name }),
        ...(email && { email }),
        ...(phone !== undefined && { phone }),
      },
      select: {
        id: true, name: true, email: true, phone: true,
        codigoContador: true,
      },
    });

    res.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Erro ao atualizar contador:', error);
    res.status(500).json({ detail: 'Erro ao atualizar contador' });
  }
}

// POST /contadores/:id/change-password - Alterar senha do contador
export async function alterarSenhaContador(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return res.status(400).json({ detail: 'Senha atual e nova são obrigatórias' });
    }

    if (new_password.length < 6) {
      return res.status(400).json({ detail: 'Nova senha deve ter pelo menos 6 caracteres' });
    }

    const contador = await prisma.contador.findUnique({
      where: { id: Number(id) },
    });

    if (!contador || !contador.passwordHash) {
      return res.status(404).json({ detail: 'Contador não encontrado' });
    }

    const { verifyPassword } = require('../utils/auth');
    const isValid = await verifyPassword(current_password, contador.passwordHash);
    if (!isValid) {
      return res.status(400).json({ detail: 'Senha atual incorreta' });
    }

    const newHash = await hashPassword(new_password);
    await prisma.contador.update({
      where: { id: Number(id) },
      data: { passwordHash: newHash },
    });

    res.json({ success: true, message: 'Senha alterada com sucesso' });
  } catch (error: any) {
    console.error('Erro ao alterar senha:', error);
    res.status(500).json({ detail: 'Erro ao alterar senha' });
  }
}

// POST /contadores/vincular - Vincular cliente ao contador
export async function vincularClienteContador(req: Request, res: Response) {
  try {
    const client_id = req.query.client_id || req.body.client_id;
    const codigo_contador = req.body.codigo_contador;

    if (!client_id) {
      return res.status(400).json({ detail: 'client_id é obrigatório' });
    }

    if (!codigo_contador) {
      return res.status(400).json({ detail: 'codigo_contador é obrigatório' });
    }

    // Buscar contador pelo código (na tabela contadores, onde Client.contadorId FK aponta)
    const contador = await prisma.contador.findUnique({
      where: {
        codigoContador: codigo_contador,
      },
    });

    if (!contador) {
      return res.status(404).json({ detail: 'Contador não encontrado' });
    }

    // Verificar se cliente existe
    const client = await prisma.client.findUnique({
      where: { id: Number(client_id) },
    });

    if (!client) {
      return res.status(404).json({ detail: 'Cliente não encontrado' });
    }

    // Vincular cliente ao contador
    await prisma.client.update({
      where: { id: Number(client_id) },
      data: { contadorId: contador.id },
    });

    res.json({
      message: 'Cliente vinculado ao contador com sucesso',
      contador: {
        id: contador.id,
        name: contador.name,
        email: contador.email,
      },
    });
  } catch (error: any) {
    console.error('Erro ao vincular cliente:', error);
    res.status(500).json({ detail: 'Erro ao vincular cliente ao contador' });
  }
}
