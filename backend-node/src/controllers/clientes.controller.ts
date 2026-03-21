import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { hashPassword } from '../utils/auth';

// GET /clientes - Listar clientes
export async function listarClientes(req: Request, res: Response) {
  try {
    const { page = 1, limit = 100, search, email } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    let where: any = {};

    // Filtro exato por email (para login)
    if (email) {
      where.email = email;
    }
    // Busca geral
    else if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
        { cnpj: { contains: search as string } },
      ];
    }

    const [clientes, total] = await Promise.all([
      prisma.client.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.client.count({ where }),
    ]);

    res.json({
      data: clientes,
      total,
      page: Number(page),
      per_page: Number(limit),
      total_pages: Math.ceil(total / Number(limit)),
    });
  } catch (error: any) {
    console.error('Erro ao listar clientes:', error);
    res.status(500).json({ detail: 'Erro ao listar clientes' });
  }
}

// GET /clientes/:id - Buscar cliente por ID
export async function buscarClientePorId(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const cliente = await prisma.client.findUnique({
      where: { id: Number(id) },
      include: {
        contador: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!cliente) {
      return res.status(404).json({ detail: 'Cliente não encontrado' });
    }

    res.json({ data: cliente });
  } catch (error: any) {
    console.error('Erro ao buscar cliente:', error);
    res.status(500).json({ detail: 'Erro ao buscar cliente' });
  }
}

// POST /clientes - Criar novo cliente
export async function criarCliente(req: Request, res: Response) {
  try {
    const {
      name,
      email,
      password,
      cnpj,
      cpf,
      phone,
      tax_regime = 'SIMPLES_NACIONAL',
      status = 'ativo',
      ie,
      im,
      address,
    } = req.body;

    // Validar senha obrigatória
    if (!password || password.length < 8) {
      return res.status(400).json({ detail: 'Senha deve ter no mínimo 8 caracteres' });
    }

    // Verificar se email já existe
    const emailExists = await prisma.client.findUnique({
      where: { email },
    });

    if (emailExists) {
      return res.status(400).json({ detail: 'Email já cadastrado' });
    }

    // Verificar CNPJ duplicado
    if (cnpj) {
      const cnpjExists = await prisma.client.findUnique({
        where: { cnpj },
      });
      if (cnpjExists) {
        return res.status(400).json({ detail: 'CNPJ já cadastrado' });
      }
    }

    // Hash da senha
    const passwordHash = await hashPassword(password);

    const cliente = await prisma.client.create({
      data: {
        name,
        email,
        passwordHash,
        cnpj,
        cpf,
        phone,
        taxRegime: tax_regime,
        isActive: status === 'ativo',
        ie,
        im,
        address: address || null,
      },
    });

    // Retornar sem a senha
    const { passwordHash: _, ...clienteData } = cliente;
    res.status(201).json({ data: clienteData });
  } catch (error: any) {
    console.error('Erro ao criar cliente:', error);
    res.status(500).json({ detail: 'Erro ao criar cliente' });
  }
}

// PUT /clientes/:id - Atualizar cliente (whitelist de campos)
export async function atualizarCliente(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { name, email, phone, cnpj, cpf, taxRegime, ie, im, address, razaoSocial, endereco, cidade, estado, cep, regimeTributario } = req.body;

    const allowedData: any = {};
    if (name !== undefined) allowedData.name = name;
    if (email !== undefined) allowedData.email = email;
    if (phone !== undefined) allowedData.phone = phone;
    if (cnpj !== undefined) allowedData.cnpj = cnpj;
    if (cpf !== undefined) allowedData.cpf = cpf;
    if (taxRegime !== undefined) allowedData.taxRegime = taxRegime;
    if (regimeTributario !== undefined) allowedData.regimeTributario = regimeTributario;
    if (ie !== undefined) allowedData.ie = ie;
    if (im !== undefined) allowedData.im = im;
    if (address !== undefined) allowedData.address = address;
    if (razaoSocial !== undefined) allowedData.razaoSocial = razaoSocial;
    if (endereco !== undefined) allowedData.endereco = endereco;
    if (cidade !== undefined) allowedData.cidade = cidade;
    if (estado !== undefined) allowedData.estado = estado;
    if (cep !== undefined) allowedData.cep = cep;

    const cliente = await prisma.client.update({
      where: { id: Number(id) },
      data: allowedData,
    });

    res.json({ data: cliente });
  } catch (error: any) {
    console.error('Erro ao atualizar cliente:', error);
    res.status(500).json({ detail: 'Erro ao atualizar cliente' });
  }
}

// DELETE /clientes/:id - Deletar cliente
export async function deletarCliente(req: Request, res: Response) {
  try {
    const { id } = req.params;

    await prisma.client.delete({
      where: { id: Number(id) },
    });

    res.status(204).send();
  } catch (error: any) {
    console.error('Erro ao deletar cliente:', error);
    res.status(500).json({ detail: 'Erro ao deletar cliente' });
  }
}
