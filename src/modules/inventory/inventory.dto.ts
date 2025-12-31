import { z } from 'zod';

export const createInventorySchema = z.object({
  body: z.object({
    productId: z.string().uuid('Invalid product ID'),
    locationId: z.string().uuid('Invalid location ID'),
    quantity: z.number().int().min(0).default(0),
    minStockLevel: z.number().int().min(0).optional(),
    maxStockLevel: z.number().int().min(0).optional(),
    location: z.string().optional().nullable(),
    zone: z.string().optional().nullable(),
  }),
});

export const updateInventorySchema = z.object({
  body: z.object({
    minStockLevel: z.number().int().min(0).optional(),
    maxStockLevel: z.number().int().min(0).optional(),
    location: z.string().optional().nullable(),
    zone: z.string().optional().nullable(),
  }),
});

export const adjustStockSchema = z
  .object({
    body: z.object({
      id: z.string().uuid().optional(),
      productId: z.string().uuid('Invalid product ID').optional(),
      locationId: z.string().uuid('Invalid location ID').optional(),
      quantity: z.number().int('Quantity must be an integer'),
      movementType: z.enum(['IN', 'OUT', 'ADJUSTMENT', 'RETURN', 'DAMAGED']),
      notes: z.string().optional().nullable(),
    }),
  })
  .refine((data) => {
    const body = (data as any).body;
    return Boolean(body.id) || (Boolean(body.productId) && Boolean(body.locationId));
  }, {
    message: 'Either id or both productId and locationId must be provided in the body',
    path: ['body'],
  });

export const transferStockSchema = z.object({
  body: z.object({
    fromLocationId: z.string().uuid('Invalid from location ID'),
    toLocationId: z.string().uuid('Invalid to location ID'),
    productId: z.string().uuid('Invalid product ID'),
    quantity: z.number().int().min(1, 'Quantity must be at least 1'),
    notes: z.string().optional().nullable(),
  }),
});

export const adjustStockByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid inventory ID'),
  }).optional(),
  body: z.object({
    // id is passed in path param for this schema, so validate only the adjust fields
    quantity: z.number().int('Quantity must be an integer'),
    movementType: z.enum(['IN', 'OUT', 'ADJUSTMENT', 'RETURN', 'DAMAGED']),
    notes: z.string().optional().nullable(),
  }),
});

export type CreateInventoryDTO = z.infer<typeof createInventorySchema>['body'];
export type UpdateInventoryDTO = z.infer<typeof updateInventorySchema>['body'];
export type AdjustStockDTO = z.infer<typeof adjustStockSchema>['body'];
export type AdjustStockByIdDTO = z.infer<typeof adjustStockByIdSchema>['body'];
export type TransferStockDTO = z.infer<typeof transferStockSchema>['body'];

