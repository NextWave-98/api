import { z } from 'zod';

export const createSupplierPaymentSchema = z.object({
  body: z.object({
    purchaseOrderId: z.string().uuid('Invalid purchase order ID'),
    supplierId: z.string().uuid('Invalid supplier ID'),
    amount: z.number().min(0.01, 'Amount must be greater than 0'),
    paymentMethod: z.enum(['CASH', 'CARD', 'BANK_TRANSFER', 'MOBILE_PAYMENT', 'CHECK', 'OTHER']),
    paymentDate: z.string().optional(),
    reference: z.string().optional().nullable(),
    bankName: z.string().optional().nullable(),
    checkNumber: z.string().optional().nullable(),
    transactionId: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
    createdBy: z.string().uuid('Invalid user ID').optional(),
  }),
});

export const updateSupplierPaymentSchema = z.object({
  body: z.object({
    amount: z.number().min(0.01).optional(),
    paymentMethod: z.enum(['CASH', 'CARD', 'BANK_TRANSFER', 'MOBILE_PAYMENT', 'CHECK', 'OTHER']).optional(),
    paymentDate: z.string().optional(),
    reference: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
  }),
});

export const supplierPaymentQuerySchema = z.object({
  query: z.object({
    page: z.string().optional().default('1'),
    limit: z.string().optional().default('10'),
    purchaseOrderId: z.string().uuid().optional(),
    supplierId: z.string().uuid().optional(),
    paymentMethod: z.enum(['CASH', 'CARD', 'BANK_TRANSFER', 'MOBILE_PAYMENT', 'CHECK', 'OTHER']).optional(),
    fromDate: z.string().optional(),
    toDate: z.string().optional(),
  }),
});

export type CreateSupplierPaymentDTO = z.infer<typeof createSupplierPaymentSchema>['body'];
export type UpdateSupplierPaymentDTO = z.infer<typeof updateSupplierPaymentSchema>['body'];
export type SupplierPaymentQueryDTO = z.infer<typeof supplierPaymentQuerySchema>['query'];

