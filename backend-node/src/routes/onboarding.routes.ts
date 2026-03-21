import { Router } from 'express'
import {
  startOnboarding,
  getQuestions,
  saveResponse,
  completeOnboarding,
  getOnboardingStatus
} from '../controllers/onboarding.controller'
import { authenticateToken } from '../middleware/auth.middleware'

const router = Router()

// Iniciar nova sessao de onboarding
router.post('/start', authenticateToken, startOnboarding)

// Buscar perguntas (read-only, no auth needed)
router.get('/questions', getQuestions)

// Salvar resposta
router.post('/response', authenticateToken, saveResponse)

// Finalizar e processar com agentes de IA
router.post('/complete', authenticateToken, completeOnboarding)

// Buscar status do onboarding de um cliente
router.get('/status/:client_id', authenticateToken, getOnboardingStatus)

export default router
