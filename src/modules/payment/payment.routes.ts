import { Router } from 'express';
import { authenticate, authorizePermissions } from '../../shared/middleware/auth.middleware';
import { validate } from '../../shared/middleware/validation.middleware';
import {
  createPaymentSchema,
  updatePaymentSchema,
  paymentQuerySchema,
} from './payment.dto';
import * as paymentController from './payment.controller';

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: Payment management endpoints
 */

/**
 * @swagger
 * /payments:
 *   post:
 *     summary: Create a new payment
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - jobSheetId
 *               - customerId
 *               - amount
 *               - paymentMethod
 *             properties:
 *               jobSheetId:
 *                 type: string
 *               customerId:
 *                 type: string
 *               amount:
 *                 type: number
 *               paymentMethod:
 *                 type: string
 *                 enum: [CASH, CARD, BANK_TRANSFER, MOBILE_PAYMENT, CHECK, OTHER]
 *     responses:
 *       201:
 *         description: Payment created successfully
 *   get:
 *     summary: Get all payments
 *     tags: [Payments]
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
 *         name: paymentMethod
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payments retrieved successfully
 */
router.post('/', authorizePermissions('payments.create'), validate(createPaymentSchema), paymentController.createPayment);
router.get('/', authorizePermissions('payments.read'), validate(paymentQuerySchema), paymentController.getPayments);

/**
 * @swagger
 * /payments/stats:
 *   get:
 *     summary: Get payment statistics
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 */
router.get('/stats', authorizePermissions('payments.read'), paymentController.getPaymentStats);

/**
 * @swagger
 * /payments/number/{paymentNumber}:
 *   get:
 *     summary: Get payment by payment number
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentNumber
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment retrieved successfully
 */
router.get('/number/:paymentNumber', authorizePermissions('payments.read'), paymentController.getPaymentByPaymentNumber);

/**
 * @swagger
 * /payments/{id}:
 *   get:
 *     summary: Get payment by ID
 *     tags: [Payments]
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
 *         description: Payment retrieved successfully
 *   put:
 *     summary: Update payment
 *     tags: [Payments]
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
 *         description: Payment updated successfully
 *   delete:
 *     summary: Delete payment
 *     tags: [Payments]
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
 *         description: Payment deleted successfully
 */
router.get('/:id', authorizePermissions('payments.read'), paymentController.getPaymentById);
router.put('/:id', authorizePermissions('payments.update'), validate(updatePaymentSchema), paymentController.updatePayment);
router.delete('/:id', authorizePermissions('payments.delete'), paymentController.deletePayment);

export default router;

