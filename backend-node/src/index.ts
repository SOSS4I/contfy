// Load environment variables FIRST, before any other imports
import dotenv from 'dotenv';
dotenv.config();

// Now import other modules
import express, { Request, Response } from 'express';
import cors from 'cors';
import clientesRoutes from './routes/clientes.routes';
import contadoresRoutes from './routes/contadores.routes';
import documentosRoutes from './routes/documentos.routes';
import onboardingRoutes from './routes/onboarding.routes';
import adminRoutes from './routes/admin.routes';
import clientConfigRoutes from './routes/client-config.routes';
import monthlyProcessingRoutes from './routes/monthly-processing.routes';
import authRoutes from './routes/auth.routes';
import contadorDashboardRoutes from './routes/contador-dashboard.routes';
import chatRoutes from './routes/chat.routes';
import declaracoesRoutes from './routes/declaracoes.routes';
import { startMonthlyCron } from './services/cron/monthly-processing.cron';
import { cleanupOldAttempts, cleanupApiRequests, apiRateLimiter } from './middleware/rate-limit.middleware';
import helmet from 'helmet';

const app = express();
const PORT = process.env.PORT || 8000;

// Security headers
app.use(helmet());

// CORS
const CORS_ORIGINS = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:3000', 'http://localhost:3001'];

app.use(cors({
  origin: (origin, callback) => {
    // Permite requests sem origin (mobile, Postman, etc.)
    if (!origin) return callback(null, true);
    // Permite qualquer subdomínio do Vercel deste projeto
    if (origin.endsWith('.vercel.app')) return callback(null, true);
    // Permite origens configuradas manualmente
    if (CORS_ORIGINS.includes(origin)) return callback(null, true);
    // Permite localhost
    if (origin.startsWith('http://localhost')) return callback(null, true);
    console.warn('[CORS] Origem bloqueada:', origin);
    callback(new Error('CORS: origem não permitida'));
  },
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Global API rate limiting
app.use('/api/', apiRateLimiter);

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/api/v1/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'Contabilidade AI - Node Backend',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use('/api/v1/auth', authRoutes); // Auth routes (login, register)
app.use('/api/v1/contador', contadorDashboardRoutes); // Contador dashboard (protegido)
app.use('/api/v1/clientes', clientesRoutes);
app.use('/api/v1/clients', clientConfigRoutes);
app.use('/api/v1/contadores', contadoresRoutes);
app.use('/api/v1/documentos', documentosRoutes);
app.use('/api/v1/onboarding', onboardingRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/monthly-processing', monthlyProcessingRoutes);
app.use('/api/v1/chat', chatRoutes);
app.use('/api/v1/declaracoes', declaracoesRoutes);

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    service: 'Contabilidade AI - Node Backend',
    version: '1.0.0',
    status: 'running',
    docs: '/api/v1/health',
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// Error handler (includes JSON parse errors, payload too large, etc.)
app.use((err: any, req: Request, res: Response, next: any) => {
  // Handle JSON parse errors gracefully
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'JSON malformado no corpo da requisição',
    });
  }

  // Handle payload too large
  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      error: 'Payload Too Large',
      message: 'O corpo da requisição excede o limite de 10MB',
    });
  }

  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message || 'An unexpected error occurred',
  });
});

// Start server
app.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log('🚀 Contabilidade AI - Node.js Backend');
  console.log('='.repeat(60));
  console.log(`✓ Server running on http://localhost:${PORT}`);
  console.log(`✓ Health check: http://localhost:${PORT}/api/v1/health`);
  console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('='.repeat(60));

  // Iniciar CRON job para processamento mensal automático
  console.log('\n⏰ Iniciando CRON jobs...');
  startMonthlyCron();

  // Iniciar limpeza periódica de rate limiters (a cada 30 minutos)
  console.log('🔒 Iniciando limpeza de rate limiters...');
  setInterval(() => {
    cleanupOldAttempts();
    cleanupApiRequests();
  }, 30 * 60 * 1000); // 30 minutos

  console.log('✓ Sistema de segurança ativado');
  console.log('  - Rate limiting para login: 5 tentativas / 15 min');
  console.log('  - Rate limiting API: 100 requests / minuto');
  console.log('  - Autenticação JWT com bcrypt');
  console.log('='.repeat(60));
});

export default app;
