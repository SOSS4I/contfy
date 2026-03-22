import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/auth';

/**
 * Tipagem do payload JWT decodificado
 */
export interface AuthenticatedUser {
  id: number;
  email: string;
  role: 'contador' | 'cliente';
}

// Extender o tipo Request do Express para incluir o usuário autenticado
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

/**
 * Middleware de autenticação JWT
 * Verifica se o token é válido e adiciona o usuário ao request
 */
export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  try {
    // Pegar token do header Authorization
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token de autenticação não fornecido'
      });
    }

    // Verificar token
    const decoded = verifyToken(token) as AuthenticatedUser | null;

    if (!decoded) {
      return res.status(403).json({
        success: false,
        message: 'Token inválido ou expirado'
      });
    }

    // Adicionar usuário ao request com tipagem correta
    req.user = decoded;

    next();
  } catch (error) {
    console.error('[AUTH] Erro no middleware de autenticação:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno no servidor'
    });
  }
}

/**
 * Middleware para verificar se usuário é contador
 */
export function requireContador(req: Request, res: Response, next: NextFunction) {
  const user = req.user;

  if (!user || user.role !== 'contador') {
    return res.status(403).json({
      success: false,
      message: 'Acesso negado. Apenas contadores podem acessar este recurso.'
    });
  }

  next();
}

/**
 * Alias para requireContador — verifica se usuário tem role 'contador'
 */
export const requireContadorRole = requireContador;

/**
 * Middleware para verificar se usuário é cliente
 */
export function requireCliente(req: Request, res: Response, next: NextFunction) {
  const user = req.user;

  if (!user || user.role !== 'cliente') {
    return res.status(403).json({
      success: false,
      message: 'Acesso negado. Apenas clientes podem acessar este recurso.'
    });
  }

  next();
}

/**
 * Middleware para verificar se usuário é o dono do recurso
 */
export function requireOwner(req: Request, res: Response, next: NextFunction) {
  const user = req.user;
  const resourceId = parseInt(req.params.id || req.params.clientId);

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Não autenticado'
    });
  }

  // Contador pode acessar qualquer recurso
  if (user.role === 'contador') {
    return next();
  }

  // Cliente só pode acessar seus próprios recursos
  if (user.role === 'cliente' && user.id === resourceId) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Acesso negado. Você não tem permissão para acessar este recurso.'
  });
}

/**
 * Middleware para verificar propriedade do cliente via :clientId param.
 * Contadores têm acesso irrestrito. Clientes só acessam seus próprios dados.
 */
export function requireClienteOwnership(req: Request, res: Response, next: NextFunction) {
  const user = req.user;
  const clientId = parseInt(req.params.clientId || req.params.client_id);

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Não autenticado'
    });
  }

  // Contador pode acessar qualquer cliente
  if (user.role === 'contador') {
    return next();
  }

  // Cliente só pode acessar seus próprios dados
  if (user.role === 'cliente' && user.id === clientId) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Acesso negado. Você não tem permissão para acessar este recurso.'
  });
}
