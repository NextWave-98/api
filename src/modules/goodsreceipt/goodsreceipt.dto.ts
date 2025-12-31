import { z } from 'zod';

// ============================================
// CREATE GOODS RECEIPT
// ============================================
export const createGoodsReceiptSchema = z.object({
  purchaseOrderId: z.string().uuid(),
  receiptDate: z.string().datetime().optional(),
  receivedBy: z.string().uuid().optional(),
  invoiceNumber: z.string().optional(),
  invoiceDate: z.string().datetime().optional(),
  notes: z.string().optional(),
  attachments: z.any().optional(),
  items: z.array(z.object({
    productId: z.string().uuid(),
    orderedQuantity: z.number().int().positive(),
    receivedQuantity: z.number().int().min(0),
    acceptedQuantity: z.number().int().min(0),
    rejectedQuantity: z.number().int().min(0).optional().default(0),
    batchNumber: z.string().optional(),
    expiryDate: z.string().datetime().optional(),
    qualityStatus: z.enum(['PENDING', 'ACCEPTED', 'REJECTED', 'DAMAGED', 'PARTIAL']).optional().default('PENDING'),
    rejectionReason: z.string().optional(),
    notes: z.string().optional(),
  })).min(1),
});

export type CreateGoodsReceiptDto = z.infer<typeof createGoodsReceiptSchema>;

// ============================================
// UPDATE GOODS RECEIPT
// ============================================
export const updateGoodsReceiptSchema = z.object({
  receiptDate: z.string().datetime().optional(),
  receivedBy: z.string().uuid().optional(),
  invoiceNumber: z.string().optional(),
  invoiceDate: z.string().datetime().optional(),
  notes: z.string().optional(),
  attachments: z.any().optional(),
  status: z.enum(['PENDING_QC', 'QC_PASSED', 'QC_FAILED', 'PARTIALLY_ACCEPTED', 'COMPLETED']).optional(),
});

export type UpdateGoodsReceiptDto = z.infer<typeof updateGoodsReceiptSchema>;

// ============================================
// UPDATE GOODS RECEIPT ITEM
// ============================================
export const updateGoodsReceiptItemSchema = z.object({
  receivedQuantity: z.number().int().min(0).optional(),
  acceptedQuantity: z.number().int().min(0).optional(),
  rejectedQuantity: z.number().int().min(0).optional(),
  batchNumber: z.string().optional(),
  expiryDate: z.string().datetime().optional(),
  qualityStatus: z.enum(['PENDING', 'ACCEPTED', 'REJECTED', 'DAMAGED', 'PARTIAL']).optional(),
  rejectionReason: z.string().optional(),
  notes: z.string().optional(),
});

export type UpdateGoodsReceiptItemDto = z.infer<typeof updateGoodsReceiptItemSchema>;

// ============================================
// QUALITY CHECK
// ============================================
export const qualityCheckSchema = z.object({
  status: z.enum(['QC_PASSED', 'QC_FAILED', 'PARTIALLY_ACCEPTED']),
  qualityCheckBy: z.string().uuid(),
  qualityCheckNotes: z.string().optional(),
  items: z.array(z.object({
    itemId: z.string().uuid(),
    acceptedQuantity: z.number().int().min(0),
    rejectedQuantity: z.number().int().min(0),
    qualityStatus: z.enum(['ACCEPTED', 'REJECTED', 'DAMAGED', 'PARTIAL']),
    rejectionReason: z.string().optional(),
  })),
});

export type QualityCheckDto = z.infer<typeof qualityCheckSchema>;

// ============================================
// APPROVE GOODS RECEIPT (Update Inventory)
// ============================================
export const approveGoodsReceiptSchema = z.object({
  locationId: z.string().uuid(), // Destination location ID (warehouse/branch)
  qualityCheckBy: z.string().uuid().optional(),
  qualityCheckNotes: z.string().optional(),
});

export type ApproveGoodsReceiptDto = z.infer<typeof approveGoodsReceiptSchema>;

// ============================================
// QUERY GOODS RECEIPTS
// ============================================
export const queryGoodsReceiptsSchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 10),
  search: z.string().optional(),
  purchaseOrderId: z.string().uuid().optional(),
  status: z.enum(['PENDING_QC', 'QC_PASSED', 'QC_FAILED', 'PARTIALLY_ACCEPTED', 'COMPLETED']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  sortBy: z.string().optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type QueryGoodsReceiptsDto = z.infer<typeof queryGoodsReceiptsSchema>;

