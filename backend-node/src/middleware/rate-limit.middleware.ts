import { Request, Response, NextFunction } from 'express';

// Armazenar tentativas de login por IP
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();

// Configurações
const MAX_ATTEMPTS = 5; // Máximo de tentativas
const WINDOW_MS = 15 * 60 * 1000; // 15 minutos em ms
const BLOCK_DURATION_MS = 30 * 60 * 1000; // 30 minutos bloqueado

/**
 * Rate Limiter para login
 * Previne ataques de força bruta
 */
export function loginRateLimiter(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();

  // Verificar se IP está na lista
  const attempt = loginAttempts.get(ip);

  if (attempt) {
    const timeSinceLastAttempt = now - attempt.lastAttempt;

    // Se passou o tempo de bloqueio, resetar contador
    if (timeSinceLastAttempt > BLOCK_DURATION_MS) {
      loginAttempts.delete(ip);
      return next();
    }

    // Se excedeu tentativas e ainda está no período de bloqueio
    if (attempt.count >= MAX_ATTEMPTS && timeSinceLastAttempt < BLOCK_DURATION_MS) {
      const remainingTime = Math.ceil((BLOCK_DURATION_MS - timeSinceLastAttempt) / 1000 / 60);

      console.warn(`[SECURITY] IP bloqueado por tentativas excessivas: ${ip}`);

      return res.status(429).json({
        success: false,
        message: `Muitas tentativas de login. Tente novamente em ${remainingTime} minutos.`,
        blockedUntil: new Date(attempt.lastAttempt + BLOCK_DURATION_MS).toISOString()
      });
    }

    // Se passou a janela de tempo, resetar contador
    if (timeSinceLastAttempt > WINDOW_MS) {
      loginAttempts.set(ip, { count: 1, lastAttempt: now });
      return next();
    }

    // Incrementar contador
    attempt.count += 1;
    attempt.lastAttempt = now;

    // Log de tentativa
    console.info(`[SECURITY] Tentativa de login ${attempt.count}/${MAX_ATTEMPTS} - IP: ${ip}`);

  } else {
    // Primeira tentativa deste IP
    loginAttempts.set(ip, { count: 1, lastAttempt: now });
  }

  next();
}

/**
 * Limpar tentativas antigas periodicamente
 * Deve ser chamado em um intervalo (setInterval)
 */
export function cleanupOldAttempts() {
  const now = Date.now();
  const entriesToDelete: string[] = [];

  for (const [ip, attempt] of loginAttempts.entries()) {
    if (now - attempt.lastAttempt > BLOCK_DURATION_MS) {
      entriesToDelete.push(ip);
    }
  }

  entriesToDelete.forEach(ip => loginAttempts.delete(ip));

  if (entriesToDelete.length > 0) {
    console.info(`[SECURITY] Limpou ${entriesToDelete.length} tentativas antigas do rate limiter`);
  }
}

/**
 * Rate Limiter genérico para API
 */
const apiRequests = new Map<string, { count: number; resetTime: number }>();

const API_MAX_REQUESTS = 100; // 100 requests
const API_WINDOW_MS = 60 * 1000; // por minuto

export function apiRateLimiter(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();

  const record = apiRequests.get(ip);

  if (!record) {
    apiRequests.set(ip, { count: 1, resetTime: now + API_WINDOW_MS });
    return next();
  }

  // Se passou o tempo, resetar
  if (now > record.resetTime) {
    apiRequests.set(ip, { count: 1, resetTime: now + API_WINDOW_MS });
    return next();
  }

  // Incrementar contador
  record.count += 1;

  // Se excedeu o limite
  if (record.count > API_MAX_REQUESTS) {
    const remainingTime = Math.ceil((record.resetTime - now) / 1000);

    console.warn(`[SECURITY] Rate limit excedido - IP: ${ip} - Requests: ${record.count}`);

    return res.status(429).json({
      success: false,
      message: `Limite de requisições excedido. Tente novamente em ${remainingTime} segundos.`,
      retryAfter: remainingTime
    });
  }

  // Adicionar headers de rate limit
  res.setHeader('X-RateLimit-Limit', API_MAX_REQUESTS.toString());
  res.setHeader('X-RateLimit-Remaining', (API_MAX_REQUESTS - record.count).toString());
  res.setHeader('X-RateLimit-Reset', record.resetTime.toString());

  next();
}

/**
 * Limpar registros de API antigas
 */
export function cleanupApiRequests() {
  const now = Date.now();
  const entriesToDelete: string[] = [];

  for (const [ip, record] of apiRequests.entries()) {
    if (now > record.resetTime + API_WINDOW_MS) {
      entriesToDelete.push(ip);
    }
  }

  entriesToDelete.forEach(ip => apiRequests.delete(ip));

  if (entriesToDelete.length > 0) {
    console.info(`[SECURITY] Limpou ${entriesToDelete.length} registros de API rate limiter`);
  }
}
