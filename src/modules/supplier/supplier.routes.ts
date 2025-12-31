import { Router } from 'express';
import { SupplierController } from './supplier.controller';
import { authenticate, authorizePermissions } from '../../shared/middleware/auth.middleware';

const router = Router();
const controller = new SupplierController();

// Apply authentication to all routes
router.use(authenticate);

/**
 * @swagger
 * /suppliers:
 *   post:
 *     summary: Create a new supplier
 *     tags: [Suppliers]
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
 *               companyName:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *               alternatePhone:
 *                 type: string
 *               fax:
 *                 type: string
 *               website:
 *                 type: string
 *                 format: uri
 *               address:
 *                 type: string
 *               city:
 *                 type: string
 *               state:
 *                 type: string
 *               postalCode:
 *                 type: string
 *               country:
 *                 type: string
 *                 default: Sri Lanka
 *               taxId:
 *                 type: string
 *               registrationNumber:
 *                 type: string
 *               paymentTerms:
 *                 type: string
 *               creditLimit:
 *                 type: number
 *               creditDays:
 *                 type: integer
 *                 default: 30
 *               bankName:
 *                 type: string
 *               accountNumber:
 *                 type: string
 *               accountName:
 *                 type: string
 *               swiftCode:
 *                 type: string
 *               contactPersonName:
 *                 type: string
 *               contactPersonPhone:
 *                 type: string
 *               contactPersonEmail:
 *                 type: string
 *                 format: email
 *               contactPersonDesignation:
 *                 type: string
 *               rating:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 5
 *               supplierType:
 *                 type: string
 *                 enum: [LOCAL, INTERNATIONAL, MANUFACTURER, DISTRIBUTOR, WHOLESALER, RETAILER]
 *                 default: LOCAL
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, INACTIVE, BLACKLISTED, PENDING_APPROVAL]
 *                 default: ACTIVE
 *               documents:
 *                 type: object
 *               notes:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: Supplier created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post('/', authorizePermissions('suppliers.create'), controller.create.bind(controller));

/**
 * @swagger
 * /suppliers:
 *   get:
 *     summary: Get all suppliers with pagination and filters
 *     tags: [Suppliers]
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
 *         name: supplierType
 *         schema:
 *           type: string
 *           enum: [LOCAL, INTERNATIONAL, MANUFACTURER, DISTRIBUTOR, WHOLESALER, RETAILER]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, INACTIVE, BLACKLISTED, PENDING_APPROVAL]
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: string
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, supplierCode, createdAt, rating]
 *           default: createdAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: List of suppliers
 *       401:
 *         description: Unauthorized
 */
router.get('/', authorizePermissions('suppliers.read'), controller.getAll.bind(controller));

/**
 * @swagger
 * /suppliers/stats:
 *   get:
 *     summary: Get supplier statistics
 *     tags: [Suppliers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Supplier statistics
 *       401:
 *         description: Unauthorized
 */
router.get('/stats', authorizePermissions('suppliers.read'), controller.getStats.bind(controller));

/**
 * @swagger
 * /suppliers/{id}:
 *   get:
 *     summary: Get supplier by ID
 *     tags: [Suppliers]
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
 *         description: Supplier details
 *       404:
 *         description: Supplier not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:id', authorizePermissions('suppliers.read'), controller.getById.bind(controller));

/**
 * @swagger
 * /suppliers/{id}:
 *   put:
 *     summary: Update supplier
 *     tags: [Suppliers]
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
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *               city:
 *                 type: string
 *               supplierType:
 *                 type: string
 *                 enum: [LOCAL, INTERNATIONAL, MANUFACTURER, DISTRIBUTOR, WHOLESALER, RETAILER]
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, INACTIVE, BLACKLISTED, PENDING_APPROVAL]
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Supplier updated successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: Supplier not found
 *       401:
 *         description: Unauthorized
 */
router.put('/:id', authorizePermissions('suppliers.update'), controller.update.bind(controller));

/**
 * @swagger
 * /suppliers/{id}:
 *   delete:
 *     summary: Delete supplier
 *     tags: [Suppliers]
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
 *         description: Supplier deleted successfully
 *       404:
 *         description: Supplier not found
 *       401:
 *         description: Unauthorized
 */
router.delete('/:id', authorizePermissions('suppliers.delete'), controller.delete.bind(controller));

/**
 * @swagger
 * /suppliers/{id}/products:
 *   get:
 *     summary: Get products associated with supplier
 *     tags: [Suppliers]
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
 *         description: List of supplier products
 *       404:
 *         description: Supplier not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:id/products', authorizePermissions('suppliers.read'), controller.getProducts.bind(controller));

/**
 * @swagger
 * /suppliers/{id}/products:
 *   post:
 *     summary: Add product to supplier
 *     tags: [Suppliers]
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
 *               - supplierPrice
 *             properties:
 *               productId:
 *                 type: string
 *                 format: uuid
 *               supplierSKU:
 *                 type: string
 *               supplierPrice:
 *                 type: number
 *                 minimum: 0
 *               moq:
 *                 type: integer
 *                 minimum: 1
 *                 default: 1
 *               leadTimeDays:
 *                 type: integer
 *                 minimum: 0
 *                 default: 7
 *               isPrimary:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       201:
 *         description: Product added to supplier successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: Supplier not found
 *       401:
 *         description: Unauthorized
 */
router.post('/:id/products', authorizePermissions('suppliers.update'), controller.addProduct.bind(controller));

/**
 * @swagger
 * /suppliers/{id}/products/{productId}:
 *   put:
 *     summary: Update supplier product details
 *     tags: [Suppliers]
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
 *         name: productId
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
 *               supplierSKU:
 *                 type: string
 *               supplierPrice:
 *                 type: number
 *                 minimum: 0
 *               moq:
 *                 type: integer
 *                 minimum: 1
 *               leadTimeDays:
 *                 type: integer
 *                 minimum: 0
 *               isPrimary:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Supplier product updated successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: Product or supplier not found
 *       401:
 *         description: Unauthorized
 */
router.put('/:id/products/:productId', authorizePermissions('suppliers.update'), controller.updateProduct.bind(controller));

/**
 * @swagger
 * /suppliers/{id}/products/{productId}:
 *   delete:
 *     summary: Remove product from supplier
 *     tags: [Suppliers]
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
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Product removed from supplier successfully
 *       404:
 *         description: Product or supplier not found
 *       401:
 *         description: Unauthorized
 */
router.delete('/:id/products/:productId', authorizePermissions('suppliers.update'), controller.removeProduct.bind(controller));

/**
 * @swagger
 * /suppliers/{id}/performance:
 *   get:
 *     summary: Get supplier performance metrics
 *     tags: [Suppliers]
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
 *         description: Supplier performance data
 *       404:
 *         description: Supplier not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:id/performance', authorizePermissions('suppliers.read'), controller.getPerformance.bind(controller));

export default router;

