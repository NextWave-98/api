import { Request, Response } from 'express';
import { WarrantyService } from './warranty.service';
import { ApiResponse } from '../../shared/utils/api-response';
import { asyncHandler } from '../../shared/utils/async-handler';
import {
  createWarrantyCardSchema,
  transferWarrantySchema,
  voidWarrantySchema,
  queryWarrantyCardsSchema,
  createWarrantyClaimSchema,
  updateClaimStatusSchema,
  resolveClaimSchema,
  assignClaimSchema,
  queryWarrantyClaimsSchema,
  warrantyAnalyticsQuerySchema,
  downloadWarrantyCardSchema,
  printWarrantyCardSchema,
} from './warranty.dto';
import { ZodError } from 'zod';

const warrantyService = new WarrantyService();

// ============================================
// WARRANTY CARD CONTROLLERS
// ============================================

/**
 * Get all warranty cards with filtering
 * GET /api/v1/warranty-cards
 */
export const getWarrantyCards = asyncHandler(async (req: Request, res: Response) => {
  try {
    const query = queryWarrantyCardsSchema.parse(req.query);
    const result = await warrantyService.getWarrantyCards(query);
    ApiResponse.success(res, result, 'Warranty cards retrieved successfully');
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ success: false, message: 'Validation error', errors: error.issues });
    }
    throw error;
  }
});

/**
 * Get warranty card by ID
 * GET /api/v1/warranty-cards/:id
 */
export const getWarrantyCardById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await warrantyService.getWarrantyCardById(id);
  ApiResponse.success(res, result, 'Warranty card retrieved successfully');
});

/**
 * Search warranty by identifier
 * GET /api/v1/warranty-cards/search/:identifier
 */
export const searchWarranty = asyncHandler(async (req: Request, res: Response) => {
  const { identifier } = req.params;
  const result = await warrantyService.searchWarranty(identifier);
  ApiResponse.success(res, result, 'Warranty search completed successfully');
});

/**
 * Get customer warranties
 * GET /api/v1/warranty-cards/customer/:customerId
 */
export const getCustomerWarranties = asyncHandler(async (req: Request, res: Response) => {
  const { customerId } = req.params;
  const result = await warrantyService.getCustomerWarranties(customerId);
  ApiResponse.success(res, result, 'Customer warranties retrieved successfully');
});

/**
 * Create warranty card manually
 * POST /api/v1/warranty-cards/generate
 */
export const createWarrantyCard = asyncHandler(async (req: Request, res: Response) => {
  try {
    const data = createWarrantyCardSchema.parse(req.body);
    const result = await warrantyService.createWarrantyCard(data);
    ApiResponse.success(res, result, 'Warranty card created successfully', 201);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ success: false, message: 'Validation error', errors: error.issues });
    }
    throw error;
  }
});

/**
 * Transfer warranty to new owner
 * PUT /api/v1/warranty-cards/:id/transfer
 */
export const transferWarranty = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = transferWarrantySchema.parse(req.body);
    const result = await warrantyService.transferWarranty(id, data);
    ApiResponse.success(res, result, 'Warranty transferred successfully');
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ success: false, message: 'Validation error', errors: error.issues });
    }
    throw error;
  }
});

/**
 * Void a warranty card
 * PUT /api/v1/warranty-cards/:id/void
 */
export const voidWarranty = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = voidWarrantySchema.parse(req.body);
    await warrantyService.voidWarranty(id, data);
    ApiResponse.success(res, null, 'Warranty voided successfully');
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ success: false, message: 'Validation error', errors: error.issues });
    }
    throw error;
  }
});

/**
 * Get expiring warranties
 * GET /api/v1/warranty-cards/expiring
 */
export const getExpiringWarranties = asyncHandler(async (req: Request, res: Response) => {
  const days = req.query.days ? parseInt(req.query.days as string) : 30;
  const locationId = req.query.locationId as string | undefined;
  const result = await warrantyService.getExpiringWarranties(days, locationId);
  ApiResponse.success(res, result, 'Expiring warranties retrieved successfully');
});

// ============================================
// WARRANTY CLAIM CONTROLLERS
// ============================================

/**
 * Get all warranty claims
 * GET /api/v1/warranty-claims
 */
export const getWarrantyClaims = asyncHandler(async (req: Request, res: Response) => {
  try {
    const query = queryWarrantyClaimsSchema.parse(req.query);
    const result = await warrantyService.getClaims(query);
    ApiResponse.success(res, result, 'Warranty claims retrieved successfully');
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ success: false, message: 'Validation error', errors: error.issues });
    }
    throw error;
  }
});

/**
 * Get claim by ID
 * GET /api/v1/warranty-claims/:id
 */
export const getClaimById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await warrantyService.getClaimById(id);
  ApiResponse.success(res, result, 'Warranty claim retrieved successfully');
});

/**
 * Create warranty claim
 * POST /api/v1/warranty-claims
 */
export const createWarrantyClaim = asyncHandler(async (req: Request, res: Response) => {
  try {
    const data = createWarrantyClaimSchema.parse(req.body);
    const result = await warrantyService.createClaim(data);
    ApiResponse.success(res, result, 'Warranty claim created successfully', 201);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ success: false, message: 'Validation error', errors: error.issues });
    }
    throw error;
  }
});

/**
 * Update claim status
 * PUT /api/v1/warranty-claims/:id/status
 */
export const updateClaimStatus = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = updateClaimStatusSchema.parse(req.body);
    const result = await warrantyService.updateClaimStatus(id, data);
    ApiResponse.success(res, result, 'Claim status updated successfully');
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ success: false, message: 'Validation error', errors: error.issues });
    }
    throw error;
  }
});

/**
 * Resolve warranty claim
 * PUT /api/v1/warranty-claims/:id/resolve
 */
export const resolveClaim = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = resolveClaimSchema.parse(req.body);
    const result = await warrantyService.resolveClaim(id, data);
    ApiResponse.success(res, result, 'Claim resolved successfully');
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ success: false, message: 'Validation error', errors: error.issues });
    }
    throw error;
  }
});

/**
 * Assign claim to staff
 * PUT /api/v1/warranty-claims/:id/assign
 */
export const assignClaim = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = assignClaimSchema.parse(req.body);
    await warrantyService.assignClaim(id, data);
    ApiResponse.success(res, null, 'Claim assigned successfully');
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ success: false, message: 'Validation error', errors: error.issues });
    }
    throw error;
  }
});

// ============================================
// ANALYTICS CONTROLLERS
// ============================================

/**
 * Get warranty analytics
 * GET /api/v1/warranty-cards/analytics/overview
 */
export const getAnalytics = asyncHandler(async (req: Request, res: Response) => {
  try {
    const query = warrantyAnalyticsQuerySchema.parse(req.query);
    const result = await warrantyService.getAnalytics(query);
    ApiResponse.success(res, result, 'Warranty analytics retrieved successfully');
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ success: false, message: 'Validation error', errors: error.issues });
    }
    throw error;
  }
});

/**
 * Get product warranty analytics
 * GET /api/v1/warranty-cards/analytics/product/:productId
 */
export const getProductAnalytics = asyncHandler(async (req: Request, res: Response) => {
  const { productId } = req.params;
  const result = await warrantyService.getProductAnalytics(productId);
  ApiResponse.success(res, result, 'Product warranty analytics retrieved successfully');
});

/**
 * Download warranty card as PDF
 * GET /api/v1/warranty-cards/:id/download
 */
export const downloadWarrantyCard = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const query = downloadWarrantyCardSchema.parse(req.query);
    const pdfBuffer = await warrantyService.downloadWarrantyCard(id, query);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="warranty_card_${id}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ success: false, message: 'Validation error', errors: error.issues });
    }
    throw error;
  }
});

/**
 * Print warranty card (returns PDF for printing)
 * GET /api/v1/warranty-cards/:id/print
 */
export const printWarrantyCard = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const query = printWarrantyCardSchema.parse(req.query);
    const pdfBuffer = await warrantyService.printWarrantyCard(id, query);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="warranty_card_${id}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ success: false, message: 'Validation error', errors: error.issues });
    }
    throw error;
  }
});

