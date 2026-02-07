import { z } from 'zod';

// Purchase Order Item Schema
const poItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(1),
  unitPrice: z.number().positive(),
  taxRate: z.number().min(0).default(0),
  discountPercent: z.number().min(0).max(100).default(0),
  notes: z.string().optional(),
});

// Create Purchase Order DTO
export const createPurchaseOrderSchema = z.object({
  supplierId: z.string().uuid('Invalid supplier ID'),
  orderDate: z.string().datetime().optional(),
  expectedDate: z.string().datetime().optional(),
  priority: z.enum(['LOW', 'NORMAL', 'MEDIUM', 'HIGH', 'URGENT']).default('NORMAL'),
  paymentTerms: z.string().optional(),
  shippingMethod: z.string().optional(),
  shippingAddress: z.string().optional(),
  shippingCost: z.number().min(0).default(0),
  discountAmount: z.number().min(0).default(0),
  notes: z.string().optional(),
  internalNotes: z.string().optional(),
  items: z.array(poItemSchema).min(1, 'At least one item is required'),
});

export type CreatePurchaseOrderDto = z.infer<typeof createPurchaseOrderSchema>;

// Update Purchase Order DTO
export const updatePurchaseOrderSchema = z.object({
  expectedDate: z.string().datetime().optional(),
  priority: z.enum(['LOW', 'NORMAL', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  paymentTerms: z.string().optional(),
  shippingMethod: z.string().optional(),
  shippingAddress: z.string().optional(),
  shippingCost: z.number().min(0).optional(),
  discountAmount: z.number().min(0).optional(),
  notes: z.string().optional(),
  internalNotes: z.string().optional(),
});

export type UpdatePurchaseOrderDto = z.infer<typeof updatePurchaseOrderSchema>;

// Update PO Status DTO
export const updatePOStatusSchema = z.object({
  status: z.enum(['DRAFT', 'SUBMITTED', 'CONFIRMED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'COMPLETED', 'CANCELLED', 'ON_HOLD']),
  remarks: z.string().optional(),
});

export type UpdatePOStatLKRto = z.infer<typeof updatePOStatusSchema>;

// Query Purchase Orders DTO
export const queryPurchaseOrdersSchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('10'),
  search: z.string().optional(),
  supplierId: z.string().uuid().optional(),
  status: z.enum(['DRAFT', 'SUBMITTED', 'CONFIRMED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'COMPLETED', 'CANCELLED', 'ON_HOLD']).optional(),
  priority: z.enum(['LOW', 'NORMAL', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  fromDate: z.string().datetime().optional(),
  toDate: z.string().datetime().optional(),
  sortBy: z.enum(['poNumber', 'orderDate', 'totalAmount', 'createdAt']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type QueryPurchaseOrdersDto = z.infer<typeof queryPurchaseOrdersSchema>;

// Add PO Item DTO
export const addPOItemSchema = poItemSchema;

export type AddPOItemDto = z.infer<typeof addPOItemSchema>;

// Update PO Item DTO
export const updatePOItemSchema = z.object({
  quantity: z.number().int().min(1).optional(),
  unitPrice: z.number().positive().optional(),
  taxRate: z.number().min(0).optional(),
  discountPercent: z.number().min(0).max(100).optional(),
  notes: z.string().optional(),
});

export type UpdatePOItemDto = z.infer<typeof updatePOItemSchema>;

// Approve PO DTO
export const approvePOSchema = z.object({
  approvedBy: z.string().uuid().optional(),
  notes: z.string().optional(),
});

export type ApprovePODto = z.infer<typeof approvePOSchema>;

// Receive PO DTO
export const receivePOSchema = z.object({
  receivedBy: z.string().uuid().optional(),
  locationId: z.string().uuid('Invalid location ID'),
  notes: z.string().optional(),
  autoUpdateInventory: z.boolean().default(true),
});

export type ReceivePODto = z.infer<typeof receivePOSchema>;

// Receive PO with Items DTO (for partial receive)
export const receivePOWithItemsSchema = z.object({
  receivedBy: z.string().uuid().optional(),
  locationId: z.string().uuid('Invalid location ID'),
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantityReceived: z.number().int().min(1),
  })).min(1, 'At least one item is required'),
  notes: z.string().optional(),
  autoUpdateInventory: z.boolean().default(true),
});

export type ReceivePOWithItemsDto = z.infer<typeof receivePOWithItemsSchema>;

// Cancel PO DTO
export const cancelPOSchema = z.object({
  cancelledBy: z.string().uuid().optional(),
  reason: z.string().optional(),
});

export type CancelPODto = z.infer<typeof cancelPOSchema>;

