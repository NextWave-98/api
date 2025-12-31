import { Router } from 'express';
import { authenticate, authorizePermissions } from '../../shared/middleware/auth.middleware';
import { validate } from '../../shared/middleware/validation.middleware';
import {
  createInventorySchema,
  updateInventorySchema,
  adjustStockSchema,
  adjustStockByIdSchema,
  transferStockSchema,
} from './inventory.dto';
import * as inventoryController from './inventory.controller';

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Inventory
 *   description: Inventory management endpoints
 */

/**
 * @swagger
 * /inventory:
 *   post:
 *     summary: Create product inventory record
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *               - locationId
 *               - quantity
 *             properties:
 *               productId:
 *                 type: string
 *               locationId:
 *                 type: string
 *               quantity:
 *                 type: integer
 *               minStockLevel:
 *                 type: integer
 *               maxStockLevel:
 *                 type: integer
 *               location:
 *                 type: string
 *               zone:
 *                 type: string
 *     responses:
 *       201:
 *         description: Inventory created successfully
 *   get:
 *     summary: Get all product inventory records
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: locationId
 *         schema:
 *           type: string
 *         description: Filter by location ID
 *       - in: query
 *         name: productId
 *         schema:
 *           type: string
 *         description: Filter by product ID
 *     responses:
 *       200:
 *         description: Inventory retrieved successfully
 */
router.post('/', authorizePermissions('inventory.create'), validate(createInventorySchema), inventoryController.createInventory);
router.get('/', authorizePermissions('inventory.read'), inventoryController.getInventory);

/**
 * @swagger
 * /inventory/dashboard-stats:
 *   get:
 *     summary: Get dashboard statistics with optional location filter
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: locationId
 *         schema:
 *           type: string
 *         description: Optional location ID to filter statistics
 *     responses:
 *       200:
 *         description: Dashboard statistics retrieved successfully
 */
router.get('/dashboard-stats', authorizePermissions('inventory.read'), inventoryController.getDashboardStats);

/**
  * @swagger  
  * /inventory/dashboard-stats-store:
  *   get:
  *     summary: Get dashboard statistics for warehouse locations
  *     tags: [Inventory]
  *     security:
  *       - bearerAuth: []
  *     parameters:
  *       - in: query
  *         name: locationId
  *         schema:
  *           type: string
  *         description: Optional location ID to filter statistics
  *     responses:
  *       200:
  *         description: Dashboard statistics for warehouse locations retrieved successfully
 */


router.get('/dashboard-stats-store', authorizePermissions('inventory.read'), inventoryController.getDashboardStatusStore);

/**
 * @swagger
 * /inventory/low-stock:
 *   get:
 *     summary: Get low stock items
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Low stock items retrieved successfully
 */
router.get('/low-stock', authorizePermissions('inventory.read'), inventoryController.getLowStockItems);

/**
 * @swagger
 * /inventory/movements:
 *   get:
 *     summary: Get stock movements
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Stock movements retrieved successfully
 */
router.get('/movements', authorizePermissions('inventory.read'), inventoryController.getStockMovements);

/**
 * @swagger
 * /inventory/location/{locationId}:
 *   get:
 *     summary: Get all products in a location with counts
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: locationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Location ID
 *     responses:
 *       200:
 *         description: Location inventory retrieved successfully
 */
router.get('/location/:locationId', authorizePermissions('inventory.read'), inventoryController.getLocationInventory);

/**
 * @swagger
 * /inventory/transfer:
 *   post:
 *     summary: Transfer product stock between branches
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *               - fromLocationId
 *               - toLocationId
 *               - quantity
 *             properties:
 *               productId:
 *                 type: string
 *               fromLocationId:
 *                 type: string
 *               toLocationId:
 *                 type: string
 *               quantity:
 *                 type: integer
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Stock transferred successfully
 */
router.post('/transfer', authorizePermissions('inventory.transfer'), validate(transferStockSchema), inventoryController.transferStock);

/**
 * Support adjusting stock when ID is provided in request body.
 * This route allows clients to call POST /api/inventory/adjust
 * (instead of /api/inventory/:id/adjust) and pass `{ id, ... }` in body.
 */
router.post('/adjust', authorizePermissions('inventory.adjust'), validate(adjustStockSchema), inventoryController.adjustStock);

/**
 * @swagger
 * /inventory/{id}:
 *   get:
 *     summary: Get inventory by ID
 *     tags: [Inventory]
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
 *         description: Inventory retrieved successfully
 *   put:
 *     summary: Update inventory
 *     tags: [Inventory]
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
 *         description: Inventory updated successfully
 */
router.get('/:id', authorizePermissions('inventory.read'), inventoryController.getInventoryById);
router.put('/:id', authorizePermissions('inventory.update'), validate(updateInventorySchema), inventoryController.updateInventory);

/**
 * @swagger
 * /inventory/{id}/adjust:
 *   post:
 *     summary: Adjust stock quantity
 *     tags: [Inventory]
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
 *               - quantity
 *               - movementType
 *             properties:
 *               quantity:
 *                 type: integer
 *               movementType:
 *                 type: string
 *                 enum: [IN, OUT, ADJUSTMENT, RETURN, DAMAGED]
 *     responses:
 *       200:
 *         description: Stock adjusted successfully
 */
router.post('/:id/adjust', authorizePermissions('inventory.adjust'), validate(adjustStockByIdSchema), inventoryController.adjustStock);

export default router;

