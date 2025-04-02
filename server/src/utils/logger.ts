import { createLogger, format, transports } from 'winston';

const { combine, label, timestamp, printf } = format;
// Ensure this path exists or adjust it as needed
const LOG_FILE_PATH = 'logs/error.log';

const logFormat = printf(({ level, message, label: logLabel, timestamp: logTimestamp }) => {
  return `${logTimestamp} [${logLabel}] ${level}: ${message}`;
});

const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(label({ label: process.env.NODE_ENV || 'development' }), timestamp(), logFormat),
  transports: [new transports.File({ filename: LOG_FILE_PATH, level: 'error' })],
});

if (process.env.NODE_ENV !== 'production') {
  logger.remove(new transports.File({ filename: LOG_FILE_PATH, level: 'error' }));
  logger.add(new transports.Console());
}

export default logger;
