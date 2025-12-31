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

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      // Allow localhost with any port
      if (origin.startsWith('http://localhost:')) return callback(null, true);
      // Allow specific origins if needed
      if (origin === 'http://localhost:3000' || origin === 'http://localhost:5173') return callback(null, true);
      // Allow production domains
      if (origin === 'https://api-production-c186.up.railway.app/api/' || origin === 'https://api-production-c186.up.railway.app') return callback(null, true);
      if (origin === 'https://api-production-c186.up.railway.app' || origin === 'https://api-production-c186.up.railway.app') return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: config.nodeEnv === 'development' ? 10000 : 100000, // Higher limit for dev
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(`${config.apiPrefix}/`, limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Compression
app.use(compression());

// Logging
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
}

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Static files for sample downloads
app.use('/samples', express.static('samples'));

// Setup routes
setupRoutes(app);

// Error handlers
app.use(notFoundHandler);
app.use(errorHandler);

export default app;

