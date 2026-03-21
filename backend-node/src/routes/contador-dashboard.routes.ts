import { Router } from 'express';
import {
  getDashboardStats,
  getClientesPendentes,
  getPerformance,
  getAllClientes,
  getClienteById
} from '../controllers/contador-dashboard.controller';
import { authenticateToken, requireContador } from '../middleware/auth.middleware';

const router = Router();

// Todas as rotas requerem autenticação como contador
router.use(authenticateToken);
router.use(requireContador);

/**
 * Dashboard Stats
 */
router.get('/dashboard/stats', getDashboardStats);

/**
 * Clientes que precisam de atenção
 */
router.get('/dashboard/clientes-pendentes', getClientesPendentes);

/**
 * Performance do mês
 */
router.get('/dashboard/performance', getPerformance);

/**
 * Lista completa de clientes com filtros
 */
router.get('/clientes', getAllClientes);

/**
 * Detalhes de um cliente específico
 */
router.get('/clientes/:id', getClienteById);

export default router;
