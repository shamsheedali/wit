import { createLogger, Logger, format, transports } from 'winston';

const { combine, colorize, timestamp, errors, printf } = format;

const devFormat = printf(({ level, message, timestamp: ts, stack, ...meta }) => {
  const metaString = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : '';
  return `${ts} [${level}]: ${stack || message}${metaString}`;
});

export function buildDevLogger(): Logger {
  return createLogger({
    level: process.env.LOG_LEVEL || 'debug',
    format: combine(
      colorize(),
      timestamp({ format: 'HH:mm:ss' }),
      errors({ stack: true }),
      devFormat
    ),
    transports: [new transports.Console()],
  });
}
