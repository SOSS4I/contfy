/**
 * MONTHLY PROCESSING ROUTES
 */

import express from 'express'
import multer from 'multer'
import * as path from 'path'
import * as fs from 'fs'
import * as controller from '../controllers/monthly-processing.controller'
import { authenticateToken } from '../middleware/auth.middleware'

const router = express.Router()

// Garantir que o diretório de uploads existe
const uploadsDir = path.join(__dirname, '../../uploads/documents')
fs.mkdirSync(uploadsDir, { recursive: true })

// Configurar multer para upload de arquivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + '-' + file.originalname)
  }
})

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  }
})

// ===== ROTAS =====

// Iniciar processamento mensal
router.post('/start', authenticateToken, controller.startMonthlyProcessing)

// Continuar processamento apos upload
router.post('/continue/:cycle_id', authenticateToken, controller.continueProcessing)

// Upload de documento
router.post('/upload-document/:cycle_id', authenticateToken, upload.single('file'), controller.uploadDocument)

// Download DAS PDF
router.get('/das/:cycle_id', authenticateToken, controller.downloadDAS)

// Consultar status
router.get('/status/:cycle_id', authenticateToken, controller.getProcessingStatus)

// Buscar ciclo ativo de um cliente (com documentos e requisitos)
router.get('/client/:client_id/active', authenticateToken, controller.getActiveCycle)

// Historico de ciclos completados (para pagina de impostos)
router.get('/client/:client_id/history', authenticateToken, controller.getClientHistory)

// Listar ciclos de um cliente
router.get('/client/:client_id', authenticateToken, controller.getClientCycles)

// Cancelar processamento
router.delete('/cancel/:cycle_id', authenticateToken, controller.cancelProcessing)

export default router
