import { Router } from 'express';
import { authenticate, authorizePermissions } from '../../shared/middleware/auth.middleware';
import { validate } from '../../shared/middleware/validation.middleware';
import {
  createSupplierPaymentSchema,
  updateSupplierPaymentSchema,
  supplierPaymentQuerySchema,
} from './supplierpayment.dto';
import * as supplierPaymentController from './supplierpayment.controller';

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: SupplierPayments
 *   description: Supplier payment management endpoints
 */

/**
 * @swagger
 * /supplier-payments:
 *   post:
 *     summary: Create a new supplier payment
 *     tags: [SupplierPayments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - purchaseOrderId
 *               - supplierId
 *               - amount
 *               - paymentMethod
 *             properties:
 *               purchaseOrderId:
 *                 type: string
 *               supplierId:
 *                 type: string
 *               amount:
 *                 type: number
 *               paymentMethod:
 *                 type: string
 *                 enum: [CASH, CARD, BANK_TRANSFER, MOBILE_PAYMENT, CHECK, OTHER]
 *     responses:
 *       201:
 *         description: Supplier payment created successfully
 *   get:
 *     summary: Get all supplier payments
 *     tags: [SupplierPayments]
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
 *         description: Supplier payments retrieved successfully
 */
router.post('/', authorizePermissions('supplier-payments.create'), validate(createSupplierPaymentSchema), supplierPaymentController.createSupplierPayment);
router.get('/', authorizePermissions('supplier-payments.read'), validate(supplierPaymentQuerySchema), supplierPaymentController.getSupplierPayments);

/**
 * @swagger
 * /supplier-payments/stats:
 *   get:
 *     summary: Get supplier payment statistics
 *     tags: [SupplierPayments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 */
router.get('/stats', authorizePermissions('supplier-payments.read'), supplierPaymentController.getSupplierPaymentStats);

/**
 * @swagger
 * /supplier-payments/number/{paymentNumber}:
 *   get:
 *     summary: Get supplier payment by payment number
 *     tags: [SupplierPayments]
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
 *         description: Supplier payment retrieved successfully
 */
router.get('/number/:paymentNumber', authorizePermissions('supplier-payments.read'), supplierPaymentController.getSupplierPaymentByPaymentNumber);

/**
 * @swagger
 * /supplier-payments/{id}:
 *   get:
 *     summary: Get supplier payment by ID
 *     tags: [SupplierPayments]
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
 *         description: Supplier payment retrieved successfully
 *   put:
 *     summary: Update supplier payment
 *     tags: [SupplierPayments]
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
 *             properties:
 *               amount:
 *                 type: number
 *               paymentMethod:
 *                 type: string
 *     responses:
 *       200:
 *         description: Supplier payment updated successfully
 *   delete:
 *     summary: Delete supplier payment
 *     tags: [SupplierPayments]
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
 *         description: Supplier payment deleted successfully
 */
router.get('/:id', authorizePermissions('supplier-payments.read'), supplierPaymentController.getSupplierPaymentById);
router.put('/:id', authorizePermissions('supplier-payments.update'), validate(updateSupplierPaymentSchema), supplierPaymentController.updateSupplierPayment);
router.delete('/:id', authorizePermissions('supplier-payments.delete'), supplierPaymentController.deleteSupplierPayment);

export default router;

