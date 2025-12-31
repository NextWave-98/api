import { Router } from 'express';
import { ProductReturnController } from './productreturn.controller';
import { authenticate } from '../../shared/middleware/auth.middleware';

const router = Router();
const productReturnController = new ProductReturnController();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/returns:
 *   post:
 *     summary: Create a new product return
 *     tags: [Product Returns]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customerId
 *               - productId
 *               - returnReason
 *               - returnCategory
 *               - quantity
 *             properties:
 *               customerId:
 *                 type: string
 *                 description: ID of the customer
 *               productId:
 *                 type: string
 *                 description: ID of the product
 *               returnReason:
 *                 type: string
 *                 description: Reason for return
 *               returnCategory:
 *                 type: string
 *                 enum: [DEFECTIVE, WRONG_ITEM, CUSTOMER_CHANGE_MIND, WARRANTY_CLAIM]
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *               locationId:
 *                 type: string
 *                 description: Location ID
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Product return created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/ProductReturn'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/', productReturnController.createReturn);

/**
 * @swagger
 * /api/returns:
 *   get:
 *     summary: Get all product returns with filters
 *     tags: [Product Returns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: locationId
 *         schema:
 *           type: string
 *         description: Filter by location ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, INSPECTED, APPROVED, REJECTED, PROCESSED, COMPLETED, CANCELLED]
 *         description: Filter by return status
 *       - in: query
 *         name: returnCategory
 *         schema:
 *           type: string
 *           enum: [DEFECTIVE, WRONG_ITEM, CUSTOMER_CHANGE_MIND, WARRANTY_CLAIM]
 *         description: Filter by return category
 *       - in: query
 *         name: customerId
 *         schema:
 *           type: string
 *         description: Filter by customer ID
 *       - in: query
 *         name: productId
 *         schema:
 *           type: string
 *         description: Filter by product ID
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of product returns
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ProductReturn'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/', productReturnController.getReturns);

/**
 * @swagger
 * /api/returns/stats:
 *   get:
 *     summary: Get product return statistics
 *     tags: [Product Returns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: locationId
 *         schema:
 *           type: string
 *         description: Filter by location ID
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for statistics
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for statistics
 *     responses:
 *       200:
 *         description: Return statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalReturns:
 *                       type: integer
 *                     pendingReturns:
 *                       type: integer
 *                     approvedReturns:
 *                       type: integer
 *                     rejectedReturns:
 *                       type: integer
 *                     processedReturns:
 *                       type: integer
 *                     totalValue:
 *                       type: number
 *                       format: float
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/stats', productReturnController.getReturnStats);

/**
 * @swagger
 * /api/returns/analytics:
 *   get:
 *     summary: Get product return analytics
 *     tags: [Product Returns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: locationId
 *         schema:
 *           type: string
 *         description: Filter by location ID
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for analytics
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for analytics
 *       - in: query
 *         name: groupBy
 *         schema:
 *           type: string
 *           enum: [day, week, month, category, product]
 *         description: Group analytics by
 *     responses:
 *       200:
 *         description: Return analytics data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/analytics', productReturnController.getReturnAnalytics);

/**
 * @swagger
 * /api/returns/number/{returnNumber}:
 *   get:
 *     summary: Get product return by return number
 *     tags: [Product Returns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: returnNumber
 *         required: true
 *         schema:
 *           type: string
 *         description: Return number
 *     responses:
 *       200:
 *         description: Product return details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/ProductReturn'
 *       404:
 *         description: Return not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/number/:returnNumber', productReturnController.getReturnByNumber);

/**
 * @swagger
 * /api/returns/{id}:
 *   get:
 *     summary: Get product return by ID
 *     tags: [Product Returns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Return ID
 *     responses:
 *       200:
 *         description: Product return details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/ProductReturn'
 *       404:
 *         description: Return not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/:id', productReturnController.getReturnById);

/**
 * @swagger
 * /api/returns/{id}/inspect:
 *   patch:
 *     summary: Inspect product return and record condition
 *     tags: [Product Returns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Return ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productCondition
 *             properties:
 *               productCondition:
 *                 type: string
 *                 enum: [NEW, LIKE_NEW, GOOD, FAIR, POOR, DAMAGED, DEFECTIVE]
 *               inspectionNotes:
 *                 type: string
 *               accessoriesIncluded:
 *                 type: string
 *     responses:
 *       200:
 *         description: Return inspected successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/ProductReturn'
 *       400:
 *         description: Bad request
 *       404:
 *         description: Return not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.patch('/:id/inspect', productReturnController.inspectReturn);

/**
 * @swagger
 * /api/returns/{id}/approve:
 *   patch:
 *     summary: Approve product return
 *     tags: [Product Returns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Return ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               approvalNotes:
 *                 type: string
 *               refundAmount:
 *                 type: number
 *                 format: float
 *               resolutionType:
 *                 type: string
 *                 enum: [REFUND, EXCHANGE, REPAIR, STORE_CREDIT]
 *     responses:
 *       200:
 *         description: Return approved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/ProductReturn'
 *       400:
 *         description: Bad request
 *       404:
 *         description: Return not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.patch('/:id/approve', productReturnController.approveReturn);

/**
 * @swagger
 * /api/returns/{id}/reject:
 *   patch:
 *     summary: Reject product return
 *     tags: [Product Returns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Return ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rejectionReason
 *             properties:
 *               rejectionReason:
 *                 type: string
 *               rejectionNotes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Return rejected successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/ProductReturn'
 *       400:
 *         description: Bad request
 *       404:
 *         description: Return not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.patch('/:id/reject', productReturnController.rejectReturn);

/**
 * @swagger
 * /api/returns/{id}/process:
 *   patch:
 *     summary: Process product return (execute resolution)
 *     tags: [Product Returns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Return ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               processingNotes:
 *                 type: string
 *               refundReference:
 *                 type: string
 *     responses:
 *       200:
 *         description: Return processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/ProductReturn'
 *       400:
 *         description: Bad request
 *       404:
 *         description: Return not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.patch('/:id/process', productReturnController.processReturn);

/**
 * @swagger
 * /api/returns/{id}:
 *   delete:
 *     summary: Cancel product return
 *     tags: [Product Returns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Return ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cancellationReason:
 *                 type: string
 *               cancellationNotes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Return cancelled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Bad request
 *       404:
 *         description: Return not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', productReturnController.cancelReturn);

export default router;

