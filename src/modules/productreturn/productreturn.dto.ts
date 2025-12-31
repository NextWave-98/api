import { Priority } from '../../enums';

// ============================================
// CREATE PRODUCT RETURN
// ============================================

export interface CreateProductReturnDTO {
  locationId: string;
  sourceType: 'SALE' | 'WARRANTY_CLAIM' | 'JOB_SHEET' | 'STOCK_CHECK' | 'DIRECT' | 'GOODS_RECEIPT';
  sourceId?: string;
  
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  
  productId: string;
  quantity: number;
  productSerialNumber?: string;
  productBatchNumber?: string;
  
  returnReason: string;
  returnCategory: string;
  condition?: string;
  conditionNotes?: string;
  
  productValue: number;
  refundAmount?: number;
  
  priority?: Priority;
  images?: string[];
  notes?: string;
  createdById: string;
}

// ============================================
// INSPECT RETURN
// ============================================

export interface InspectReturnDTO {
  inspectedById: string;
  condition: string;
  conditionNotes?: string;
  recommendedAction: 'APPROVE' | 'REJECT' | 'ESCALATE';
  inspectionNotes?: string;
  images?: string[];
}

// ============================================
// APPROVE/REJECT RETURN
// ============================================

export interface ApproveReturnDTO {
  approvedById: string;
  resolutionType: string;
  approvalNotes?: string;
  refundAmount?: number;
}

export interface RejectReturnDTO {
  rejectedById: string;
  rejectionReason: string;
  notes?: string;
}

// ============================================
// PROCESS RETURN (Execute Resolution)
// ============================================

export interface ProcessReturnDTO {
  resolutionType: 'REFUND_PROCESSED' | 'RESTOCKED_BRANCH' | 'TRANSFERRED_WAREHOUSE' | 'RETURNED_SUPPLIER' | 'SCRAPPED';
  resolutionDetails?: string;
  notes?: string;
  
  // If refunding customer
  refundAmount?: number;
  refundMethod?: 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'MOBILE_PAYMENT' | 'CHECK' | 'OTHER';
  
  // If creating supplier return
  supplierReturnData?: {
    supplierId: string;
    reason: string;
    reasonDescription?: string;
  };
  
  // If transferring to warehouse
  transferToLocationId?: string;
  transferNotes?: string;
}

// ============================================
// QUERY RETURNS
// ============================================

export interface QueryProductReturnsDTO {
  locationId?: string;
  status?: string;
  returnCategory?: string;
  returnReason?: string;
  customerId?: string;
  productId?: string;
  sourceType?: string;
  sourceId?: string;
  priority?: Priority;
  startDate?: string;
  endDate?: string;
  page?: string;
  limit?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string; // Search in returnNumber, customerName, productName
}

// ============================================
// RETURN STATISTICS
// ============================================

export interface ProductReturnStatsQueryDTO {
  locationId?: string;
  startDate?: string;
  endDate?: string;
}

export interface ProductReturnStatsDTO {
  totalReturns: number;
  byCategory: Record<string, number>;
  byStatus: Record<string, number>;
  byReason: Record<string, number>;
  byCondition: Record<string, number>;
  totalValue: number;
  totalRefunded: number;
  averageProcessingTime: number; // in hours
  
  // Breakdown
  completedReturns: number;
  pendingReturns: number;
  rejectedReturns: number;
  
  // Resolutions
  byResolution: Record<string, number>;
}

// ============================================
// CANCEL RETURN
// ============================================

export interface CancelReturnDTO {
  cancelledById: string;
  reason: string;
  notes?: string;
}

// ============================================
// BULK OPERATIONS
// ============================================

export interface BulkApproveReturnsDTO {
  returnIds: string[];
  approvedById: string;
  resolutionType: string;
  notes?: string;
}

export interface BulkProcessReturnsDTO {
  returnIds: string[];
  resolutionType: string;
  notes?: string;
}

// ============================================
// RETURN ANALYTICS
// ============================================

export interface ReturnAnalyticsQueryDTO {
  locationId?: string;
  startDate?: string;
  endDate?: string;
  groupBy?: 'day' | 'week' | 'month';
}

export interface ReturnAnalyticsDTO {
  period: string;
  totalReturns: number;
  approvedReturns: number;
  rejectedReturns: number;
  pendingReturns: number;
  approvalRate: number;
  totalRefundAmount: number;
  topReturnedProducts: Array<{
    productId: string;
    productName: string;
    returnCount: number;
    totalValue: number;
  }>;
  topReturnCategories: Array<{
    category: string;
    count: number;
  }>;
  bySourceType: Record<string, number>;
  byCategory: Record<string, number>;
  byReason: Record<string, number>;
  topProducts: Array<{
    productId: string;
    productName: string;
    returnCount: number;
    totalValue: number;
  }>;
  returnRate: number; // percentage
  averageValue: number;
  trends: Array<{
    date: string;
    count: number;
    value: number;
  }>;
}

