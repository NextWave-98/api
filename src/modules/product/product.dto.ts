import { z } from 'zod';

// Create Product DTO
export const createProductSchema = z.object({
  sku: z.string().optional(),
  barcode: z.string().optional(),
  name: z.string().min(1, 'Product name is required'),
  description: z.string().optional(),
  categoryId: z.string().uuid('Invalid category ID'),
  brand: z.string().optional(),
  model: z.string().optional(),
  compatibility: z.string().optional(),
  specifications: z.any().optional(),
  unitPrice: z.number().positive('Unit price must be positive'),
  costPrice: z.number().positive('Cost price must be positive'),
  wholesalePrice: z.number().positive().optional(),
  marginPercentage: z.number().min(0).max(100).optional(),
  taxRate: z.number().min(0).default(0),
  minStockLevel: z.number().int().min(0).default(5),
  maxStockLevel: z.number().int().min(0).default(100),
  reorderLevel: z.number().int().min(0).default(10),
  reorderQuantity: z.number().int().min(0).default(20),
  weight: z.number().positive().optional(),
  dimensions: z.string().optional(),
  warrantyMonths: z.number().int().min(0).default(0),
  warrantyType: z.enum(['STANDARD', 'EXTENDED', 'LIMITED', 'LIFETIME', 'NO_WARRANTY']).default('STANDARD'),
  qualityGrade: z.enum(['A_GRADE', 'B_GRADE', 'C_GRADE', 'OEM', 'AFTERMARKET']).default('A_GRADE'),
  terms: z.string().optional(),
  coverage: z.string().optional(),
  exclusions: z.string().optional(),
  isActive: z.boolean().default(true),
  images: z.any().optional(),
  primaryImage: z.string().url().optional(),
});

export type CreateProductDto = z.infer<typeof createProductSchema>;

// Update Product DTO
export const updateProductSchema = z.object({
  sku: z.string().optional(),
  barcode: z.string().optional(),
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  categoryId: z.string().uuid().optional(),
  brand: z.string().optional().nullable(),
  model: z.string().optional().nullable(),
  compatibility: z.string().optional().nullable(),
  specifications: z.any().optional(),
  unitPrice: z.number().positive().optional(),
  costPrice: z.number().positive().optional(),
  wholesalePrice: z.number().positive().optional().nullable(),
  marginPercentage: z.number().min(0).max(100).optional().nullable(),
  taxRate: z.number().min(0).optional(),
  minStockLevel: z.number().int().min(0).optional(),
  maxStockLevel: z.number().int().min(0).optional(),
  reorderLevel: z.number().int().min(0).optional(),
  reorderQuantity: z.number().int().min(0).optional(),
  weight: z.number().positive().optional().nullable(),
  dimensions: z.string().optional().nullable(),
  warrantyMonths: z.number().int().min(0).optional(),
  warrantyType: z.enum(['STANDARD', 'EXTENDED', 'LIMITED', 'LIFETIME', 'NO_WARRANTY']).optional(),
  qualityGrade: z.enum(['A_GRADE', 'B_GRADE', 'C_GRADE', 'OEM', 'AFTERMARKET']).optional(),
  terms: z.string().optional().nullable(),
  coverage: z.string().optional().nullable(),
  exclusions: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  isDiscontinued: z.boolean().optional(),
  images: z.any().optional(),
  primaryImage: z.string().url().optional().nullable(),
});

export type UpdateProductDto = z.infer<typeof updateProductSchema>;

// Query Products DTO
export const queryProductsSchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('10'),
  search: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  brand: z.string().optional(),
  qualityGrade: z.enum(['A_GRADE', 'B_GRADE', 'C_GRADE', 'OEM', 'AFTERMARKET']).optional(),
  isActive: z.string().optional(),
  isDiscontinued: z.string().optional(),
  lowStock: z.string().optional(), // Show products below reorder level
  sortBy: z.enum(['name', 'productCode', 'unitPrice', 'createdAt']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type QueryProductsDto = z.infer<typeof queryProductsSchema>;

// Bulk Price Update DTO
export const bulkPriceUpdateSchema = z.object({
  productIds: z.array(z.string().uuid()).min(1, 'At least one product ID is required'),
  priceType: z.enum(['unitPrice', 'costPrice', 'wholesalePrice']),
  updateType: z.enum(['percentage', 'fixed']),
  value: z.number(),
});

export type BulkPriceUpdateDto = z.infer<typeof bulkPriceUpdateSchema>;

// Product Transfer DTO (Single product transfer)
export const transferProductSchema = z.object({
  body: z.object({
    fromLocationId: z.string().uuid('Invalid from location ID'),
    toLocationId: z.string().uuid('Invalid to location ID'),
    productId: z.string().uuid('Invalid product ID'),
    quantity: z.number().int().min(1, 'Quantity must be at least 1'),
    notes: z.string().optional().nullable(),
  }),
});

export type TransferProductDto = z.infer<typeof transferProductSchema>['body'];

// Bulk Product Transfer DTO (Multiple products transfer)
export const bulkTransferProductSchema = z.object({
  body: z.object({
    fromLocationId: z.string().uuid('Invalid from location ID'),
    toLocationId: z.string().uuid('Invalid to location ID'),
    items: z.array(z.object({
      productId: z.string().uuid('Invalid product ID'),
      quantity: z.number().int().min(1, 'Quantity must be at least 1'),
    })).min(1, 'At least one product is required').optional(),
    products: z.array(z.object({
      productId: z.string().uuid('Invalid product ID'),
      quantity: z.number().int().min(1, 'Quantity must be at least 1'),
    })).min(1, 'At least one product is required').optional(),
    notes: z.string().optional().nullable(),
  }).refine(
    (data) => data.items || data.products,
    { message: 'Either items or products array is required' }
  ).transform((data) => ({
    fromLocationId: data.fromLocationId,
    toLocationId: data.toLocationId,
    items: (data.items || data.products)!,
    notes: data.notes,
  })),
});

export type BulkTransferProductDto = z.infer<typeof bulkTransferProductSchema>['body'];

// Adjust Product Stock DTO
export const adjustProductStockSchema = z.object({
  body: z.object({
    productId: z.string().uuid('Invalid product ID'),
    locationId: z.string().uuid('Invalid location ID'),
    quantity: z.number().int('Quantity must be an integer'),
    movementType: z.enum(['STOCK_IN', 'STOCK_OUT', 'ADJUSTMENT', 'RETURN', 'DAMAGE', 'LOST', 'FOUND', 'PURCHASE', 'SALE']),
    referenceType: z.enum(['PURCHASE_ORDER', 'SUPPLIER_RETURN', 'CUSTOMER_RETURN', 'MANUAL', 'TRANSFER', 'JOB_SHEET', 'STOCK_RELEASE', 'OTHER']).optional(),
    referenceId: z.string().uuid().optional(),
    notes: z.string().optional().nullable(),
  }),
});

export type AdjustProductStockDto = z.infer<typeof adjustProductStockSchema>['body'];

// Bulk Upload Products DTO
export const bulkUploadProductsSchema = z.object({
  // This will be validated in the service based on file content
});

export type BulkUploadProductsDto = z.infer<typeof bulkUploadProductsSchema>;

