/// <reference path="./shared/types/express.d.ts" />

import 'reflect-metadata';
import app from './app';
import { config } from './shared/config/env';
import logger from './shared/config/logger';
import sequelize, { closeDatabase, connectDatabase } from './shared/config/database';

// Check if we're in Vercel/serverless environment
const isVercel = process.env.VERCEL || process.env.VERCEL_ENV;

// For Vercel serverless functions, export the app directly
if (isVercel) {
  logger.info('🚀 Running in Vercel serverless environment');

  // Initialize database connection for serverless
  connectDatabase().then(() => {
    logger.info('✅ Database connected successfully in serverless environment');
  }).catch((error) => {
    logger.error('❌ Database connection failed in serverless environment:', error);
  });

  // Export the app for Vercel
  module.exports = app;
} else {
  // Traditional server startup for local development
  const PORT = Number(process.env.PORT) || config.port || 3000;

  console.log('DEBUG: process.env.PORT =', process.env.PORT);
  console.log('DEBUG: config.port =', config.port);
  console.log('DEBUG: Final PORT =', PORT);
  console.log('DEBUG: typeof PORT =', typeof PORT);

  // Graceful shutdown
  const gracefulShutdown = async () => {
    logger.info('Received shutdown signal, closing server gracefully...');
    await closeDatabase();
    process.exit(0);
  };

  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);

  // Start server
  if (!PORT || isNaN(PORT)) {
    console.error('❌ ERROR: PORT is invalid!', PORT);
    process.exit(1);
  }

  const startServer = async () => {
    try {
      await connectDatabase();
      logger.info('✅ Database connected successfully');

      app.listen(PORT, '0.0.0.0', () => {
        logger.info(`🚀 Server running on http://0.0.0.0:${PORT}`);
        logger.info(`📍 Environment: ${config.nodeEnv}`);
        logger.info(`🔗 Public URL: https://api-production-c186.up.railway.app/`);
      });
    } catch (error) {
      logger.error('❌ Failed to start server:', error);
      process.exit(1);
    }
  };

  startServer();
}