import { Logger } from 'winston';
import { buildDevLogger } from './dev.logger';
import { buildProdLogger } from './prod.logger';

const isProduction = process.env.NODE_ENV === 'production';

const logger: Logger = isProduction ? buildProdLogger() : buildDevLogger();

export default logger;
