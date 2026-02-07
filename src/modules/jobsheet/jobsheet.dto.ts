import { z } from 'zod';

// Preprocess a date value: if it's a date-only string (YYYY-MM-DD),
// convert it to an ISO datetime string so zod's .datetime() accepts it.
// Empty strings are treated as null.
const dateLikePreprocessor = (val: any) => {
  if (val === undefined || val === null || val === '') return null;
  if (typeof val === 'string') {
    // match YYYY-MM-DD
    const dateOnlyMatch = /^\d{4}-\d{2}-\d{2}$/.test(val);
    if (dateOnlyMatch) {
      // create as UTC midnight
      const iso = new Date(val + 'T00:00:00Z').toISOString();
      return iso;
    }
    // If it's already a datetime string, return as is
    if (val.includes('T')) {
      return val;
    }
  }
  return val;
};

export const createJobSheetSchema = z.object({
  body: z.object({
    customerId: z.string().uuid('Invalid customer ID'),
    deviceId: z.string().uuid('Invalid device ID'),
    locationId: z.string().uuid('Invalid location ID'),
    assignedToId: z.string().uuid('Invalid user ID').optional().nullable(),
    
    // Job Details
    issueDescription: z.string().min(10, 'Issue description must be at least 10 characters'),
    customerRemarks: z.string().optional().nullable(),
    technicianRemarks: z.string().optional().nullable(),
    deviceCondition: z.string().optional().nullable(),
    accessories: z.string().optional().nullable(),
    devicePassword: z.string().optional().nullable(),
    backupTaken: z.boolean().default(false),
    
    // Status & Priority
    status: z.enum([
      'PENDING',
      'IN_PROGRESS',
      'WAITING_PARTS',
      'WAITING_APPROVAL',
      'COMPLETED',
      'QUALITY_CHECK',
      'READY_DELIVERY',
      'DELIVERED',
      'CANCELLED',
      'ON_HOLD',
    ]).default('PENDING'),
    priority: z.enum(['LOW', 'NORMAL', 'MEDIUM', 'HIGH', 'URGENT']).default('NORMAL'),
    
    // Dates (accept YYYY-MM-DD or full ISO datetime)
    expectedDate: z.preprocess(dateLikePreprocessor, z.union([z.string().datetime(), z.null()])).optional(),
    // legacy / frontend alias. accept either `expectedDate` or `expectedCompletionDate`
    expectedCompletionDate: z.preprocess(dateLikePreprocessor, z.union([z.string().datetime(), z.null()])).optional(),
    
    // Financial
    estimatedCost: z.number().min(0).default(0),
    labourCost: z.number().min(0).default(0),
    partsCost: z.number().min(0).default(0),
    discountAmount: z.number().min(0).default(0),
    paidAmount: z.number().min(0).default(0),
    
    // Warranty
    warrantyPeriod: z.number().int().min(0).optional().nullable(),
  }),
});

// Transform empty strings to null
const emptyStringToNull = (val: any) => (val === '' ? null : val);

export const updateJobSheetSchema = z.object({
  body: z.object({
    assignedToId: z.string().uuid('Invalid user ID').optional().nullable(),
    
    // Job Details
    issueDescription: z.string().min(10).optional(),
    customerRemarks: z.preprocess(emptyStringToNull, z.string().optional().nullable()),
    technicianRemarks: z.preprocess(emptyStringToNull, z.string().optional().nullable()),
    // Frontend aliases for technicianRemarks
    diagnosisNotes: z.preprocess(emptyStringToNull, z.string().optional().nullable()),
    repairNotes: z.preprocess(emptyStringToNull, z.string().optional().nullable()),
    deviceCondition: z.preprocess(emptyStringToNull, z.string().optional().nullable()),
    accessories: z.preprocess(emptyStringToNull, z.string().optional().nullable()),
    devicePassword: z.preprocess(emptyStringToNull, z.string().optional().nullable()),
    backupTaken: z.boolean().optional(),
    
    // Status & Priority
    status: z.enum([
      'PENDING',
      'IN_PROGRESS',
      'WAITING_PARTS',
      'WAITING_APPROVAL',
      'COMPLETED',
      'QUALITY_CHECK',
      'READY_DELIVERY',
      'DELIVERED',
      'CANCELLED',
      'ON_HOLD',
    ]).optional(),
    priority: z.enum(['LOW', 'NORMAL', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
    
    // Dates (accept YYYY-MM-DD or full ISO datetime)
    expectedDate: z.preprocess(dateLikePreprocessor, z.union([z.string().datetime(), z.null()])).optional(),
    // support frontend alias when updating
    expectedCompletionDate: z.preprocess(dateLikePreprocessor, z.union([z.string().datetime(), z.null()])).optional(),
    completedDate: z.preprocess(dateLikePreprocessor, z.union([z.string().datetime(), z.null()])).optional(),
    deliveredDate: z.preprocess(dateLikePreprocessor, z.union([z.string().datetime(), z.null()])).optional(),
    
    // Financial
    estimatedCost: z.number().min(0).optional(),
    actualCost: z.number().min(0).optional(),
    labourCost: z.number().min(0).optional(),
    partsCost: z.number().min(0).optional(),
    discountAmount: z.number().min(0).optional(),
    totalAmount: z.number().min(0).optional(),
    paidAmount: z.number().min(0).optional(),
    balanceAmount: z.number().min(0).optional(),
    
    // Warranty
    warrantyPeriod: z.number().int().min(0).optional().nullable(),
    
    // Status update remarks
    remarks: z.string().optional().nullable(),
  }),
});

export const updateJobSheetStatusSchema = z.object({
  body: z.object({
    status: z.enum([
      'PENDING',
      'IN_PROGRESS',
      'WAITING_PARTS',
      'WAITING_APPROVAL',
      'COMPLETED',
      'QUALITY_CHECK',
      'READY_DELIVERY',
      'DELIVERED',
      'CANCELLED',
      'ON_HOLD',
    ]),
    remarks: z.string().optional().nullable(),
  }),
});

export const jobSheetQuerySchema = z.object({
  query: z.object({
    page: z.string().optional().default('1'),
    limit: z.string().optional().default('10'),
    search: z.string().optional(),
    status: z.string().optional(),
    priority: z.string().optional(),
    locationId: z.string().uuid().optional(),
    customerId: z.string().uuid().optional(),
    assignedToId: z.string().uuid().optional(),
    dateFilter: z.enum(['all', 'today', 'yesterday', 'this_week', 'this_month', 'this_year', 'custom']).optional(),
    fromDate: z.string().optional(),
    toDate: z.string().optional(),
  }),
});

export const addPartToJobSheetSchema = z.object({
  body: z.object({
    partId: z.string().uuid('Invalid part ID'),
    quantity: z.number().int().min(1, 'Quantity must be at least 1'),
    unitPrice: z.number().min(0, 'Unit price must be positive'),
    warrantyMonths: z.number().int().min(0).default(0),
  }),
});

export const addProductToJobSheetSchema = z.object({
  body: z.object({
    productId: z.string().uuid('Invalid product ID'),
    quantity: z.number().int().min(1, 'Quantity must be at least 1'),
    unitPrice: z.number().min(0, 'Unit price must be positive'),
    costPrice: z.number().min(0, 'Cost price must be positive'),
    warrantyMonths: z.number().int().min(0).default(0),
    serialNumber: z.string().optional().nullable(),
    batchNumber: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
  }),
});

export const downloadJobSheetSchema = z.object({
  query: z.object({
    format: z.enum(['pdf', 'print']).default('pdf').optional(),
    includeTerms: z
      .union([z.boolean(), z.string()])
      .transform((val) => {
        if (typeof val === 'string') {
          return val.toLowerCase() === 'true';
        }
        return val;
      })
      .default(true),
    includeWarranty: z
      .union([z.boolean(), z.string()])
      .transform((val) => {
        if (typeof val === 'string') {
          return val.toLowerCase() === 'true';
        }
        return val;
      })
      .default(true),
  }),
});

export const printJobSheetSchema = z.object({
  query: z.object({
    copies: z
      .union([z.number(), z.string()])
      .transform((val) => {
        if (typeof val === 'string') {
          return parseInt(val, 10);
        }
        return val;
      })
      .pipe(z.number().int().min(1).max(10))
      .default(1),
    includeTerms: z
      .union([z.boolean(), z.string()])
      .transform((val) => {
        if (typeof val === 'string') {
          return val.toLowerCase() === 'true';
        }
        return val;
      })
      .default(true),
    includeWarranty: z
      .union([z.boolean(), z.string()])
      .transform((val) => {
        if (typeof val === 'string') {
          return val.toLowerCase() === 'true';
        }
        return val;
      })
      .default(true),
  }),
});

export type CreateJobSheetDTO = z.infer<typeof createJobSheetSchema>['body'];
export type UpdateJobSheetDTO = z.infer<typeof updateJobSheetSchema>['body'];
export type UpdateJobSheetStatLKRTO = z.infer<typeof updateJobSheetStatusSchema>['body'];
export type JobSheetQueryDTO = z.infer<typeof jobSheetQuerySchema>['query'];
export type AddPartToJobSheetDTO = z.infer<typeof addPartToJobSheetSchema>['body'];
export type AddProductToJobSheetDTO = z.infer<typeof addProductToJobSheetSchema>['body'];
export type DownloadJobSheetDTO = z.infer<typeof downloadJobSheetSchema>['query'];
export type PrintJobSheetDTO = z.infer<typeof printJobSheetSchema>['query'];

