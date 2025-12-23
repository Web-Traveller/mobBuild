import * as dotenv from 'dotenv';
import { logger } from './utils/logger';

dotenv.config();

function main(): void {
  logger.info('Starting mobBuild - AI-powered web app builder');
  logger.info(`Node version: ${process.version}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);

  logger.info('Project initialized successfully');
  logger.info('Ready for development...');
}

try {
  main();
} catch (error) {
  logger.error('Fatal error:', error);
  process.exit(1);
}
