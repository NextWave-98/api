import { Router } from 'express';
import { ProductController } from './product.controller';
import { authenticate, authorizePermissions } from '../../shared/middleware/auth.middleware';
import { uploadCsvSingle } from '../../shared/middleware/upload.middleware';

const router = Router();
const controller = new ProductController();

// Apply authentication to all routes
router.use(authenticate);

/**
 * @swagger
 * /products:
 *   post:
 *     summary: Create a new product
 *     tags: [Products]
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
 *               - categoryId
 *               - unitPrice
 *               - costPrice
 *             properties:
 *               sku:
 *                 type: string
 *               barcode:
 *                 type: string
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               categoryId:
 *                 type: string
 *                 format: uuid
 *               brand:
 *                 type: string
 *               model:
 *                 type: string
 *               compatibility:
 *                 type: string
 *               specifications:
 *                 type: object
 *               unitPrice:
 *                 type: number
 *                 minimum: 0
 *               costPrice:
 *                 type: number
 *                 minimum: 0
 *               wholesalePrice:
 *                 type: number
 *                 minimum: 0
 *               marginPercentage:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *               taxRate:
 *                 type: number
 *                 minimum: 0
 *                 default: 0
 *               minStockLevel:
 *                 type: integer
 *                 default: 5
 *               maxStockLevel:
 *                 type: integer
 *                 default: 100
 *               reorderLevel:
 *                 type: integer
 *                 default: 10
 *               reorderQuantity:
 *                 type: integer
 *                 default: 20
 *               weight:
 *                 type: number
 *               dimensions:
 *                 type: string
 *               warrantyMonths:
 *                 type: integer
 *                 default: 0
 *               warrantyType:
 *                 type: string
 *                 enum: [STANDARD, EXTENDED, LIMITED, LIFETIME, NO_WARRANTY]
 *               qualityGrade:
 *                 type: string
 *                 enum: [A_GRADE, B_GRADE, C_GRADE, OEM, AFTERMARKET]
 *               isActive:
 *                 type: boolean
 *                 default: true
 *               images:
 *                 type: array
 *               primaryImage:
 *                 type: string
 *                 format: uri
 *     responses:
 *       201:
 *         description: Product created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post('/', authorizePermissions('products.create'), controller.create.bind(controller));

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Get all products with pagination and filters
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         description: Items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name, SKU, or barcode
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by category ID
 *       - in: query
 *         name: brand
 *         schema:
 *           type: string
 *         description: Filter by brand
 *       - in: query
 *         name: qualityGrade
 *         schema:
 *           type: string
 *           enum: [A_GRADE, B_GRADE, C_GRADE, OEM, AFTERMARKET]
 *         description: Filter by quality grade
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: string
 *         description: Filter by active status
 *       - in: query
 *         name: isDiscontinued
 *         schema:
 *           type: string
 *         description: Filter by discontinued status
 *       - in: query
 *         name: lowStock
 *         schema:
 *           type: string
 *         description: Show products below reorder level
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, productCode, unitPrice, createdAt]
 *           default: createdAt
 *         description: Sort field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: List of products
 *       401:
 *         description: Unauthorized
 */
router.get('/', authorizePermissions('products.read'), controller.getAll.bind(controller));

/**
 * @swagger
 * /products/low-stock:
 *   get:
 *     summary: Get products with low stock levels
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of low stock products
 *       401:
 *         description: Unauthorized
 */
router.get('/low-stock', authorizePermissions('products.read'), controller.getLowStock.bind(controller));

/**
 * @swagger
 * /products/stats:
 *   get:
 *     summary: Get product statistics
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Product statistics
 *       401:
 *         description: Unauthorized
 */
router.get('/stats', authorizePermissions('products.read'), controller.getStats.bind(controller));

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Get product by ID
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product details
 *       404:
 *         description: Product not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:id', authorizePermissions('products.read'), controller.getById.bind(controller));

/**
 * @swagger
 * /products/{id}:
 *   put:
 *     summary: Update product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sku:
 *                 type: string
 *               barcode:
 *                 type: string
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               categoryId:
 *                 type: string
 *                 format: uuid
 *               brand:
 *                 type: string
 *               model:
 *                 type: string
 *               unitPrice:
 *                 type: number
 *               costPrice:
 *                 type: number
 *               wholesalePrice:
 *                 type: number
 *               isActive:
 *                 type: boolean
 *               isDiscontinued:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Product updated successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: Product not found
 *       401:
 *         description: Unauthorized
 */
router.put('/:id', authorizePermissions('products.update'), controller.update.bind(controller));

/**
 * @swagger
 * /products/{id}:
 *   delete:
 *     summary: Delete product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product deleted successfully
 *       404:
 *         description: Product not found
 *       401:
 *         description: Unauthorized
 */
router.delete('/:id', authorizePermissions('products.delete'), controller.delete.bind(controller));

/**
 * @swagger
 * /products/bulk-price-update:
 *   post:
 *     summary: Bulk update product prices
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productIds
 *               - priceType
 *               - updateType
 *               - value
 *             properties:
 *               productIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 minItems: 1
 *               priceType:
 *                 type: string
 *                 enum: [unitPrice, costPrice, wholesalePrice]
 *               updateType:
 *                 type: string
 *                 enum: [percentage, fixed]
 *               value:
 *                 type: number
 *     responses:
 *       200:
 *         description: Prices updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post('/bulk-price-update', authorizePermissions('products.update'), controller.bulkPriceUpdate.bind(controller));

/**
 * @swagger
 * /products/transfer:
 *   post:
 *     summary: Transfer product between branches
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fromLocationId
 *               - toLocationId
 *               - productId
 *               - quantity
 *             properties:
 *               fromLocationId:
 *                 type: string
 *                 format: uuid
 *               toLocationId:
 *                 type: string
 *                 format: uuid
 *               productId:
 *                 type: string
 *                 format: uuid
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Product transferred successfully
 *       400:
 *         description: Bad request or insufficient stock
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Product or branch not found
 */
router.post('/transfer', authorizePermissions('products.transfer'), controller.transferProduct.bind(controller));

/**
 * @swagger
 * /products/bulk-transfer:
 *   post:
 *     summary: Transfer multiple products between branches
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fromLocationId
 *               - toLocationId
 *               - items
 *             properties:
 *               fromLocationId:
 *                 type: string
 *                 format: uuid
 *               toLocationId:
 *                 type: string
 *                 format: uuid
 *               items:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required:
 *                     - productId
 *                     - quantity
 *                   properties:
 *                     productId:
 *                       type: string
 *                       format: uuid
 *                     quantity:
 *                       type: integer
 *                       minimum: 1
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Products transferred successfully
 *       400:
 *         description: Bad request or insufficient stock
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Product or branch not found
 */
router.post('/bulk-transfer',
     authorizePermissions('products.transfer')
     , controller.bulkTransferProducts.bind(controller));

/**
 * @swagger
 * /products/adjust-stock:
 *   post:
 *     summary: Adjust product stock (add/remove/adjust inventory)
 *     tags: [Products]
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
 *               - movementType
 *             properties:
 *               productId:
 *                 type: string
 *                 format: uuid
 *               locationId:
 *                 type: string
 *                 format: uuid
 *               quantity:
 *                 type: integer
 *                 description: Positive for increase, negative for decrease
 *               movementType:
 *                 type: string
 *                 enum: [STOCK_IN, STOCK_OUT, ADJUSTMENT, RETURN, DAMAGE, LOST, FOUND]
 *               referenceType:
 *                 type: string
 *                 enum: [PURCHASE_ORDER, SUPPLIER_RETURN, CUSTOMER_RETURN, MANUAL, TRANSFER, JOB_SHEET, STOCK_RELEASE, OTHER]
 *               referenceId:
 *                 type: string
 *                 format: uuid
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Stock adjusted successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Product or branch not found
 */
router.post('/adjust-stock', authorizePermissions('products.update'), controller.adjustStock.bind(controller));

/**
 * @swagger
 * /products/stock-movements:
 *   get:
 *     summary: Get product stock movements
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: productId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by product ID
 *       - in: query
 *         name: locationId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by location ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Number of records to return
 *     responses:
 *       200:
 *         description: Stock movements retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/stock-movements', authorizePermissions('products.read'), controller.getStockMovements.bind(controller));

/**
 * @swagger
 * /products/bulk-upload:
 *   post:
 *     summary: Bulk upload products from CSV or Excel file
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: CSV or Excel (.xlsx, .xls) file containing product data
 *     responses:
 *       201:
 *         description: Products uploaded successfully
 *       400:
 *         description: Bad request - invalid file or data
 *       401:
 *         description: Unauthorized
 */
router.post('/bulk-upload', authenticate, authorizePermissions('products.create'), uploadCsvSingle('file'), controller.bulkUpload.bind(controller));

export default router;

