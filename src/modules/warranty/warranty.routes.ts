import { Router } from 'express';
import { authenticate, authorizePermissions } from '../../shared/middleware/auth.middleware';
import * as warrantyController from './warranty.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Warranty
 *   description: Warranty card and claim management endpoints
 */

// ============================================
// WARRANTY CARD ROUTES
// ============================================

/**
 * @swagger
 * /warranty-cards:
 *   get:
 *     summary: Get all warranty cards with filtering
 *     tags: [Warranty]
 *     security:
 *       - bearerAuth: []
 */
router.get('/warranty-cards', warrantyController.getWarrantyCards);

/**
 * @swagger
 * /warranty-cards/expiring:
 *   get:
 *     summary: Get warranties expiring soon
 *     tags: [Warranty]
 *     security:
 *       - bearerAuth: []
 */
router.get('/warranty-cards/expiring', warrantyController.getExpiringWarranties);

/**
 * @swagger
 * /warranty-cards/analytics/overview:
 *   get:
 *     summary: Get warranty analytics overview
 *     tags: [Warranty]
 *     security:
 *       - bearerAuth: []
 */
router.get('/warranty-cards/analytics/overview', warrantyController.getAnalytics);

/**
 * @swagger
 * /warranty-cards/analytics/product/:productId:
 *   get:
 *     summary: Get product-specific warranty analytics
 *     tags: [Warranty]
 *     security:
 *       - bearerAuth: []
 */
router.get('/warranty-cards/analytics/product/:productId', warrantyController.getProductAnalytics);

/**
 * @swagger
 * /warranty-cards/search/:identifier:
 *   get:
 *     summary: Search warranty by number, phone, or serial number
 *     tags: [Warranty]
 *     security:
 *       - bearerAuth: []
 */
router.get('/warranty-cards/search/:identifier', warrantyController.searchWarranty);

/**
 * @swagger
 * /warranty-cards/customer/:customerId:
 *   get:
 *     summary: Get all warranties for a customer
 *     tags: [Warranty]
 *     security:
 *       - bearerAuth: []
 */
router.get('/warranty-cards/customer/:customerId', warrantyController.getCustomerWarranties);

/**
 * @swagger
 * /warranty-cards/:id/download:
 *   get:
 *     summary: Download warranty card as PDF
 *     tags: [Warranty]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [pdf, print]
 *           default: pdf
 *       - in: query
 *         name: includeTerms
 *         schema:
 *           type: boolean
 *           default: true
 *       - in: query
 *         name: includeConditions
 *         schema:
 *           type: boolean
 *           default: true
 */
router.get('/warranty-cards/:id/download', warrantyController.downloadWarrantyCard);

/**
 * @swagger
 * /warranty-cards/:id/print:
 *   get:
 *     summary: Print warranty card (returns PDF for printing)
 *     tags: [Warranty]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: copies
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 10
 *           default: 1
 *       - in: query
 *         name: includeTerms
 *         schema:
 *           type: boolean
 *           default: true
 *       - in: query
 *         name: includeConditions
 *         schema:
 *           type: boolean
 *           default: true
 */
router.get('/warranty-cards/:id/print', warrantyController.printWarrantyCard);

/**
 * @swagger
 * /warranty-cards/:id:
 *   get:
 *     summary: Get warranty card by ID
 *     tags: [Warranty]
 *     security:
 *       - bearerAuth: []
 */
router.get('/warranty-cards/:id', warrantyController.getWarrantyCardById);

/**
 * @swagger
 * /warranty-cards/generate:
 *   post:
 *     summary: Manually generate warranty card (admin only)
 *     tags: [Warranty]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/warranty-cards/generate',
  authorizePermissions('warranty.create'),
  warrantyController.createWarrantyCard
);

/**
 * @swagger
 * /warranty-cards/:id/transfer:
 *   put:
 *     summary: Transfer warranty to new owner
 *     tags: [Warranty]
 *     security:
 *       - bearerAuth: []
 */
router.put(
  '/warranty-cards/:id/transfer',
  authorizePermissions('warranty.update'),
  warrantyController.transferWarranty
);

/**
 * @swagger
 * /warranty-cards/:id/void:
 *   put:
 *     summary: Void a warranty card
 *     tags: [Warranty]
 *     security:
 *       - bearerAuth: []
 */
router.put(
  '/warranty-cards/:id/void',
  authorizePermissions('warranty.void'),
  warrantyController.voidWarranty
);

// ============================================
// WARRANTY CLAIM ROUTES
// ============================================

/**
 * @swagger
 * /warranty-claims:
 *   get:
 *     summary: Get all warranty claims with filtering
 *     tags: [Warranty]
 *     security:
 *       - bearerAuth: []
 */
router.get('/warranty-claims', warrantyController.getWarrantyClaims);

/**
 * @swagger
 * /warranty-claims/:id:
 *   get:
 *     summary: Get claim details by ID
 *     tags: [Warranty]
 *     security:
 *       - bearerAuth: []
 */
router.get('/warranty-claims/:id', warrantyController.getClaimById);

/**
 * @swagger
 * /warranty-claims:
 *   post:
 *     summary: Create new warranty claim
 *     tags: [Warranty]
 *     security:
 *       - bearerAuth: []
 */
router.post('/warranty-claims', warrantyController.createWarrantyClaim);

/**
 * @swagger
 * /warranty-claims/:id/status:
 *   put:
 *     summary: Update claim status
 *     tags: [Warranty]
 *     security:
 *       - bearerAuth: []
 */
router.put(
  '/warranty-claims/:id/status',
  authorizePermissions('warranty.update'),
  warrantyController.updateClaimStatus
);

/**
 * @swagger
 * /warranty-claims/:id/resolve:
 *   put:
 *     summary: Resolve warranty claim
 *     tags: [Warranty]
 *     security:
 *       - bearerAuth: []
 */
router.put(
  '/warranty-claims/:id/resolve',
  authorizePermissions('warranty.resolve'),
  warrantyController.resolveClaim
);

/**
 * @swagger
 * /warranty-claims/:id/assign:
 *   put:
 *     summary: Assign claim to staff member
 *     tags: [Warranty]
 *     security:
 *       - bearerAuth: []
 */
router.put(
  '/warranty-claims/:id/assign',
  authorizePermissions('warranty.assign'),
  warrantyController.assignClaim
);

export default router;

