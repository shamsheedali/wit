import RedisStore from 'rate-limit-redis';
import redisClient, { connectRedis } from '../config/redis';
import rateLimit from 'express-rate-limit';
import logger from '../utils/logger';
import HttpStatus from '../constants/httpStatus';

const createRedisStore = (prefix: string) => {
  return new RedisStore({
    prefix,
    sendCommand: async (...args: string[]) => {
      await connectRedis();
      return redisClient.sendCommand(args);
    },
  });
};

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore('rl:api:'),
  handler: (req, res) => {
    logger.warn('API rate limit exceeded', {
      requestId: req.requestId,
      ip: req.ip,
      url: req.originalUrl,
    });
    res.status(HttpStatus.TOO_MANY_REQUESTS).json({
      success: false,
      error: {
        message: 'Too many requests, please try again later.',
        requestId: req.requestId,
      },
    });
  },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore('rl:auth:'),
  handler: (req, res) => {
    logger.warn('Auth rate limit exceeded', {
      requestId: req.requestId,
      ip: req.ip,
      url: req.originalUrl,
    });
    res.status(HttpStatus.TOO_MANY_REQUESTS).json({
      success: false,
      error: {
        message: 'Too many authentication attempts, please try again after 15 minutes.',
        requestId: req.requestId,
      },
    });
  },
});
