import { z } from 'zod';

export const createDeviceSchema = z.object({
  body: z.object({
    customerId: z.string().uuid('Invalid customer ID'),
    deviceType: z.enum(['MOBILE', 'TABLET', 'LAPTOP', 'DESKTOP', 'SMARTWATCH', 'OTHER']),
    brand: z.string().min(1, 'Brand is required'),
    model: z.string().min(1, 'Model is required'),
    serialNumber: z.string().optional().nullable(),
    imei: z.string().optional().nullable(),
    color: z.string().optional().nullable(),
    purchaseDate: z.string().datetime().optional().nullable(),
    warrantyExpiry: z.string().datetime().optional().nullable(),
    notes: z.string().optional().nullable(),
  }),
});

export const updateDeviceSchema = z.object({
  body: z.object({
    customerId: z.string().uuid('Invalid customer ID').optional(),
    deviceType: z.enum(['MOBILE', 'TABLET', 'LAPTOP', 'DESKTOP', 'SMARTWATCH', 'OTHER']).optional(),
    brand: z.string().min(1, 'Brand is required').optional(),
    model: z.string().min(1, 'Model is required').optional(),
    serialNumber: z.string().optional().nullable(),
    imei: z.string().optional().nullable(),
    color: z.string().optional().nullable(),
    purchaseDate: z.string().datetime().optional().nullable(),
    warrantyExpiry: z.string().datetime().optional().nullable(),
    notes: z.string().optional().nullable(),
  }),
});

export const deviceQuerySchema = z.object({
  query: z.object({
    page: z.string().optional().default('1'),
    limit: z.string().optional().default('10'),
    search: z.string().optional(),
    customerId: z.string().uuid().optional(),
    deviceType: z.enum(['MOBILE', 'TABLET', 'LAPTOP', 'DESKTOP', 'SMARTWATCH', 'OTHER']).optional(),
    brand: z.string().optional(),
  }),
});

export type CreateDeviceDTO = z.infer<typeof createDeviceSchema>['body'];
export type UpdateDeviceDTO = z.infer<typeof updateDeviceSchema>['body'];
export type DeviceQueryDTO = z.infer<typeof deviceQuerySchema>['query'];

