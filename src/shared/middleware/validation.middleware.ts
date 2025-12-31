import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { AppError } from '../utils/app-error';

export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      }) as {
        body?: any;
        query?: any;
        params?: any;
      };
      
      // Assign transformed data back to request.
      // Avoid reassigning `req.query` directly because some environments
      // expose `query` as a getter-only property on the incoming message
      // (causing "Cannot set property query of #<IncomingMessage> which has only a getter").
      if (result.body) req.body = result.body;
      if (result.query) {
        try {
          // Try to merge validated query values into the existing object
          if (req.query && typeof req.query === 'object') {
            Object.assign(req.query as any, result.query);
          } else {
            // If req.query is not an object, set a fallback property
            (req as any).validatedQuery = result.query;
          }
        } catch (err) {
          // Fallback: attach validated query to a separate property
          (req as any).validatedQuery = result.query;
        }
      }
      if (result.params) req.params = result.params;
      
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        console.error('Validation Error Details:', JSON.stringify(error.issues, null, 2));
        const messages = error.issues.map((e: any) => `${e.path.join('.')}: ${e.message}`);
        throw new AppError(400, messages.join(', '));
      }
      next(error);
    }
  };
};

