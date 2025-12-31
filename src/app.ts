import express, { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';

import { config } from './shared/config/env';
import { errorHandler, notFoundHandler } from './shared/middleware/error.middleware';
import { swaggerSpec } from './shared/config/swagger';
import { setupRoutes } from './routes';

const app: Application = express();

// === CRITICAL: SAFE CORS CONFIGURATION ===
const allowedOrigins = (() => {
  if (!config.cors?.origin) {
    console.warn('⚠️ CORS_ORIGIN not set – allowing all origins temporarily (NOT secure for production)');
    return [];
  }
  return config.cors.origin
    .split(',')
    .map((o: string) => o.trim())
    .filter((o: string) => o.length > 0);
})();

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser tools (Postman, curl, mobile apps)
      if (!origin) return callback(null, true);

      // If no origins configured, allow all (fallback for testing)
      if (allowedOrigins.length === 0) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Log for debugging
      console.log('❌ CORS blocked origin:', origin);
      console.log('✅ Allowed origins:', allowedOrigins);

      return callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    credentials: true, // Important for cookies/auth
  })
);

// Security
app.use(helmet());

// Rate limiting (only on API routes)
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: config.nodeEnv === 'development' ? 10000 : 200, // Reasonable prod limit
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(`${config.apiPrefix}/`, limiter);

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Compression
app.use(compression());

// Logging in development
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
}

// Health check – works even if DB fails
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is healthy',
    environment: config.nodeEnv,
    timestamp: new Date().toISOString(),
  });
});

// Swagger – will now work because app starts properly
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Static files
app.use('/samples', express.static('samples'));

// API Routes
setupRoutes(app);

// Error handlers (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

export default app;