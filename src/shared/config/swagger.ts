import swaggerJSDoc from 'swagger-jsdoc';
import { config } from './env';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: ' Backend API',
    version: '1.0.0',
    description: 'API documentation for  Backend',
  },
  servers: [
    {
      url: `http://localhost:${config.port}/api`,
      description: 'Development server',
    },
    {
      url: `https://api-production-c186.up.railway.app/api`,
      description: 'Production server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
//   security: [
//     {
//       bearerAuth: [],
//     },
//   ],
};

const options = {
  swaggerDefinition,
  apis: ['./src/modules/**/*.routes.ts', './src/modules/**/*.controller.ts'],
};

const swaggerSpec = swaggerJSDoc(options);

export { swaggerSpec };

