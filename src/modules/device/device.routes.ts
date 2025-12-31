import { Router } from 'express';
import { authenticate, authorizePermissions } from '../../shared/middleware/auth.middleware';
import { validate } from '../../shared/middleware/validation.middleware';
import {
  createDeviceSchema,
  updateDeviceSchema,
  deviceQuerySchema,
} from './device.dto';
import * as deviceController from './device.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Devices
 *   description: Device management endpoints
 */

/**
 * @swagger
 * /devices:
 *   post:
 *     summary: Create a new device
 *     tags: [Devices]
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
 *               - deviceType
 *               - brand
 *               - model
 *             properties:
 *               customerId:
 *                 type: string
 *               deviceType:
 *                 type: string
 *                 enum: [MOBILE, TABLET, LAPTOP, DESKTOP, SMARTWATCH, OTHER]
 *               brand:
 *                 type: string
 *               model:
 *                 type: string
 *               serialNumber:
 *                 type: string
 *               imei:
 *                 type: string
 *               color:
 *                 type: string
 *               purchaseDate:
 *                 type: string
 *                 format: date-time
 *               warrantyExpiry:
 *                 type: string
 *                 format: date-time
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Device created successfully
 *   get:
 *     summary: Get all devices with pagination
 *     tags: [Devices]
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
 *         name: deviceType
 *         schema:
 *           type: string
 *       - in: query
 *         name: customerId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Devices retrieved successfully
 */
router.post(
  '/',
  authorizePermissions('devices.create'),
  validate(createDeviceSchema),
  deviceController.createDevice
);

router.get(
  '/',
  authorizePermissions('devices.read'),
  validate(deviceQuerySchema),
  deviceController.getDevices
);

/**
 * @swagger
 * /devices/search:
 *   get:
 *     summary: Search devices
 *     tags: [Devices]
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
router.get('/search', authorizePermissions('devices.read'), deviceController.searchDevices);

/**
 * @swagger
 * /devices/stats:
 *   get:
 *     summary: Get device statistics
 *     tags: [Devices]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 */
router.get('/stats', authorizePermissions('devices.read'), deviceController.getDeviceStats);

/**
 * @swagger
 * /devices/customer/{customerId}:
 *   get:
 *     summary: Get devices by customer ID
 *     tags: [Devices]
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
 *         description: Devices retrieved successfully
 */
router.get('/customer/:customerId', authorizePermissions('devices.read'), deviceController.getDevicesByCustomerId);

/**
 * @swagger
 * /devices/{id}/warranty:
 *   get:
 *     summary: Check device warranty status
 *     tags: [Devices]
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
 *         description: Warranty status retrieved successfully
 */
router.get('/:id/warranty', authorizePermissions('devices.read'), deviceController.checkWarranty);

/**
 * @swagger
 * /devices/{id}:
 *   get:
 *     summary: Get device by ID
 *     tags: [Devices]
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
 *         description: Device retrieved successfully
 *   put:
 *     summary: Update device
 *     tags: [Devices]
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
 *         description: Device updated successfully
 *   delete:
 *     summary: Delete device
 *     tags: [Devices]
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
 *         description: Device deleted successfully
 */
router.get('/:id', authorizePermissions('devices.read'), deviceController.getDeviceById);

router.put(
  '/:id',
  authorizePermissions('devices.update'),
  validate(updateDeviceSchema),
  deviceController.updateDevice
);

router.delete('/:id', authorizePermissions('devices.delete'), deviceController.deleteDevice);

export default router;

