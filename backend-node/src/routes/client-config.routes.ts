import express from 'express'
import { saveAccountingConfig, getAccountingConfig, updateAccountingConfig } from '../controllers/client-config.controller'
import { authenticateToken } from '../middleware/auth.middleware'

const router = express.Router()

// Salvar configuracao contabil do cliente
router.post('/:clientId/accounting-config', authenticateToken, saveAccountingConfig)

// Atualizar configuracao contabil do cliente
router.put('/:clientId/accounting-config', authenticateToken, updateAccountingConfig)

// Buscar configuracao contabil do cliente
router.get('/:clientId/accounting-config', authenticateToken, getAccountingConfig)

export default router
