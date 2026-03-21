import { Router } from 'express'
import { authenticateToken } from '../middleware/auth.middleware'
import { enviarMensagem, getSugestoes } from '../controllers/chat.controller'

const router = Router()

// Todas as rotas requerem autenticação
router.use(authenticateToken)

router.post('/mensagem', enviarMensagem)
router.get('/sugestoes', getSugestoes)

export default router
