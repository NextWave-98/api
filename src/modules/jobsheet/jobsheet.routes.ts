import { Router } from 'express';
import { authenticate, authorizePermissions } from '../../shared/middleware/auth.middleware';
import { validate } from '../../shared/middleware/validation.middleware';
import {
  createJobSheetSchema,
  updateJobSheetSchema,
  updateJobSheetStatusSchema,
  jobSheetQuerySchema,
  addPartToJobSheetSchema,
  addProductToJobSheetSchema,
  downloadJobSheetSchema,
  printJobSheetSchema,
} from './jobsheet.dto';
import * as jobSheetController from './jobsheet.controller';

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: JobSheets
 *   description: Job sheet management endpoints
 */

/**
 * @swagger
 * /jobsheets:
 *   post:
 *     summary: Create a new job sheet
 *     tags: [JobSheets]
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
 *               - deviceId
 *               - locationId
 *               - issueDescription
 *             properties:
 *               customerId:
 *                 type: string
 *               deviceId:
 *                 type: string
 *               locationId:
 *                 type: string
 *               assignedToId:
 *                 type: string
 *               issueDescription:
 *                 type: string
 *               priority:
 *                 type: string
 *                 enum: [LOW, NORMAL, HIGH, URGENT]
 *     responses:
 *       201:
 *         description: Job sheet created successfully
 *   get:
 *     summary: Get all job sheets
 *     tags: [JobSheets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: dateFilter
 *         schema:
 *           type: string
 *           enum: [today, yesterday, this_week, this_year, custom]
 *           default: today
 *       - in: query
 *         name: fromDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: toDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Job sheets retrieved successfully
 */
// Create job sheet
router.post(
  '/',
  authorizePermissions('jobsheets.create'),
 validate(createJobSheetSchema),
  jobSheetController.createJobSheet
);

// Get all job sheets with pagination and filters
router.get(
  '/',
  authorizePermissions('jobsheets.read'),
 validate(jobSheetQuerySchema),
  jobSheetController.getJobSheets
);

/**
 * @swagger
 * /jobsheets/stats:
 *   get:
 *     summary: Get job sheet statistics
 *     tags: [JobSheets]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 */
router.get('/stats', authorizePermissions('jobsheets.read'), jobSheetController.getJobSheetStats);

/**
 * @swagger
 * /jobsheets/overdue:
 *   get:
 *     summary: Get overdue job sheets
 *     tags: [JobSheets]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Overdue job sheets retrieved successfully
 */
router.get('/overdue', authorizePermissions('jobsheets.read'), jobSheetController.getOverdueJobSheets);

/**
 * @swagger
 * /jobsheets/number/{jobNumber}:
 *   get:
 *     summary: Get job sheet by job number
 *     tags: [JobSheets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobNumber
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Job sheet retrieved successfully
 */
router.get('/number/:jobNumber', authorizePermissions('jobsheets.read'), jobSheetController.getJobSheetByJobNumber);

/**
 * @swagger
 * /jobsheets/{id}:
 *   get:
 *     summary: Get job sheet by ID
 *     tags: [JobSheets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Job sheet retrieved successfully
 *   put:
 *     summary: Update job sheet
 *     tags: [JobSheets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Job sheet updated successfully
 *   delete:
 *     summary: Delete job sheet
 *     tags: [JobSheets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Job sheet deleted successfully
 */
router.get('/:id', authorizePermissions('jobsheets.read'), jobSheetController.getJobSheetById);

// Update job sheet
router.put(
  '/:id',
  authorizePermissions('jobsheets.update'),
 validate(updateJobSheetSchema),
  jobSheetController.updateJobSheet
);

/**
 * @swagger
 * /jobsheets/{id}/status:
 *   patch:
 *     summary: Update job sheet status
 *     tags: [JobSheets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Status updated successfully
 */
router.patch(
  '/:id/status',
  authorizePermissions('jobsheets.manage'),
 validate(updateJobSheetStatusSchema),
  jobSheetController.updateJobSheetStatus
);

/**
 * @swagger
 * /jobsheets/{id}/parts:
 *   post:
 *     summary: Add part to job sheet
 *     tags: [JobSheets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - partId
 *               - quantity
 *             properties:
 *               partId:
 *                 type: string
 *               quantity:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Part added successfully
 */
router.post(
  '/:id/parts',
  authorizePermissions('jobsheets.manage'),
 validate(addPartToJobSheetSchema),
  jobSheetController.addPartToJobSheet
);

/**
 * @swagger
 * /jobsheets/{id}/parts/{partId}:
 *   delete:
 *     summary: Remove part from job sheet
 *     tags: [JobSheets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: partId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Part removed successfully
 */
router.delete('/:id/parts/:partId', authorizePermissions('jobsheets.manage'), jobSheetController.removePartFromJobSheet);

/**
 * @swagger
 * /jobsheets/{id}/status-history:
 *   get:
 *     summary: Get job sheet status history
 *     tags: [JobSheets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Status history retrieved successfully
 */
router.get('/:id/status-history', authorizePermissions('jobsheets.read'), jobSheetController.getJobSheetStatusHistory);

/**
 * @swagger
 * /jobsheets/{id}/payments:
 *   get:
 *     summary: Get job sheet payments
 *     tags: [JobSheets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payments retrieved successfully
 */
router.get('/:id/payments', authorizePermissions('jobsheets.read'), jobSheetController.getJobSheetPayments);

/**
 * @swagger
 * /jobsheets/{id}/products:
 *   post:
 *     summary: Add product to job sheet
 *     tags: [JobSheets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *               - quantity
 *               - unitPrice
 *               - costPrice
 *             properties:
 *               productId:
 *                 type: string
 *                 format: uuid
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *               unitPrice:
 *                 type: number
 *                 minimum: 0
 *               costPrice:
 *                 type: number
 *                 minimum: 0
 *               warrantyMonths:
 *                 type: integer
 *                 minimum: 0
 *               serialNumber:
 *                 type: string
 *               batchNumber:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Product added successfully
 *   get:
 *     summary: Get all products in job sheet
 *     tags: [JobSheets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Products retrieved successfully
 */
router.post(
  '/:id/products',
  authorizePermissions('jobsheets.manage'),
  validate(addProductToJobSheetSchema),
  jobSheetController.addProductToJobSheet
);

router.get('/:id/products', authorizePermissions('jobsheets.read'), jobSheetController.getJobSheetProducts);

/**
 * @swagger
 * /jobsheets/{id}/products/{productId}:
 *   delete:
 *     summary: Remove product from job sheet
 *     tags: [JobSheets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product removed successfully
 *   patch:
 *     summary: Update product status
 *     tags: [JobSheets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PENDING, RESERVED, INSTALLED, RETURNED, DEFECTIVE]
 *     responses:
 *       200:
 *         description: Product status updated successfully
 */
router.delete('/:id/products/:productId', authorizePermissions('jobsheets.manage'), jobSheetController.removeProductFromJobSheet);
router.patch('/:id/products/:productId', authorizePermissions('jobsheets.manage'), jobSheetController.updateProductStatus);

/**
 * @swagger
 * /jobsheets/{id}/download:
 *   get:
 *     summary: Download job sheet as PDF
 *     tags: [JobSheets]
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
 *         name: includeWarranty
 *         schema:
 *           type: boolean
 *           default: true
 *     responses:
 *       200:
 *         description: PDF file downloaded successfully
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get('/:id/download', authorizePermissions('jobsheets.read'), validate(downloadJobSheetSchema), jobSheetController.downloadJobSheet);

/**
 * @swagger
 * /jobsheets/{id}/print:
 *   get:
 *     summary: Print job sheet (returns PDF for printing)
 *     tags: [JobSheets]
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
 *         name: includeWarranty
 *         schema:
 *           type: boolean
 *           default: true
 *     responses:
 *       200:
 *         description: PDF file ready for printing
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get('/:id/print', authorizePermissions('jobsheets.read'), validate(printJobSheetSchema), jobSheetController.printJobSheet);

router.delete('/:id', authorizePermissions('jobsheets.delete'), jobSheetController.deleteJobSheet);

export default router;

