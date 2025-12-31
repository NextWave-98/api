import { Router } from 'express';
import { authenticate } from '../../shared/middleware/auth.middleware';
import { validate } from '../../shared/middleware/validation.middleware';
import {
  getActivityLogs,
  getActivityLogById,
  getUserActivityLogs,
  getRecentActivity,
  getActivityStats,
  deleteOldLogs,
} from './activitylog.controller';
import { activityLogQuerySchema } from './activitylog.dto';

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: ActivityLogs
 *   description: Activity log and audit trail endpoints
 */

/**
 * @swagger
 * /activity-logs:
 *   get:
 *     summary: Get all activity logs
 *     tags: [ActivityLogs]
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
 *         name: userId
 *         schema:
 *           type: string
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *       - in: query
 *         name: module
 *         schema:
 *           type: string
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
 *     responses:
 *       200:
 *         description: Activity logs retrieved successfully
 */
router.get('/', validate(activityLogQuerySchema), getActivityLogs);

/**
 * @swagger
 * /activity-logs/recent:
 *   get:
 *     summary: Get recent activity
 *     tags: [ActivityLogs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Recent activity retrieved successfully
 */
router.get('/recent', getRecentActivity);

/**
 * @swagger
 * /activity-logs/stats:
 *   get:
 *     summary: Get activity statistics
 *     tags: [ActivityLogs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 */
router.get('/stats', getActivityStats);

/**
 * @swagger
 * /activity-logs/user/{userId}:
 *   get:
 *     summary: Get activity logs for a specific user
 *     tags: [ActivityLogs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: User activity logs retrieved successfully
 */
router.get('/user/:userId', getUserActivityLogs);

/**
 * @swagger
 * /activity-logs/{id}:
 *   get:
 *     summary: Get activity log by ID
 *     tags: [ActivityLogs]
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
 *         description: Activity log retrieved successfully
 */
router.get('/:id', getActivityLogById);

/**
 * @swagger
 * /activity-logs/cleanup:
 *   delete:
 *     summary: Delete old activity logs
 *     tags: [ActivityLogs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               daysToKeep:
 *                 type: integer
 *                 default: 90
 *     responses:
 *       200:
 *         description: Old logs deleted successfully
 */
router.delete('/cleanup', deleteOldLogs);

export default router;

