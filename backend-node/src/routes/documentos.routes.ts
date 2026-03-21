import { Router } from 'express';
import {
  listarDocumentos,
  buscarDocumentoPorId,
  criarDocumento,
  deletarDocumento,
  getEstatisticas,
} from '../controllers/documentos.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticateToken, listarDocumentos);
router.get('/estatisticas', authenticateToken, getEstatisticas);
router.get('/:id', authenticateToken, buscarDocumentoPorId);
router.post('/', authenticateToken, criarDocumento);
router.delete('/:id', authenticateToken, deletarDocumento);

export default router;
