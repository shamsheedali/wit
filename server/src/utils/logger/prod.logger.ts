import { createLogger, format, transports, Logger } from 'winston';

const { combine, timestamp, errors, json } = format;

export function buildProdLogger(): Logger {
  return createLogger({
    level: process.env.LOG_LEVEL || 'info',
    defaultMeta: { service: 'wit-backend' },
    format: combine(timestamp(), errors({ stack: true }), json()),
    transports: [
      new transports.Console(),
      new transports.File({ filename: 'logs/error.log', level: 'error' }),
    ],
  });
}
