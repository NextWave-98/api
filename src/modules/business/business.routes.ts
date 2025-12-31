import { Router } from 'express';
import { authenticate, isAdmin } from '../../shared/middleware/auth.middleware';
import { validate } from '../../shared/middleware/validation.middleware';
import { uploadSingle } from '../../shared/middleware/upload.middleware';
import { updateBusinessSchema } from './business.dto';
import * as businessController from './business.controller';

const router = Router();

// All routes require authentication and admin role
router.use(authenticate);
router.use(isAdmin);

/**
 * @swagger
 * tags:
 *   name: Business
 *   description: Business profile management endpoints (Admin only)
 */

/**
 * @swagger
 * /business:
 *   get:
 *     summary: Get business profile
 *     tags: [Business]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Business profile retrieved successfully
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Access denied - Admin only
 */
router.get('/', businessController.getBusinessProfile);

/**
 * @swagger
 * /business:
 *   put:
 *     summary: Update business profile
 *     tags: [Business]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               logo:
 *                 type: string
 *                 format: binary
 *                 description: Business logo image file (JPEG, PNG, GIF)
 *               address:
 *                 type: string
 *               telephone:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Business profile updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Access denied - Admin only
 */
router.put(
  '/',
  uploadSingle('logo'),
  validate(updateBusinessSchema),
  businessController.updateBusinessProfile
);

export default router;
