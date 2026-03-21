import { Router } from 'express'
import {
  getNotifications,
  reviewNotification,
  getNotificationDetails,
  getPendingCount
} from '../controllers/admin.controller'
import { authenticateToken, requireContador } from '../middleware/auth.middleware'

const router = Router()

// Contar pendentes (antes de :id para nao conflitar)
router.get('/notifications/pending-count', authenticateToken, requireContador, getPendingCount)

// Listar notificacoes
router.get('/notifications', authenticateToken, requireContador, getNotifications)

// Detalhes de uma notificacao
router.get('/notifications/:id', authenticateToken, requireContador, getNotificationDetails)

// Revisar notificacao
router.post('/notifications/:id/review', authenticateToken, requireContador, reviewNotification)

export default router
