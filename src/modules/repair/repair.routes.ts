import { Router } from 'express';
import { authenticate } from '../../shared/middleware/auth.middleware';
import { validate } from '../../shared/middleware/validation.middleware';
import { createRepairSchema, updateRepairSchema } from './repair.dto';
import * as repairController from './repair.controller';

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Repairs
 *   description: Repair management endpoints
 */

/**
 * @swagger
 * /repairs:
 *   post:
 *     summary: Create a new repair
 *     tags: [Repairs]
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
 *               - repairType
 *               - description
 *             properties:
 *               jobSheetId:
 *                 type: string
 *               repairType:
 *                 type: string
 *               description:
 *                 type: string
 *               cost:
 *                 type: number
 *     responses:
 *       201:
 *         description: Repair created successfully
 *   get:
 *     summary: Get all repairs
 *     tags: [Repairs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Repairs retrieved successfully
 */
router.post('/', validate(createRepairSchema), repairController.createRepair);
router.get('/', repairController.getRepairs);

/**
 * @swagger
 * /repairs/{id}:
 *   get:
 *     summary: Get repair by ID
 *     tags: [Repairs]
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
 *         description: Repair retrieved successfully
 *   put:
 *     summary: Update repair
 *     tags: [Repairs]
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
 *         description: Repair updated successfully
 *   delete:
 *     summary: Delete repair
 *     tags: [Repairs]
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
 *         description: Repair deleted successfully
 */
router.get('/:id', repairController.getRepairById);
router.put('/:id', validate(updateRepairSchema), repairController.updateRepair);
router.delete('/:id', repairController.deleteRepair);

export default router;

