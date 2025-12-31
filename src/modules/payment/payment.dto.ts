import { z } from 'zod';

export const createPaymentSchema = z.object({
  body: z.object({
    jobSheetId: z.string().uuid('Invalid job sheet ID'),
    customerId: z.string().uuid('Invalid customer ID'),
    amount: z.number().min(0.01, 'Amount must be greater than 0'),
    paymentMethod: z.enum(['CASH', 'CARD', 'BANK_TRANSFER', 'MOBILE_PAYMENT', 'CHECK', 'OTHER']),
    paymentDate: z.string().datetime().optional(),
    reference: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
  }),
});

export const updatePaymentSchema = z.object({
  body: z.object({
    amount: z.number().min(0.01).optional(),
    paymentMethod: z.enum(['CASH', 'CARD', 'BANK_TRANSFER', 'MOBILE_PAYMENT', 'CHECK', 'OTHER']).optional(),
    paymentDate: z.string().datetime().optional(),
    reference: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
  }),
});

export const paymentQuerySchema = z.object({
  query: z.object({
    page: z.string().optional().default('1'),
    limit: z.string().optional().default('10'),
    jobSheetId: z.string().uuid().optional(),
    customerId: z.string().uuid().optional(),
    paymentMethod: z.enum(['CASH', 'CARD', 'BANK_TRANSFER', 'MOBILE_PAYMENT', 'CHECK', 'OTHER']).optional(),
    fromDate: z.string().optional(),
    toDate: z.string().optional(),
  }),
});

export type CreatePaymentDTO = z.infer<typeof createPaymentSchema>['body'];
export type UpdatePaymentDTO = z.infer<typeof updatePaymentSchema>['body'];
export type PaymentQueryDTO = z.infer<typeof paymentQuerySchema>['query'];

