import { z } from 'zod';

// Location types enum
export const LocationTypeEnum = z.enum(['WAREHOUSE', 'BRANCH', 'STORE', 'OUTLET']);

export const createLocationSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Location name must be at least 2 characters'),
    locationType: LocationTypeEnum.default('BRANCH'),
    locationCode: z.string().min(2, 'Location code must be at least 2 characters').max(20).optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    phone: z.string().optional(),
    phone2: z.string().optional(),
    phone3: z.string().optional(),
    email: z.string().email('Invalid email format').optional(),
    
    // Warehouse specific
    isMainWarehouse: z.boolean().optional(),
    warehouseCapacity: z.number().int().positive('Warehouse capacity must be positive').optional(),
    
    // Branch specific (for legacy compatibility)
    branchCode: z.string().max(10).optional(),
  }).refine((data) => {
    // If it's a warehouse, capacity can be provided
    if (data.locationType === 'WAREHOUSE' && data.warehouseCapacity === undefined) {
      return true; // Optional but recommended
    }
    // If it's not a warehouse, capacity should not be provided
    if (data.locationType !== 'WAREHOUSE' && data.warehouseCapacity !== undefined) {
      return false;
    }
    return true;
  }, {
    message: 'Warehouse capacity can only be set for warehouse locations',
    path: ['warehouseCapacity'],
  }),
});

export const updateLocationSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    locationType: LocationTypeEnum.optional(),
    locationCode: z.string().min(2).max(20).optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    phone: z.string().optional(),
    phone2: z.string().optional(),
    phone3: z.string().optional(),
    email: z.string().email().optional(),
    isMainWarehouse: z.boolean().optional(),
    warehouseCapacity: z.number().int().positive().optional().nullable(),
    branchCode: z.string().max(10).optional().nullable(),
    isActive: z.boolean().optional(),
  }),
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const assignUserToLocationSchema = z.object({
  body: z.object({
    userId: z.string().uuid('Invalid user ID'),
    locationId: z.string().uuid('Invalid location ID'),
  }),
});

export const getLocationUsersSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid location ID'),
  }),
});

export const getLocationInventorySchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid location ID'),
  }),
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    lowStock: z.string().transform(val => val === 'true').optional(),
  }).optional(),
});

export const transferStockSchema = z.object({
  body: z.object({
    fromLocationId: z.string().uuid('Invalid source location ID'),
    toLocationId: z.string().uuid('Invalid destination location ID'),
    items: z.array(z.object({
      productId: z.string().uuid('Invalid product ID'),
      quantity: z.number().int().positive('Quantity must be positive'),
    })).min(1, 'At least one item is required'),
    notes: z.string().optional(),
  }).refine((data) => data.fromLocationId !== data.toLocationId, {
    message: 'Source and destination locations must be different',
    path: ['toLocationId'],
  }),
});

export const getLocationsByTypeSchema = z.object({
  params: z.object({
    type: LocationTypeEnum,
  }),
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    isActive: z.string().transform(val => val === 'true' ? true : val === 'false' ? false : undefined).optional(),
  }).optional(),
});

export type CreateLocationDTO = z.infer<typeof createLocationSchema>['body'];
export type UpdateLocationDTO = z.infer<typeof updateLocationSchema>['body'];
export type LocationType = z.infer<typeof LocationTypeEnum>;

