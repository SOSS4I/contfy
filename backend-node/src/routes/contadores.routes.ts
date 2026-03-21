import { Router } from 'express';
import {
  criarContador,
  buscarContadorPorCodigo,
  vincularClienteContador,
  atualizarContador,
  alterarSenhaContador,
} from '../controllers/contadores.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.post('/', criarContador);
router.get('/codigo/:codigo', authenticateToken, buscarContadorPorCodigo);
router.post('/vincular', authenticateToken, vincularClienteContador);
router.put('/:id', authenticateToken, atualizarContador);
router.post('/:id/change-password', authenticateToken, alterarSenhaContador);

export default router;
