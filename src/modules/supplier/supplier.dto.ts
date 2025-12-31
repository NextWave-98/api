import { z } from 'zod';

// Helper function to clean empty strings
const cleanEmptyStrings = (data: any) => {
  const cleaned = { ...data };
  Object.keys(cleaned).forEach(key => {
    if (cleaned[key] === '' || cleaned[key] === null) {
      cleaned[key] = undefined;
    }
  });
  return cleaned;
};

// Base supplier schema
const baseSupplierSchema = z.object({
  name: z.string().min(1, 'Supplier name is required'),
  companyName: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().min(1, 'Phone is required'),
  alternatePhone: z.string().optional(),
  fax: z.string().optional(),
  website: z.string().url().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().default('Sri Lanka'),
  taxId: z.string().optional(),
  registrationNumber: z.string().optional(),
  paymentTerms: z.string().optional(),
  creditLimit: z.coerce.number().min(0).optional(),
  creditDays: z.coerce.number().int().min(0).default(30),
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
  accountName: z.string().optional(),
  swiftCode: z.string().optional(),
  contactPersonName: z.string().optional(),
  contactPersonPhone: z.string().optional(),
  contactPersonEmail: z.string().email().optional(),
  contactPersonDesignation: z.string().optional(),
  rating: z.coerce.number().min(0).max(5).optional(),
  supplierType: z.enum(['LOCAL', 'INTERNATIONAL', 'MANUFACTURER', 'DISTRIBUTOR', 'WHOLESALER', 'RETAILER']).default('LOCAL'),
  status: z.enum(['ACTIVE', 'INACTIVE', 'BLACKLISTED', 'PENDING_APPROVAL']).default('ACTIVE'),
  documents: z.any().optional(),
  notes: z.string().optional(),
  isActive: z.boolean().default(true),
});

// Create Supplier DTO with preprocessing to clean empty strings
export const createSupplierSchema = z.preprocess(
  cleanEmptyStrings,
  baseSupplierSchema
);

export type CreateSupplierDto = z.infer<typeof baseSupplierSchema>;

// Update Supplier DTO
export const updateSupplierSchema = z.preprocess(
  cleanEmptyStrings,
  baseSupplierSchema.partial()
);

export type UpdateSupplierDto = z.infer<typeof updateSupplierSchema>;

// Query Suppliers DTO
export const querySuppliersSchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('10'),
  search: z.string().optional(),
  supplierType: z.enum(['LOCAL', 'INTERNATIONAL', 'MANUFACTURER', 'DISTRIBUTOR', 'WHOLESALER', 'RETAILER']).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'BLACKLISTED', 'PENDING_APPROVAL']).optional(),
  city: z.string().optional(),
  isActive: z.string().optional(),
  sortBy: z.enum(['name', 'supplierCode', 'createdAt', 'rating']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type QuerySuppliersDto = z.infer<typeof querySuppliersSchema>;

// Add Product to Supplier DTO
export const addSupplierProductSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  supplierSKU: z.string().optional(),
  supplierPrice: z.coerce.number().positive('Supplier price must be positive'),
  moq: z.coerce.number().int().min(1).default(1),
  leadTimeDays: z.coerce.number().int().min(0).default(7),
  isPrimary: z.boolean().default(false),
});

export type AddSupplierProductDto = z.infer<typeof addSupplierProductSchema>;

// Update Supplier Product DTO
export const updateSupplierProductSchema = addSupplierProductSchema.partial();

export type UpdateSupplierProductDto = z.infer<typeof updateSupplierProductSchema>;

