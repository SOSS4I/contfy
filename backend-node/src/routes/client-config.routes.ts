import express from 'express'
import { saveAccountingConfig, getAccountingConfig, updateAccountingConfig } from '../controllers/client-config.controller'
import { authenticateToken, requireClienteOwnership } from '../middleware/auth.middleware'

const router = express.Router()

// Salvar configuracao contabil do cliente (somente o próprio cliente ou contador)
router.post('/:clientId/accounting-config', authenticateToken, requireClienteOwnership, saveAccountingConfig)

// Atualizar configuracao contabil do cliente (somente o próprio cliente ou contador)
router.put('/:clientId/accounting-config', authenticateToken, requireClienteOwnership, updateAccountingConfig)

// Buscar configuracao contabil do cliente (somente o próprio cliente ou contador)
router.get('/:clientId/accounting-config', authenticateToken, requireClienteOwnership, getAccountingConfig)

export default router
