import { Router } from 'express';
import {
  listarClientes,
  buscarClientePorId,
  criarCliente,
  atualizarCliente,
  deletarCliente,
} from '../controllers/clientes.controller';
import { authenticateToken, requireContador } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticateToken, requireContador, listarClientes);
router.get('/:id', authenticateToken, requireContador, buscarClientePorId);
router.post('/', authenticateToken, requireContador, criarCliente);
router.put('/:id', authenticateToken, requireContador, atualizarCliente);
router.delete('/:id', authenticateToken, requireContador, deletarCliente);

export default router;
