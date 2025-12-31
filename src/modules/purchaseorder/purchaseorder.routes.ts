import { Router } from 'express';
import { PurchaseOrderController } from './purchaseorder.controller';
import { authenticate, authorizePermissions } from '../../shared/middleware/auth.middleware';

const router = Router();
const controller = new PurchaseOrderController();

router.use(authenticate);

/**
 * @swagger
 * /purchaseorders:
 *   post:
 *     summary: Create a new purchase order
 *     tags: [Purchase Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - supplierId
 *               - items
 *             properties:
 *               supplierId:
 *                 type: string
 *                 format: uuid
 *               orderDate:
 *                 type: string
 *                 format: date-time
 *               expectedDate:
 *                 type: string
 *                 format: date-time
 *               priority:
 *                 type: string
 *                 enum: [LOW, NORMAL, HIGH, URGENT]
 *                 default: NORMAL
 *               paymentTerms:
 *                 type: string
 *               shippingMethod:
 *                 type: string
 *               shippingAddress:
 *                 type: string
 *               shippingCost:
 *                 type: number
 *                 default: 0
 *               discountAmount:
 *                 type: number
 *                 default: 0
 *               notes:
 *                 type: string
 *               internalNotes:
 *                 type: string
 *               items:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required:
 *                     - productId
 *                     - quantity
 *                     - unitPrice
 *                   properties:
 *                     productId:
 *                       type: string
 *                       format: uuid
 *                     quantity:
 *                       type: integer
 *                       minimum: 1
 *                     unitPrice:
 *                       type: number
 *                       minimum: 0
 *                     taxRate:
 *                       type: number
 *                       default: 0
 *                     discountPercent:
 *                       type: number
 *                       minimum: 0
 *                       maximum: 100
 *                       default: 0
 *                     notes:
 *                       type: string
 *     responses:
 *       201:
 *         description: Purchase order created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post('/', authorizePermissions('purchaseorders.create'), controller.create.bind(controller));

/**
 * @swagger
 * /purchaseorders:
 *   get:
 *     summary: Get all purchase orders with pagination and filters
 *     tags: [Purchase Orders]
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
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: supplierId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [DRAFT, SUBMITTED, CONFIRMED, PARTIALLY_RECEIVED, RECEIVED, COMPLETED, CANCELLED, ON_HOLD]
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [LOW, NORMAL, HIGH, URGENT]
 *       - in: query
 *         name: fromDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: toDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [poNumber, orderDate, totalAmount, createdAt]
 *           default: createdAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: List of purchase orders
 *       401:
 *         description: Unauthorized
 */
router.get('/', authorizePermissions('purchaseorders.read'), controller.getAll.bind(controller));

/**
 * @swagger
 * /purchaseorders/stats:
 *   get:
 *     summary: Get purchase order statistics
 *     tags: [Purchase Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Purchase order statistics
 *       401:
 *         description: Unauthorized
 */
router.get('/stats', authorizePermissions('purchaseorders.read'), controller.getStats.bind(controller));

/**
 * @swagger
 * /purchaseorders/{id}:
 *   get:
 *     summary: Get purchase order by ID
 *     tags: [Purchase Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Purchase order details
 *       404:
 *         description: Purchase order not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:id', authorizePermissions('purchaseorders.read'), controller.getById.bind(controller));

/**
 * @swagger
 * /purchaseorders/{id}:
 *   put:
 *     summary: Update purchase order
 *     tags: [Purchase Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               expectedDate:
 *                 type: string
 *                 format: date-time
 *               priority:
 *                 type: string
 *                 enum: [LOW, NORMAL, HIGH, URGENT]
 *               paymentTerms:
 *                 type: string
 *               shippingMethod:
 *                 type: string
 *               shippingAddress:
 *                 type: string
 *               shippingCost:
 *                 type: number
 *               discountAmount:
 *                 type: number
 *               notes:
 *                 type: string
 *               internalNotes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Purchase order updated successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: Purchase order not found
 *       401:
 *         description: Unauthorized
 */
router.put('/:id', authorizePermissions('purchaseorders.update'), controller.update.bind(controller));

/**
 * @swagger
 * /purchaseorders/{id}:
 *   delete:
 *     summary: Delete purchase order
 *     tags: [Purchase Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Purchase order deleted successfully
 *       404:
 *         description: Purchase order not found
 *       401:
 *         description: Unauthorized
 */
router.delete('/:id', authorizePermissions('purchaseorders.delete'), controller.delete.bind(controller));

/**
 * @swagger
 * /purchaseorders/{id}/status:
 *   patch:
 *     summary: Update purchase order status
 *     tags: [Purchase Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
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
 *                 enum: [DRAFT, SUBMITTED, CONFIRMED, PARTIALLY_RECEIVED, RECEIVED, COMPLETED, CANCELLED, ON_HOLD]
 *               remarks:
 *                 type: string
 *     responses:
 *       200:
 *         description: Status updated successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: Purchase order not found
 *       401:
 *         description: Unauthorized
 */
router.patch('/:id/status', authorizePermissions('purchaseorders.update'), controller.updateStatus.bind(controller));

/**
 * @swagger
 * /purchaseorders/{id}/approve:
 *   post:
 *     summary: Approve purchase order
 *     tags: [Purchase Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               approvedBy:
 *                 type: string
 *                 format: uuid
 *                 description: User ID who approved (defaults to authenticated user)
 *               notes:
 *                 type: string
 *                 description: Approval notes
 *     responses:
 *       200:
 *         description: Purchase order approved successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: Purchase order not found
 *       401:
 *         description: Unauthorized
 */
router.post('/:id/approve', authorizePermissions('purchaseorders.approve'), controller.approve.bind(controller));

/**
 * @swagger
 * /purchaseorders/{id}/receive:
 *   post:
 *     summary: Mark purchase order as received
 *     tags: [Purchase Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - locationId
 *             properties:
 *               receivedBy:
 *                 type: string
 *                 format: uuid
 *                 description: User ID who received (defaults to authenticated user)
 *               locationId:
 *                 type: string
 *                 format: uuid
 *                 description: Location where items are received
 *               notes:
 *                 type: string
 *                 description: Receipt notes
 *               autoUpdateInventory:
 *                 type: boolean
 *                 default: true
 *                 description: Automatically update inventory when receiving
 *     responses:
 *       200:
 *         description: Purchase order marked as received successfully and inventory updated
 *       400:
 *         description: Bad request
 *       404:
 *         description: Purchase order not found
 *       401:
 *         description: Unauthorized
 */
router.post('/:id/receive', authorizePermissions('purchaseorders.update'), controller.receive.bind(controller));

/**
 * @swagger
 * /purchaseorders/{id}/receive-items:
 *   post:
 *     summary: Receive specific items from purchase order (partial receive)
 *     tags: [Purchase Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - locationId
 *               - items
 *             properties:
 *               receivedBy:
 *                 type: string
 *                 format: uuid
 *                 description: User ID who received (defaults to authenticated user)
 *               locationId:
 *                 type: string
 *                 format: uuid
 *                 description: Location where items are received
 *               items:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required:
 *                     - productId
 *                     - quantityReceived
 *                   properties:
 *                     productId:
 *                       type: string
 *                       format: uuid
 *                     quantityReceived:
 *                       type: integer
 *                       minimum: 1
 *               notes:
 *                 type: string
 *                 description: Receipt notes
 *               autoUpdateInventory:
 *                 type: boolean
 *                 default: true
 *                 description: Automatically update inventory when receiving
 *     responses:
 *       200:
 *         description: Items received successfully and inventory updated
 *       400:
 *         description: Bad request
 *       404:
 *         description: Purchase order not found
 *       401:
 *         description: Unauthorized
 */
router.post('/:id/receive-items', authorizePermissions('purchaseorders.update'), controller.receiveWithItems.bind(controller));

/**
 * @swagger
 * /purchaseorders/{id}/cancel:
 *   post:
 *     summary: Cancel purchase order
 *     tags: [Purchase Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cancelledBy:
 *                 type: string
 *                 format: uuid
 *                 description: User ID who cancelled (defaults to authenticated user)
 *               reason:
 *                 type: string
 *                 description: Cancellation reason
 *     responses:
 *       200:
 *         description: Purchase order cancelled successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: Purchase order not found
 *       401:
 *         description: Unauthorized
 */
router.post('/:id/cancel', authorizePermissions('purchaseorders.delete'), controller.cancel.bind(controller));

/**
 * @swagger
 * /purchaseorders/{id}/items:
 *   post:
 *     summary: Add item to purchase order
 *     tags: [Purchase Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
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
 *               taxRate:
 *                 type: number
 *                 default: 0
 *               discountPercent:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *                 default: 0
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Item added successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: Purchase order not found
 *       401:
 *         description: Unauthorized
 */
router.post('/:id/items', authorizePermissions('purchaseorders.update'), controller.addItem.bind(controller));

/**
 * Submit purchase order (legacy endpoint)
 * This forwards to the status update handler with status=SUBMITTED
 */
router.post('/:id/submit', authorizePermissions('purchaseorders.update'), controller.submit.bind(controller));

/**
 * @swagger
 * /purchaseorders/{id}/items/{itemId}:
 *   put:
 *     summary: Update purchase order item
 *     tags: [Purchase Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *               unitPrice:
 *                 type: number
 *                 minimum: 0
 *               taxRate:
 *                 type: number
 *               discountPercent:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Item updated successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: Item not found
 *       401:
 *         description: Unauthorized
 */
router.put('/:id/items/:itemId', authorizePermissions('purchaseorders.update'), controller.updateItem.bind(controller));

/**
 * @swagger
 * /purchaseorders/{id}/items/{itemId}:
 *   delete:
 *     summary: Delete purchase order item
 *     tags: [Purchase Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Item deleted successfully
 *       404:
 *         description: Item not found
 *       401:
 *         description: Unauthorized
 */
router.delete('/:id/items/:itemId', authorizePermissions('purchaseorders.update'), controller.deleteItem.bind(controller));

export default router;

