import { z } from 'zod';

export const createPartSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    description: z.string().optional().nullable(),
    category: z.enum([
      'SCREEN',
      'BATTERY',
      'CHARGER',
      'BACK_COVER',
      'CAMERA',
      'SPEAKER',
      'MICROPHONE',
      'CHARGING_PORT',
      'HEADPHONE_JACK',
      'BUTTON',
      'FLEX_CABLE',
      'MOTHERBOARD',
      'RAM',
      'STORAGE',
      'OTHER',
    ]),
    brand: z.string().optional().nullable(),
    model: z.string().optional().nullable(),
    compatibility: z.string().optional().nullable(),
    unitPrice: z.number().min(0, 'Unit price must be positive'),
    costPrice: z.number().min(0, 'Cost price must be positive'),
    minStockLevel: z.number().int().min(0).default(5),
    reorderLevel: z.number().int().min(0).default(10),
    supplier: z.string().optional().nullable(),
    supplierContact: z.string().optional().nullable(),
    warrantyMonths: z.number().int().min(0).default(0),
    isActive: z.boolean().default(true),
  }),
});

export const updatePartSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    description: z.string().optional().nullable(),
    category: z.enum([
      'SCREEN',
      'BATTERY',
      'CHARGER',
      'BACK_COVER',
      'CAMERA',
      'SPEAKER',
      'MICROPHONE',
      'CHARGING_PORT',
      'HEADPHONE_JACK',
      'BUTTON',
      'FLEX_CABLE',
      'MOTHERBOARD',
      'RAM',
      'STORAGE',
      'OTHER',
    ]).optional(),
    brand: z.string().optional().nullable(),
    model: z.string().optional().nullable(),
    compatibility: z.string().optional().nullable(),
    unitPrice: z.number().min(0).optional(),
    costPrice: z.number().min(0).optional(),
    minStockLevel: z.number().int().min(0).optional(),
    reorderLevel: z.number().int().min(0).optional(),
    supplier: z.string().optional().nullable(),
    supplierContact: z.string().optional().nullable(),
    warrantyMonths: z.number().int().min(0).optional(),
    isActive: z.boolean().optional(),
  }),
});

export const partQuerySchema = z.object({
  query: z.object({
    page: z.string().optional().default('1'),
    limit: z.string().optional().default('10'),
    search: z.string().optional(),
    category: z.enum([
      'SCREEN',
      'BATTERY',
      'CHARGER',
      'BACK_COVER',
      'CAMERA',
      'SPEAKER',
      'MICROPHONE',
      'CHARGING_PORT',
      'HEADPHONE_JACK',
      'BUTTON',
      'FLEX_CABLE',
      'MOTHERBOARD',
      'RAM',
      'STORAGE',
      'OTHER',
    ]).optional(),
    brand: z.string().optional(),
    isActive: z.string().optional(),
  }),
});

export type CreatePartDTO = z.infer<typeof createPartSchema>['body'];
export type UpdatePartDTO = z.infer<typeof updatePartSchema>['body'];
export type PartQueryDTO = z.infer<typeof partQuerySchema>['query'];

