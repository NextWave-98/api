import { Router } from 'express';
import { ProductCategoryController } from './productcategory.controller';
import { authenticate, authorizePermissions } from '../../shared/middleware/auth.middleware';
import { uploadCsvSingle } from '../../shared/middleware/upload.middleware';

const router = Router();
const controller = new ProductCategoryController();

// Apply authentication to all routes
router.use(authenticate);

/**
 * @swagger
 * /productcategories:
 *   post:
 *     summary: Create a new product category
 *     tags: [Product Categories]
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
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               parentId:
 *                 type: string
 *                 format: uuid
 *               image:
 *                 type: string
 *                 format: uri
 *               isActive:
 *                 type: boolean
 *                 default: true
 *               displayOrder:
 *                 type: integer
 *                 default: 0
 *     responses:
 *       201:
 *         description: Category created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post('/', authorizePermissions('productcategories.create'), controller.create.bind(controller));

// Backwards-compatible alias: some clients call POST /productcategories/create
router.post('/create', authorizePermissions('productcategories.create'), controller.create.bind(controller));

/**
 * @swagger
 * /productcategories:
 *   get:
 *     summary: Get all product categories with pagination and filters
 *     tags: [Product Categories]
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
 *         name: parentId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: string
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, createdAt, displayOrder]
 *           default: displayOrder
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *     responses:
 *       200:
 *         description: List of product categories
 *       401:
 *         description: Unauthorized
 */
router.get('/', authorizePermissions('productcategories.read'), controller.getAll.bind(controller));

/**
 * @swagger
 * /productcategories/tree:
 *   get:
 *     summary: Get category tree structure
 *     tags: [Product Categories]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Hierarchical category tree
 *       401:
 *         description: Unauthorized
 */
router.get('/tree', authorizePermissions('productcategories.read'), controller.getTree.bind(controller));

/**
 * @swagger
 * /productcategories/stats:
 *   get:
 *     summary: Get product category statistics
 *     tags: [Product Categories]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Category statistics
 *       401:
 *         description: Unauthorized
 */
router.get('/stats', authorizePermissions('productcategories.read'), controller.getStats.bind(controller));

/**
 * @swagger
 * /productcategories/{id}:
 *   get:
 *     summary: Get product category by ID
 *     tags: [Product Categories]
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
 *         description: Category details
 *       404:
 *         description: Category not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:id', authorizePermissions('productcategories.read'), controller.getById.bind(controller));

/**
 * @swagger
 * /productcategories/{id}:
 *   put:
 *     summary: Update product category
 *     tags: [Product Categories]
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
 *               description:
 *                 type: string
 *               parentId:
 *                 type: string
 *                 format: uuid
 *               image:
 *                 type: string
 *                 format: uri
 *               isActive:
 *                 type: boolean
 *               displayOrder:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Category updated successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: Category not found
 *       401:
 *         description: Unauthorized
 */
router.put('/:id', authorizePermissions('productcategories.update'), controller.update.bind(controller));

/**
 * @swagger
 * /productcategories/{id}:
 *   delete:
 *     summary: Delete product category
 *     tags: [Product Categories]
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
 *         description: Category deleted successfully
 *       404:
 *         description: Category not found
 *       401:
 *         description: Unauthorized
 */
router.delete('/:id', authorizePermissions('productcategories.delete'), controller.delete.bind(controller));

/**
 * @swagger
 * /productcategories/bulk-upload:
 *   post:
 *     summary: Bulk upload product categories from CSV or Excel file
 *     tags: [Product Categories]
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
 *                 description: CSV or Excel (.xlsx, .xls) file containing product categories data
 *     responses:
 *       201:
 *         description: Categories uploaded successfully
 *       400:
 *         description: Bad request - invalid file or data
 *       401:
 *         description: Unauthorized
 */
router.post('/bulk-upload', authenticate, authorizePermissions('productcategories.create'), uploadCsvSingle('file'), controller.bulkUpload.bind(controller));

export default router;

