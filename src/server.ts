/// <reference path="./shared/types/express.d.ts" />

import 'reflect-metadata';
import app from './app';
import { config } from './shared/config/env';
import logger from './shared/config/logger';
import sequelize, { closeDatabase, connectDatabase } from './shared/config/database';

const PORT = config.port;

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
    // Test database connection
    await connectDatabase();
    logger.info('✅ Database connected successfully');

    app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📍 Environment: ${config.nodeEnv}`);
      logger.info(`🔗 Health check: http://localhost:${PORT}/health`);
      logger.info(`📖 Swagger docs: http://localhost:${PORT}/api-docs`);
      logger.info(`💡 Running with Sequelize ORM`);
    });
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

