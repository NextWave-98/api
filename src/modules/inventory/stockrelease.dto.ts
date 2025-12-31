import { z } from 'zod';

// Create Stock Release DTO
export const createStockReleaseSchema = z.object({
  body: z.object({
    releaseType: z.enum(['JOB_USAGE', 'BRANCH_TRANSFER', 'INTERNAL_USE', 'SAMPLE', 'PROMOTION', 'DISPOSAL', 'OTHER']),
    fromLocationId: z.string().uuid('Invalid location ID'),
    toLocationId: z.string().uuid('Invalid location ID').optional(),
    referenceId: z.string().optional(),
    referenceType: z.string().optional(),
    referenceNumber: z.string().optional(),
    requestedBy: z.string().uuid().optional(),
    notes: z.string().optional(),
    items: z.array(
      z.object({
        productId: z.string().uuid('Invalid product ID'),
        requestedQuantity: z.number().int().positive('Quantity must be positive'),
        batchNumber: z.string().optional(),
        serialNumber: z.string().optional(),
        location: z.string().optional(),
        notes: z.string().optional(),
      })
    ).min(1, 'At least one item is required'),
  }),
});

// Update Stock Release DTO
export const updateStockReleaseSchema = z.object({
  body: z.object({
    releaseType: z.enum(['JOB_USAGE', 'BRANCH_TRANSFER', 'INTERNAL_USE', 'SAMPLE', 'PROMOTION', 'DISPOSAL', 'OTHER']).optional(),
    toLocationId: z.string().uuid().optional(),
    notes: z.string().optional(),
    items: z.array(
      z.object({
        id: z.string().uuid().optional(),
        productId: z.string().uuid(),
        requestedQuantity: z.number().int().positive(),
        batchNumber: z.string().optional(),
        serialNumber: z.string().optional(),
        location: z.string().optional(),
        notes: z.string().optional(),
      })
    ).optional(),
  }),
});

// Approve Stock Release DTO
export const approveStockReleaseSchema = z.object({
  body: z.object({
    approvedBy: z.string().uuid().optional(),
    notes: z.string().optional(),
  }),
});

// Release Stock DTO (actually remove from inventory)
export const releaseStockSchema = z.object({
  body: z.object({
    releasedBy: z.string().uuid().optional(),
    items: z.array(
      z.object({
        itemId: z.string().uuid(),
        releasedQuantity: z.number().int().positive(),
      })
    ).optional(), // If not provided, release all requested quantities
  }),
});

// Receive Stock DTO (for branch transfers)
export const receiveStockSchema = z.object({
  body: z.object({
    receivedBy: z.string().uuid().optional(),
    notes: z.string().optional(),
  }),
});

// Query/Filter DTOs
export const getStockReleasesSchema = z.object({
  query: z.object({
    page: z.string().optional().default('1').transform(Number),
    limit: z.string().optional().default('10').transform(Number),
    search: z.string().optional(),
    releaseType: z.enum(['JOB_USAGE', 'BRANCH_TRANSFER', 'INTERNAL_USE', 'SAMPLE', 'PROMOTION', 'DISPOSAL', 'OTHER']).optional(),
    status: z.enum(['PENDING', 'APPROVED', 'RELEASED', 'RECEIVED', 'COMPLETED', 'CANCELLED']).optional(),
    fromLocationId: z.string().uuid().optional(),
    toLocationId: z.string().uuid().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    sortBy: z.enum(['releaseNumber', 'releaseDate', 'createdAt']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  }),
});

export type CreateStockReleaseDTO = z.infer<typeof createStockReleaseSchema>['body'];
export type UpdateStockReleaseDTO = z.infer<typeof updateStockReleaseSchema>['body'];
export type ApproveStockReleaseDTO = z.infer<typeof approveStockReleaseSchema>['body'];
export type ReleaseStockDTO = z.infer<typeof releaseStockSchema>['body'];
export type ReceiveStockDTO = z.infer<typeof receiveStockSchema>['body'];
export type GetStockReleasesQuery = z.infer<typeof getStockReleasesSchema>['query'];

