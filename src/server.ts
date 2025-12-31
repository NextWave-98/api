/// <reference path="./shared/types/express.d.ts" />

import 'reflect-metadata';
import app from './app';
import { config } from './shared/config/env';
import logger from './shared/config/logger';
import sequelize, { closeDatabase, connectDatabase } from './shared/config/database';

const PORT = Number(process.env.PORT) || config.port || 3000;

// Graceful shutdown
const gracefulShutdown = async () => {
  logger.info('Received shutdown signal, closing server gracefully...');

  await closeDatabase();
  process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start server
const startServer = async () => {
  try {
    await connectDatabase();
    logger.info('✅ Database connected successfully');

    app.listen(PORT, '0.0.0.0', () => {
      logger.info(`🚀 Server running on http://0.0.0.0:${PORT}`);
      logger.info(`📍 Environment: ${config.nodeEnv}`);
      logger.info(`🔗 Health check: https://api-production-456e.up.railway.app/health`);
      logger.info(`📖 Swagger docs:https://api-production-456e.up.railway.app/api-docs`);
    });
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();