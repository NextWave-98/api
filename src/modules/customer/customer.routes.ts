import { Router, Request, Response } from 'express';
import { authenticate, authorizePermissions } from '../../shared/middleware/auth.middleware';
import { validate } from '../../shared/middleware/validation.middleware';
import {
  createCustomerSchema,
  updateCustomerSchema,
  customerQuerySchema,
} from './customer.dto';
import * as customerController from './customer.controller';
import * as deviceController from '../device/device.controller';
import { asyncHandler } from '../../shared/utils/async-handler';
import { DeviceService } from '../device/device.service';
import { ApiResponse } from '../../shared/utils/api-response';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Customers
 *   description: Customer management endpoints
 */

/**
 * @swagger
 * /customers:
 *   post:
 *     summary: Create a new customer
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - phone
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               alternatePhone:
 *                 type: string
 *               address:
 *                 type: string
 *               city:
 *                 type: string
 *               nicNumber:
 *                 type: string
 *               locationId:
 *                 type: string
 *               customerType:
 *                 type: string
 *                 enum: [WALK_IN, REGULAR, VIP]
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Customer created successfully
 *       400:
 *         description: Validation error
 */
router.post(
  '/',
  validate(createCustomerSchema),
  customerController.createCustomer
);

/**
 * @swagger
 * /customers:
 *   get:
 *     summary: Get all customers with pagination
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: customerType
 *         schema:
 *           type: string
 *           enum: [WALK_IN, REGULAR, VIP]
 *       - in: query
 *         name: locationId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Customers retrieved successfully
 */
router.get(
  '/all',
  validate(customerQuerySchema),
  customerController.getCustomers
);

/**
 * @swagger
 * /customers/search:
 *   get:
 *     summary: Search customers by name, phone, or customer ID
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Search results retrieved successfully
 */
router.get('/search', customerController.searchCustomers);

/**
 * @swagger
 * /customers/stats:
 *   get:
 *     summary: Get customer statistics
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 */
router.get('/stats', customerController.getCustomerStats);

/**
 * @swagger
 * /customers/code/{customerId}:
 *   get:
 *     summary: Get customer by customer code (e.g., CUS0001)
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: customerId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Customer retrieved successfully
 *       404:
 *         description: Customer not found
 */
router.get('/code/:customerId', customerController.getCustomerByCustomerId);

/**
 * @swagger
 * /customers/{id}:
 *   get:
 *     summary: Get customer by ID
 *     tags: [Customers]
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
 *         description: Customer retrieved successfully
 *       404:
 *         description: Customer not found
 */
router.get('/:id', customerController.getCustomerById);

/**
 * @swagger
 * /customers/{id}:
 *   put:
 *     summary: Update customer
 *     tags: [Customers]
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
 *         description: Customer updated successfully
 *       404:
 *         description: Customer not found
 */
router.put(
  '/:id',
  validate(updateCustomerSchema),
  customerController.updateCustomer
);

/**
 * @swagger
 * /customers/{id}:
 *   delete:
 *     summary: Delete customer
 *     tags: [Customers]
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
 *         description: Customer deleted successfully
 *       404:
 *         description: Customer not found
 */
router.delete('/:id', customerController.deleteCustomer);

/**
 * @swagger
 * /customers/{id}/loyalty-points:
 *   post:
 *     summary: Add loyalty points to customer
 *     tags: [Customers]
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
 *               - points
 *             properties:
 *               points:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Loyalty points added successfully
 *       404:
 *         description: Customer not found
 */
router.post('/:id/loyalty-points', customerController.addLoyaltyPoints);

// Legacy/alternate path to get devices for a customer
// This provides `/customers/:id/devices` for clients that call this nested path.
router.get(
  '/:id/devices',
  authorizePermissions('devices.read'),
  asyncHandler(async (req: Request, res: Response) => {
    const deviceService = new DeviceService();
    const result = await deviceService.getDevicesByCustomerId(req.params.id);
    ApiResponse.success(res, result, 'Customer devices retrieved successfully');
  })
);

export default router;

