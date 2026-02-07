import { z } from 'zod';
import { WarrantyType, WarrantyStatus, ClaimStatus, ClaimPriority, ResolutionType } from '../../enums';

// ============================================
// WARRANTY CARD DTOs
// ============================================

export const createWarrantyCardSchema = z.object({
  saleId: z.string().uuid(),
  saleItemId: z.string().uuid(),
  serialNumber: z.string().optional(),
  warrantyMonths: z.number().int().positive().optional(),
  customTerms: z.string().optional(),
  coverage: z.string().optional(),
  exclusions: z.string().optional(),
});

export const transferWarrantySchema = z.object({
  transferredTo: z.string().min(1),
  transferredPhone: z.string().min(10),
  transferredEmail: z.string().email().optional(),
  transferNotes: z.string().optional(),
});

export const voidWarrantySchema = z.object({
  reason: z.string().min(10),
});

export const downloadWarrantyCardSchema = z.object({
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
  includeConditions: z
    .union([z.boolean(), z.string()])
    .transform((val) => {
      if (typeof val === 'string') {
        return val.toLowerCase() === 'true';
      }
      return val;
    })
    .default(true),
});

export const printWarrantyCardSchema = z.object({
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
  includeConditions: z
    .union([z.boolean(), z.string()])
    .transform((val) => {
      if (typeof val === 'string') {
        return val.toLowerCase() === 'true';
      }
      return val;
    })
    .default(true),
});

// ============================================
// WARRANTY CLAIM DTOs
// ============================================

export const createWarrantyClaimSchema = z.object({
  warrantyCardId: z.string().uuid(),
  issueDescription: z.string().min(10),
  issueType: z.string().min(1),
  priority: z.nativeEnum(ClaimPriority).optional(),
  images: z.array(z.string()).optional(),
  documents: z.array(z.string()).optional(),
  locationId: z.string().uuid(),
  submittedById: z.string().uuid().optional(),
  estimatedCost: z.number().positive().optional(),
  actualCost: z.number().positive().optional(),
  customerCharge: z.number().positive().optional(),
});

export const updateClaimStatusSchema = z.object({
  status: z.nativeEnum(ClaimStatus),
  notes: z.string().optional(),
  assignedToId: z.string().uuid().optional(),
});

export const resolveClaimSchema = z.object({
  resolutionType: z.nativeEnum(ResolutionType),
  resolutionNotes: z.string().min(10),
  jobSheetId: z.string().uuid().optional(),
  replacementProductId: z.string().uuid().optional(),
  actualCost: z.number().positive().optional(),
  customerCharge: z.number().positive().optional(),
});

export const assignClaimSchema = z.object({
  assignedToId: z.string().uuid(),
});

export const queryWarrantyCardsSchema = z.object({
  page: z.string().transform(Number).pipe(z.number().int().positive()).optional(),
  limit: z.string().transform(Number).pipe(z.number().int().positive()).optional(),
  search: z.string().optional(),
  status: z.nativeEnum(WarrantyStatus).optional(),
  productId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
  locationId: z.string().uuid().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  isExpired: z.string().transform(val => val === 'true').optional(),
  isExpiringSoon: z.string().transform(val => val === 'true').optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export const queryWarrantyClaimsSchema = z.object({
  page: z.string().transform(Number).pipe(z.number().int().positive()).optional(),
  limit: z.string().transform(Number).pipe(z.number().int().positive()).optional(),
  search: z.string().optional(),
  status: z.nativeEnum(ClaimStatus).optional(),
  priority: z.nativeEnum(ClaimPriority).optional(),
  warrantyCardId: z.string().uuid().optional(),
  locationId: z.string().uuid().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export const warrantyAnalyticsQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  locationId: z.string().uuid().optional(),
});

// ============================================
// TYPE EXPORTS
// ============================================

export type CreateWarrantyCardDTO = z.infer<typeof createWarrantyCardSchema>;
export type TransferWarrantyDTO = z.infer<typeof transferWarrantySchema>;
export type VoidWarrantyDTO = z.infer<typeof voidWarrantySchema>;
export type QueryWarrantyCardsDTO = z.infer<typeof queryWarrantyCardsSchema>;

export type CreateWarrantyClaimDTO = z.infer<typeof createWarrantyClaimSchema>;
export type UpdateClaimStatLKRTO = z.infer<typeof updateClaimStatusSchema>;
export type ResolveClaimDTO = z.infer<typeof resolveClaimSchema>;
export type AssignClaimDTO = z.infer<typeof assignClaimSchema>;
export type QueryWarrantyClaimsDTO = z.infer<typeof queryWarrantyClaimsSchema>;

export type WarrantyAnalyticsQueryDTO = z.infer<typeof warrantyAnalyticsQuerySchema>;

// ============================================
// RESPONSE DTOs
// ============================================

export interface WarrantyCardResponseDTO {
  id: string;
  warrantyNumber: string;
  productName: string;
  productSku: string | null;
  productCode: string;
  serialNumber: string | null;
  customerName: string;
  customerPhone: string;
  warrantyType: WarrantyType;
  warrantyMonths: number;
  startDate: Date;
  expiryDate: Date;
  status: WarrantyStatus;
  daysRemaining?: number;
  isExpired: boolean;
  createdAt: Date;
}

export interface WarrantyClaimResponseDTO {
  id: string;
  claimNumber: string;
  warrantyNumber: string;
  issueDescription: string;
  issueType: string;
  status: ClaimStatus;
  priority: ClaimPriority;
  claimDate: Date;
  resolutionType: ResolutionType | null;
  resolutionDate: Date | null;
  customerName: string;
  locationName: string;
}

export interface WarrantyAnalyticsDTO {
  totalWarranties: number;
  activeWarranties: number;
  expiredWarranties: number;
  claimedWarranties: number;
  voidedWarranties: number;
  totalClaims: number;
  claimRate: number;
  approvalRate: number;
  averageClaimResolutionDays: number;
  topClaimedProducts: Array<{
    productId: string;
    productName: string;
    claimCount: number;
  }>;
  claimsByType: Array<{
    issueType: string;
    count: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    warrantiesIssued: number;
    claimsReceived: number;
  }>;
}

export type DownloadWarrantyCardDTO = z.infer<typeof downloadWarrantyCardSchema>;
export type PrintWarrantyCardDTO = z.infer<typeof printWarrantyCardSchema>;

