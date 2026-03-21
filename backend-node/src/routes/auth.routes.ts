import { Router } from 'express';
import {
  loginContador,
  loginCliente,
  loginGeneric,
  registerContador,
  registerCliente,
  verifyTokenEndpoint,
  resetPasswordCliente,
  setPasswordCliente
} from '../controllers/auth.controller';
import { loginRateLimiter } from '../middleware/rate-limit.middleware';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

/**
 * ROTAS DE AUTENTICAÇÃO
 */

// Login Genérico (detecta tipo de usuário)
router.post('/login', loginRateLimiter, loginGeneric);

// Login Contador (COM RATE LIMITING)
router.post('/contador/login', loginRateLimiter, loginContador);

// Login Cliente (COM RATE LIMITING)
router.post('/cliente/login', loginRateLimiter, loginCliente);

// Registro Contador
router.post('/contador/register', registerContador);

// Registro Cliente
router.post('/cliente/register', registerCliente);

// Verificar token (rota protegida)
router.get('/verify', authenticateToken, verifyTokenEndpoint);

// Redefinir senha do cliente
router.post('/cliente/reset-password', resetPasswordCliente);

// Definir senha para clientes existentes (sem senha)
router.post('/cliente/set-password', setPasswordCliente);

export default router;
