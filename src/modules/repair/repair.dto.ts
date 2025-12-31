import { z } from 'zod';

export const createRepairSchema = z.object({
  body: z.object({
    jobSheetId: z.string().uuid('Invalid job sheet ID'),
    repairType: z.string().min(2, 'Repair type must be at least 2 characters'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    cost: z.number().min(0, 'Cost must be positive').default(0),
    startTime: z.string().datetime().optional().nullable(),
    endTime: z.string().datetime().optional().nullable(),
    status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED']).default('PENDING'),
    notes: z.string().optional().nullable(),
  }),
});

export const updateRepairSchema = z.object({
  body: z.object({
    repairType: z.string().min(2).optional(),
    description: z.string().min(10).optional(),
    cost: z.number().min(0).optional(),
    startTime: z.string().datetime().optional().nullable(),
    endTime: z.string().datetime().optional().nullable(),
    status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED']).optional(),
    notes: z.string().optional().nullable(),
  }),
});

export type CreateRepairDTO = z.infer<typeof createRepairSchema>['body'];
export type UpdateRepairDTO = z.infer<typeof updateRepairSchema>['body'];

