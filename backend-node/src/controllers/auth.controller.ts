import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { hashPassword, verifyPassword, generateToken } from '../utils/auth';

/**
 * LOGIN SEGURO - Contador
 * POST /api/v1/auth/contador/login
 */
export async function loginContador(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    // Validação de input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email e senha são obrigatórios'
      });
    }

    // Buscar contador no banco
    const contador = await prisma.contador.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!contador) {
      // Não revelar se o email existe ou não (segurança)
      return res.status(401).json({
        success: false,
        message: 'Email ou senha inválidos'
      });
    }

    // Verificar se contador está ativo
    if (contador.status !== 'ativo') {
      return res.status(403).json({
        success: false,
        message: 'Conta inativa. Entre em contato com o administrador.'
      });
    }

    // Verificar senha
    const senhaValida = await verifyPassword(password, contador.passwordHash);

    if (!senhaValida) {
      // Log de tentativa de login falhada (auditoria)
      console.warn(`[SECURITY] Tentativa de login falhada para contador: ${email} - IP: ${req.ip}`);

      return res.status(401).json({
        success: false,
        message: 'Email ou senha inválidos'
      });
    }

    // Gerar token JWT
    const token = generateToken({
      id: contador.id,
      email: contador.email,
      role: 'contador'
    });

    // Atualizar último login
    await prisma.contador.update({
      where: { id: contador.id },
      data: { updatedAt: new Date() }
    });

    // Log de sucesso (auditoria)
    console.info(`[AUTH] Login bem-sucedido - Contador: ${email} - IP: ${req.ip}`);

    // Retornar dados do usuário (SEM a senha!)
    return res.status(200).json({
      success: true,
      message: 'Login realizado com sucesso',
      data: {
        token,
        user: {
          id: contador.id,
          name: contador.name,
          email: contador.email,
          phone: contador.phone,
          crc: contador.crc,
          codigoContador: contador.codigoContador,
          role: 'contador'
        }
      }
    });

  } catch (error: any) {
    console.error('[AUTH] Erro no login do contador:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno no servidor'
    });
  }
}

/**
 * LOGIN SEGURO - Cliente
 * POST /api/v1/auth/cliente/login
 */
export async function loginCliente(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    // Validação de input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email e senha são obrigatórios'
      });
    }

    // Buscar cliente no banco
    const cliente = await prisma.client.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        contador: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        }
      }
    });

    if (!cliente) {
      // Não revelar se o email existe ou não (segurança)
      return res.status(401).json({
        success: false,
        message: 'Email ou senha inválidos'
      });
    }

    // Verificar senha
    const senhaValida = await verifyPassword(password, cliente.passwordHash || '');

    if (!senhaValida) {
      // Log de tentativa de login falhada (auditoria)
      console.warn(`[SECURITY] Tentativa de login falhada para cliente: ${email} - IP: ${req.ip}`);

      return res.status(401).json({
        success: false,
        message: 'Email ou senha inválidos'
      });
    }

    // Gerar token JWT
    const token = generateToken({
      id: cliente.id,
      email: cliente.email,
      role: 'cliente'
    });

    // Atualizar último login
    await prisma.client.update({
      where: { id: cliente.id },
      data: { updatedAt: new Date() }
    });

    // Log de sucesso (auditoria)
    console.info(`[AUTH] Login bem-sucedido - Cliente: ${email} - IP: ${req.ip}`);

    // Retornar dados do usuário (SEM a senha!)
    return res.status(200).json({
      success: true,
      message: 'Login realizado com sucesso',
      data: {
        token,
        user: {
          id: cliente.id,
          name: cliente.name || cliente.razaoSocial,
          email: cliente.email,
          cnpj: cliente.cnpj,
          phone: cliente.phone,
          regimeTributario: cliente.regimeTributario,
          role: 'cliente',
          contador: cliente.contador
        }
      }
    });

  } catch (error: any) {
    console.error('[AUTH] Erro no login do cliente:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno no servidor'
    });
  }
}

/**
 * REGISTRO SEGURO - Contador
 * POST /api/v1/auth/contador/register
 */
export async function registerContador(req: Request, res: Response) {
  try {
    const { name, email, password, phone, cpf, crc } = req.body;

    // Validação de input
    if (!name || !email || !password || !cpf) {
      return res.status(400).json({
        success: false,
        message: 'Campos obrigatórios: name, email, password, cpf'
      });
    }

    // Validar força da senha
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'A senha deve ter no mínimo 8 caracteres'
      });
    }

    // Verificar se email já existe
    const existingEmail = await prisma.contador.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message: 'Email já cadastrado no sistema'
      });
    }

    // Verificar se CPF já existe
    const existingCPF = await prisma.contador.findUnique({
      where: { cpf }
    });

    if (existingCPF) {
      return res.status(409).json({
        success: false,
        message: 'CPF já cadastrado no sistema'
      });
    }

    // Hash da senha
    const passwordHash = await hashPassword(password);

    // Gerar código único do contador
    let codigoContador: string = '';
    let codigoExists = true;

    while (codigoExists) {
      codigoContador = Math.floor(100000 + Math.random() * 900000).toString();
      const existing = await prisma.contador.findUnique({
        where: { codigoContador }
      });
      codigoExists = !!existing;
    }

    // Criar contador no banco
    const contador = await prisma.contador.create({
      data: {
        name,
        email: email.toLowerCase(),
        passwordHash,
        phone,
        cpf,
        crc,
        codigoContador: codigoContador!,
        status: 'ativo'
      }
    });

    // Log de auditoria
    console.info(`[AUTH] Novo contador registrado: ${email} - Código: ${codigoContador} - IP: ${req.ip}`);

    // Gerar token JWT
    const token = generateToken({
      id: contador.id,
      email: contador.email,
      role: 'contador'
    });

    return res.status(201).json({
      success: true,
      message: 'Contador cadastrado com sucesso',
      data: {
        token,
        user: {
          id: contador.id,
          name: contador.name,
          email: contador.email,
          phone: contador.phone,
          crc: contador.crc,
          codigoContador: contador.codigoContador,
          role: 'contador'
        }
      }
    });

  } catch (error: any) {
    console.error('[AUTH] Erro no registro do contador:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno no servidor'
    });
  }
}

/**
 * REGISTRO SEGURO - Cliente
 * POST /api/v1/auth/cliente/register
 */
export async function registerCliente(req: Request, res: Response) {
  try {
    const {
      name,
      razaoSocial,
      email,
      password,
      cnpj,
      phone,
      regimeTributario,
      endereco,
      cidade,
      estado,
      cep
    } = req.body;

    // Validação de input
    if (!email || !password || !cnpj) {
      return res.status(400).json({
        success: false,
        message: 'Campos obrigatórios: email, password, cnpj'
      });
    }

    // Validar força da senha
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'A senha deve ter no mínimo 8 caracteres'
      });
    }

    // Verificar se email já existe
    const existingEmail = await prisma.client.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message: 'Email já cadastrado no sistema'
      });
    }

    // Verificar se CNPJ já existe
    const existingCNPJ = await prisma.client.findUnique({
      where: { cnpj }
    });

    if (existingCNPJ) {
      return res.status(409).json({
        success: false,
        message: 'CNPJ já cadastrado no sistema'
      });
    }

    // Hash da senha
    const passwordHash = await hashPassword(password);

    // Criar cliente no banco
    const cliente = await prisma.client.create({
      data: {
        name,
        razaoSocial,
        email: email.toLowerCase(),
        passwordHash,
        cnpj,
        phone,
        regimeTributario,
        endereco,
        cidade,
        estado,
        cep
      }
    });

    // Log de auditoria
    console.info(`[AUTH] Novo cliente registrado: ${email} - CNPJ: ${cnpj} - IP: ${req.ip}`);

    // Gerar token JWT
    const token = generateToken({
      id: cliente.id,
      email: cliente.email,
      role: 'cliente'
    });

    return res.status(201).json({
      success: true,
      message: 'Cliente cadastrado com sucesso',
      data: {
        token,
        user: {
          id: cliente.id,
          name: cliente.name || cliente.razaoSocial,
          email: cliente.email,
          cnpj: cliente.cnpj,
          phone: cliente.phone,
          regimeTributario: cliente.regimeTributario,
          role: 'cliente'
        }
      }
    });

  } catch (error: any) {
    console.error('[AUTH] Erro no registro do cliente:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno no servidor'
    });
  }
}

/**
 * VERIFICAR TOKEN JWT
 * GET /api/v1/auth/verify
 */
export async function verifyTokenEndpoint(req: Request, res: Response) {
  try {
    // O middleware já validou o token, usuário está em req.user
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido'
      });
    }

    return res.status(200).json({
      success: true,
      data: { user }
    });

  } catch (error: any) {
    console.error('[AUTH] Erro ao verificar token:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno no servidor'
    });
  }
}

/**
 * REDEFINIR SENHA - Cliente
 * POST /api/v1/auth/cliente/reset-password
 *
 * Se o cliente já possui senha, requer `current_password` para confirmação.
 * Se ainda não possui senha (novo usuário), comporta-se como set-password.
 */
export async function resetPasswordCliente(req: Request, res: Response) {
  try {
    const { email, newPassword, current_password } = req.body;

    // Validação de input
    if (!email || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email e nova senha são obrigatórios'
      });
    }

    // Validar força da senha
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'A senha deve ter no mínimo 8 caracteres'
      });
    }

    // Buscar cliente no banco
    const cliente = await prisma.client.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!cliente) {
      // Resposta genérica para não revelar se email existe
      return res.status(404).json({
        success: false,
        message: 'Email não encontrado no sistema'
      });
    }

    // Se o cliente já possui senha, verificar a senha atual obrigatoriamente
    if (cliente.passwordHash) {
      if (!current_password) {
        return res.status(400).json({
          success: false,
          message: 'Senha atual é obrigatória para redefinir a senha'
        });
      }

      const senhaAtualValida = await verifyPassword(current_password, cliente.passwordHash);
      if (!senhaAtualValida) {
        console.warn(`[SECURITY] Tentativa de reset de senha com senha incorreta - Cliente: ${email} - IP: ${req.ip}`);
        return res.status(401).json({
          success: false,
          message: 'Senha atual incorreta'
        });
      }
    }
    // Se não possui senha, permite definir diretamente (comportamento de set-password)

    // Hash da nova senha
    const passwordHash = await hashPassword(newPassword);

    // Atualizar senha
    await prisma.client.update({
      where: { id: cliente.id },
      data: { passwordHash }
    });

    console.info(`[AUTH] Senha redefinida - Cliente: ${email} - IP: ${req.ip}`);

    return res.status(200).json({
      success: true,
      message: 'Senha redefinida com sucesso! Você já pode fazer login.'
    });

  } catch (error: any) {
    console.error('[AUTH] Erro ao redefinir senha:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno no servidor'
    });
  }
}

/**
 * DEFINIR SENHA PARA CLIENTES EXISTENTES (sem senha)
 * POST /api/v1/auth/cliente/set-password
 */
export async function setPasswordCliente(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    // Validação de input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email e senha são obrigatórios'
      });
    }

    // Validar força da senha
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'A senha deve ter no mínimo 8 caracteres'
      });
    }

    // Buscar cliente no banco
    const cliente = await prisma.client.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!cliente) {
      return res.status(404).json({
        success: false,
        message: 'Email não encontrado no sistema'
      });
    }

    // Verificar se já tem senha
    if (cliente.passwordHash) {
      return res.status(400).json({
        success: false,
        message: 'Este usuário já possui senha. Use a opção de redefinir senha.'
      });
    }

    // Hash da senha
    const passwordHash = await hashPassword(password);

    // Definir senha
    await prisma.client.update({
      where: { id: cliente.id },
      data: { passwordHash }
    });

    console.info(`[AUTH] Senha definida - Cliente: ${email} - IP: ${req.ip}`);

    return res.status(200).json({
      success: true,
      message: 'Senha definida com sucesso! Você já pode fazer login.'
    });

  } catch (error: any) {
    console.error('[AUTH] Erro ao definir senha:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno no servidor'
    });
  }
}

/**
 * LOGIN GENÉRICO - Detecta se é contador ou cliente
 * POST /api/v1/auth/login
 */
export async function loginGeneric(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email e senha são obrigatórios'
      });
    }

    const emailLower = email.toLowerCase();

    // Tentar como contador primeiro
    let contador: any = null;
    try {
      contador = await prisma.contador.findUnique({ where: { email: emailLower } });
    } catch (dbError: any) {
      console.error('[AUTH] Erro de banco no login:', dbError?.message);
      return res.status(500).json({ success: false, message: 'Erro interno no servidor' });
    }

    if (contador && contador.status === 'ativo') {
      const senhaValida = await verifyPassword(password, contador.passwordHash);
      if (senhaValida) {
        const token = generateToken({ id: contador.id, email: contador.email, role: 'contador' });
        await prisma.contador.update({ where: { id: contador.id }, data: { updatedAt: new Date() } });
        return res.status(200).json({
          success: true,
          message: 'Login realizado com sucesso',
          data: {
            token,
            user: {
              id: contador.id, name: contador.name, email: contador.email,
              phone: contador.phone, crc: contador.crc,
              codigoContador: contador.codigoContador, role: 'contador'
            }
          }
        });
      }
    }

    // Tentar como cliente
    let cliente: any = null;
    try {
      cliente = await prisma.client.findUnique({
        where: { email: emailLower },
        include: { contador: { select: { id: true, name: true, email: true, phone: true } } }
      });
    } catch (dbError: any) {
      console.error('[AUTH] Erro de banco no login:', dbError?.message);
      return res.status(500).json({ success: false, message: 'Erro interno no servidor' });
    }

    if (cliente) {
      const senhaValida = await verifyPassword(password, cliente.passwordHash || '');
      if (senhaValida) {
        const token = generateToken({ id: cliente.id, email: cliente.email, role: 'cliente' });
        await prisma.client.update({ where: { id: cliente.id }, data: { updatedAt: new Date() } });
        return res.status(200).json({
          success: true,
          message: 'Login realizado com sucesso',
          data: {
            token,
            user: {
              id: cliente.id, name: cliente.name || cliente.razaoSocial, email: cliente.email,
              cnpj: cliente.cnpj, phone: cliente.phone,
              regimeTributario: cliente.regimeTributario, role: 'cliente',
              contador: cliente.contador
            }
          }
        });
      }
    }

    return res.status(401).json({ success: false, message: 'Email ou senha inválidos' });

  } catch (error: any) {
    console.error('[AUTH/login] Erro inesperado:', error?.message, error);
    return res.status(500).json({ success: false, message: 'Erro interno no servidor' });
  }
}
