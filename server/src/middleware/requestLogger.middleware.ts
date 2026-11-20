import { NextFunction, Request, Response } from 'express';
import crypto from 'crypto';
import logger from '../utils/logger';

declare module 'express-serve-static-core' {
  interface Request {
    requestId?: string;
  }
}

const IGNORED_PATHS = new Set(['/health', '/favicon.ico']);

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  // Reuse incoming request ID (from a load balancer/gateway) or generate a new one
  const requestId = (req.headers['x-request-id'] as string) || crypto.randomUUID();
  req.requestId = requestId;

  // Send it back to the client so frontend/support can reference it in bug reports
  res.setHeader('x-Request-Id', requestId);

  // 2. Skip noisy preflight and health-check logs
  if (req.method === 'OPTIONS' || IGNORED_PATHS.has(req.path)) {
    return next();
  }

  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const meta = {
      requestId,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: duration,
      ip: req.ip,
      userId: req.user?.userId || 'anonymous',
    };
    const message = `${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`;

    if (res.statusCode >= 500) {
      logger.error(message, meta);
    } else if (res.statusCode >= 400) {
      logger.warn(message, meta);
    } else {
      logger.info(message, meta);
    }
  });

  next();
};
