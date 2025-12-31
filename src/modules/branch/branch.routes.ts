import { Router } from 'express';
import { authenticate, authorizePermissions, isAdmin } from '../../shared/middleware/auth.middleware';
import { validate } from '../../shared/middleware/validation.middleware';
import {
  createBranchSchema,
  updateBranchSchema,
  assignUserToBranchSchema,
  getBranchUsersSchema,
} from './branch.dto';
import {
  createBranch,
  getAllBranches,
  getBranchById,
  updateBranch,
  deleteBranch,
  assignUserToBranch,
  unassignUserFromBranch,
  getBranchUsers,
  getBranchStats,
} from './branch.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: locations
 *   description: Branch management endpoints
 */

/**
 * @swagger
 * /locations:
 *   post:
 *     summary: Create a new branch
 *     tags: [locations]
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
 *                 example: Main Branch
 *               code:
 *                 type: string
 *                 example: MAI0001
 *                 description: Optional. Auto-generated if not provided (first 3 letters + sequence number)
 *               address:
 *                 type: string
 *                 example: 123 Main Street
 *               phone:
 *                 type: string
 *                 example: +1234567890
 *               email:
 *                 type: string
 *                 example: main@example.com
 *     responses:
 *       201:
 *         description: Branch created successfully
 *       400:
 *         description: Branch already exists
 *       403:
 *         description: Insufficient permissions
 */
router.post(
  '/',
  isAdmin,
  authorizePermissions('locations.create'),
  validate(createBranchSchema),
  createBranch
);

/**
 * @swagger
 * /locations:
 *   get:
 *     summary: Get all locations with pagination
 *     tags: [locations]
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
 *         name: isActive
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: branch
 *         schema:
 *           type: string
 *           enum: [branch, warehouse, all]
 *           description: Filter by location type. Use 'branch' for branches, 'warehouse' for warehouses, 'all' for all locations. Defaults to 'branch' if not specified.
 *     responses:
 *       200:
 *         description: locations retrieved successfully
 *       403:
 *         description: Insufficient permissions
 */
router.get(
  '/',
  authorizePermissions('locations.read'),
  getAllBranches 
);

/**
 * @swagger
 * /locations/assign:
 *   post:
 *     summary: Assign user to branch
 *     tags: [locations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - branchId
 *             properties:
 *               userId:
 *                 type: string
 *                 format: uuid
 *               branchId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: User assigned to branch successfully
 *       400:
 *         description: Admin users cannot be assigned to locations
 *       404:
 *         description: User or branch not found
 */
router.post(
  '/assign',
  isAdmin,
  authorizePermissions('locations.manage'),
  validate(assignUserToBranchSchema),
  assignUserToBranch
);

/**
 * @swagger
 * /locations/unassign/{userId}:
 *   delete:
 *     summary: Unassign user from branch
 *     tags: [locations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: User unassigned from branch successfully
 *       400:
 *         description: User is not assigned to any branch
 *       404:
 *         description: User not found
 */
router.delete(
  '/unassign/:userId',
  isAdmin,
  authorizePermissions('locations.manage'),
  unassignUserFromBranch
);

/**
 * @swagger
 * /locations/{id}:
 *   get:
 *     summary: Get branch by ID
 *     tags: [locations]
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
 *         description: Branch retrieved successfully
 *       404:
 *         description: Branch not found
 */
router.get(
  '/:id',
  authorizePermissions('locations.read'),
  getBranchById
);

/**
 * @swagger
 * /locations/{id}:
 *   put:
 *     summary: Update branch
 *     tags: [locations]
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
 *             properties:
 *               name:
 *                 type: string
 *               code:
 *                 type: string
 *               address:
 *                 type: string
 *               phone:
 *                 type: string
 *               email:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Branch updated successfully
 *       404:
 *         description: Branch not found
 */
router.put(
  '/:id',
  isAdmin,
  authorizePermissions('locations.update'),
  validate(updateBranchSchema),
  updateBranch
);

/**
 * @swagger
 * /locations/{id}:
 *   delete:
 *     summary: Delete branch
 *     tags: [locations]
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
 *         description: Branch deleted successfully
 *       400:
 *         description: Cannot delete branch with assigned users
 *       404:
 *         description: Branch not found
 */
router.delete(
  '/:id',
  isAdmin,
  authorizePermissions('locations.delete'),
  deleteBranch
);

/**
 * @swagger
 * /locations/{id}/users:
 *   get:
 *     summary: Get all users in a branch
 *     tags: [locations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
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
 *     responses:
 *       200:
 *         description: Branch users retrieved successfully
 *       404:
 *         description: Branch not found
 */
router.get(
  '/:id/users',
  authorizePermissions('locations.read', 'users.read'),
  validate(getBranchUsersSchema),
  getBranchUsers
);

/**
 * @swagger
 * /locations/{id}/stats:
 *   get:
 *     summary: Get branch statistics
 *     tags: [locations]
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
 *         description: Branch statistics retrieved successfully
 *       404:
 *         description: Branch not found
 */
router.get(
  '/:id/stats',
  authorizePermissions('locations.read'),
  getBranchStats
);

export default router;

