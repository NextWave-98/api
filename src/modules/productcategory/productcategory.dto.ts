import { z } from 'zod';

// Subcategory DTO (for creating subcategories with parent)
export const subcategorySchema = z.object({
  name: z.string().min(1, 'Subcategory name is required'),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  displayOrder: z.number().int().default(0),
});

export type SubcategoryDto = z.infer<typeof subcategorySchema>;

// Create Product Category DTO
export const createProductCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  description: z.string().optional(),
  parentId: z.string().uuid().optional(),
  image: z.string().url().optional(),
  isActive: z.boolean().default(true),
  displayOrder: z.number().int().default(0),
  subcategories: z.array(subcategorySchema).optional(),
});

export type CreateProductCategoryDto = z.infer<typeof createProductCategorySchema>;

// Update Product Category DTO
export const updateProductCategorySchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  parentId: z.string().uuid().optional().nullable(),
  image: z.string().url().optional().nullable(),
  isActive: z.boolean().optional(),
  displayOrder: z.number().int().optional(),
});

export type UpdateProductCategoryDto = z.infer<typeof updateProductCategorySchema>;

// Query Product Categories DTO
export const queryProductCategoriesSchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('10'),
  search: z.string().optional(),
  parentId: z.string().uuid().optional(),
  isActive: z.string().optional(),
  sortBy: z.enum(['name', 'createdAt', 'displayOrder']).optional().default('displayOrder'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});

export type QueryProductCategoriesDto = z.infer<typeof queryProductCategoriesSchema>;

// Bulk Upload Product Categories DTO
export const bulkUploadProductCategoriesSchema = z.object({
  file: z.any(), // File will be handled by multer
});

export type BulkUploadProductCategoriesDto = z.infer<typeof bulkUploadProductCategoriesSchema>;

