import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/app-error';
import { handlePrismaError } from '../utils/sequelize-error-handler';
import logger from '../config/logger';

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Handle AppError
  if (err instanceof AppError) {
    logger.error(`AppError: ${err.message}`);
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired',
    });
  }

  // Handle Prisma errors
  if (err.constructor.name.startsWith('Prisma')) {
    try {
      handlePrismaError(err, 'Resource');
    } catch (prismaError) {
      if (prismaError instanceof AppError) {
        logger.error(`Prisma Error: ${prismaError.message}`);
        return res.status(prismaError.statusCode).json({
          success: false,
          message: prismaError.message,
        });
      }
    }
  }

  // Log unhandled errors
  logger.error('Unhandled Error:', err);

  return res.status(500).json({
    success: false,
    message: 'Internal server error',
  });
};

export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
};

