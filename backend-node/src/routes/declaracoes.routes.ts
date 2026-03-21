import { Router } from 'express'
import { authenticateToken, requireContador } from '../middleware/auth.middleware'
import { getDeclaracoesCliente, getTodasDeclaracoes } from '../controllers/declaracoes.controller'

const router = Router()

router.use(authenticateToken)

// Cliente busca suas próprias declarações
router.get('/minhas', getDeclaracoesCliente)

// Contador busca declarações de um cliente específico
router.get('/cliente/:clientId', requireContador, getDeclaracoesCliente)

// Contador busca todas
router.get('/all', requireContador, getTodasDeclaracoes)

export default router
