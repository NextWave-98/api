import { Router } from 'express';
import { getAllPermissions, getPermissionById } from './permission.controller';
import { authenticate, authorizePermissions } from '../../shared/middleware/auth.middleware';

const router = Router();

// All permission routes require authentication and roles.manage permission
router.use(authenticate);
router.use(authorizePermissions('roles.manage'));

/**
 * @swagger
 * /permissions:
 *   get:
 *     summary: Get all permissions
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of permissions
 *       403:
 *         description: Forbidden
 */
router.get('/', getAllPermissions);

/**
 * @swagger
 * /permissions/{id}:
 *   get:
 *     summary: Get permission by ID
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Permission ID
 *     responses:
 *       200:
 *         description: Permission data
 *       404:
 *         description: Permission not found
 *       403:
 *         description: Forbidden
 */
router.get('/:id', getPermissionById);

export default router;

