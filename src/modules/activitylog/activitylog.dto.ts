import { z } from 'zod';

export const createActivityLogSchema = z.object({
  body: z.object({
    action: z.string().min(1, 'Action is required'),
    module: z.string().min(1, 'Module is required'),
    recordId: z.string().optional().nullable(),
    details: z.any().optional().nullable(),
  }),
});

export const activityLogQuerySchema = z.object({
  query: z.object({
    page: z.string().optional().default('1'),
    limit: z.string().optional().default('10'),
    userId: z.string().uuid().optional(),
    action: z.string().optional(),
    module: z.string().optional(),
    fromDate: z.string().optional(),
    toDate: z.string().optional(),
  }),
});

export type CreateActivityLogDTO = z.infer<typeof createActivityLogSchema>['body'];
export type ActivityLogQueryDTO = z.infer<typeof activityLogQuerySchema>['query'];

