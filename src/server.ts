/// <reference path="./shared/types/express.d.ts" />

import 'reflect-metadata';
import app from './app';

// Check if we're in Vercel/serverless environment
const isVercel = process.env.VERCEL || process.env.VERCEL_ENV;

if (isVercel) {
  console.log('🚀 Running in Vercel serverless environment');
} else {
  // Traditional server startup for local development
  console.log('Running in traditional environment');
}

// Export the app for Vercel serverless functions
export default app;