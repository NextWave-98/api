import { Router } from 'express';
import salesPOSController from './sales-pos.controller';
import { authenticate } from '../../shared/middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Sales POS
 *   description: Point of Sale transaction management endpoints
 */

/**
 * @swagger
 * /sales/pos:
 *   post:
 *     summary: Create new sale (POS transaction)
 *     tags: [Sales POS]
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
 *               - locationId
 *               - soldById
 *               - items
 *             properties:
 *               customerId:
 *                 type: string
 *               customerName:
 *                 type: string
 *               customerPhone:
 *                 type: string
 *               customerEmail:
 *                 type: string
 *               locationId:
 *                 type: string
 *               soldById:
 *                 type: string
 *               saleType:
 *                 type: string
 *                 enum: [POS, ONLINE, WHOLESALE]
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId:
 *                       type: string
 *                     quantity:
 *                       type: number
 *                     unitPrice:
 *                       type: number
 *                     discount:
 *                       type: number
 *                     tax:
 *                       type: number
 *                     warrantyMonths:
 *                       type: number
 *               payments:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     amount:
 *                       type: number
 *                     method:
 *                       type: string
 *                       enum: [CASH, CARD, BANK_TRANSFER, MOBILE_PAYMENT]
 *                     reference:
 *                       type: string
 *               discount:
 *                 type: number
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Sale created successfully
 *       400:
 *         description: Invalid request data
 */
router.post('/', salesPOSController.createSale);

/**
 * @swagger
 * /sales/pos:
 *   get:
 *     summary: Get sales list with filters
 *     tags: [Sales POS]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: locationId
 *         schema:
 *           type: string
 *       - in: query
 *         name: customerId
 *         schema:
 *           type: string
 *       - in: query
 *         name: soldById
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: paymentStatus
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Sales list retrieved successfully
 */
router.get('/', salesPOSController.getSales);

/**
 * @swagger
 * /sales/pos/{id}/invoice/download:
 *   get:
 *     summary: Download sale invoice as PDF
 *     tags: [Sales POS]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Sale ID
 *     responses:
 *       200:
 *         description: PDF file
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Sale not found
 */
router.get('/:id/invoice/download', salesPOSController.downloadInvoice);

/**
 * @swagger
 * /sales/pos/{id}/invoice/print:
 *   get:
 *     summary: Print sale invoice (inline PDF)
 *     tags: [Sales POS]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Sale ID
 *     responses:
 *       200:
 *         description: PDF file
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Sale not found
 */
router.get('/:id/invoice/print', salesPOSController.printInvoice);

/**
 * @swagger
 * /sales/pos/{id}/receipt:
 *   get:
 *     summary: Get sale receipt/invoice data
 *     tags: [Sales POS]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Sale ID
 *     responses:
 *       200:
 *         description: Receipt data retrieved successfully
 *       404:
 *         description: Sale not found
 */
router.get('/:id/receipt', salesPOSController.getSaleReceipt);

/**
 * @swagger
 * /sales/pos/{id}:
 *   get:
 *     summary: Get sale by ID
 *     tags: [Sales POS]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Sale ID
 *     responses:
 *       200:
 *         description: Sale retrieved successfully
 *       404:
 *         description: Sale not found
 */
router.get('/:id', salesPOSController.getSaleById);

/**
 * @swagger
 * /sales/pos/{id}/payments:
 *   post:
 *     summary: Add payment to sale
 *     tags: [Sales POS]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Sale ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - paymentMethod
 *               - receivedById
 *             properties:
 *               amount:
 *                 type: number
 *               paymentMethod:
 *                 type: string
 *                 enum: [CASH, CARD, BANK_TRANSFER, MOBILE_PAYMENT]
 *               reference:
 *                 type: string
 *               receivedById:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Payment added successfully
 *       400:
 *         description: Invalid request data
 *       404:
 *         description: Sale not found
 */
router.post('/:id/payments', salesPOSController.addPayment);

/**
 * @swagger
 * /sales/pos/{id}/refunds:
 *   post:
 *     summary: Create refund for sale
 *     tags: [Sales POS]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Sale ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - reason
 *               - refundMethod
 *               - processedById
 *             properties:
 *               amount:
 *                 type: number
 *               reason:
 *                 type: string
 *               refundMethod:
 *                 type: string
 *                 enum: [CASH, CARD, BANK_TRANSFER]
 *               processedById:
 *                 type: string
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId:
 *                       type: string
 *                     quantity:
 *                       type: number
 *     responses:
 *       201:
 *         description: Refund created successfully
 *       400:
 *         description: Invalid request data
 *       404:
 *         description: Sale not found
 */
router.post('/:id/refunds', salesPOSController.createRefund);

/**
 * @swagger
 * /sales/pos/{id}/cancel:
 *   post:
 *     summary: Cancel sale
 *     tags: [Sales POS]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Sale ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - reason
 *             properties:
 *               userId:
 *                 type: string
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Sale cancelled successfully
 *       400:
 *         description: Invalid request or sale cannot be cancelled
 *       404:
 *         description: Sale not found
 */
router.post('/:id/cancel', salesPOSController.cancelSale);

export default router;

