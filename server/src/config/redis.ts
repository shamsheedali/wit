import { createClient } from 'redis';
import logger from '../utils/logger';

const redisClient = createClient({
  url: process.env.REDIS_URL,
  password: process.env.REDIS_PASSWORD,
});

redisClient.on('error', (err) => logger.error('Redis Client Error', err));

redisClient.on('reconnecting', () =>
  logger.warn('Redis Disconnected. Reconnecting automatically...')
);

let connectPromise: Promise<void> | null = null;

export const connectRedis = async (): Promise<void> => {
  if (redisClient.isReady) return;

  if (!connectPromise) {
    connectPromise = redisClient
      .connect()
      .then(() => {
        logger.info(`Redis Connected: ${process.env.REDIS_URL}`);
      })
      .catch((error) => {
        connectPromise = null;
        logger.error('Redis connection failed:', error);
        process.exit(1);
      });
  }

  await connectPromise;
};

export default redisClient;
