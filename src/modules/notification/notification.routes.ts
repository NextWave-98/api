import { Router } from 'express';
import { authenticate } from '../../shared/middleware/auth.middleware';
import { validate } from '../../shared/middleware/validation.middleware';
import {
  createNotificationSchema,
  updateNotificationStatusSchema,
  notificationQuerySchema,
} from './notification.dto';
import * as notificationController from './notification.controller';

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: Notification management endpoints
 */

/**
 * @swagger
 * /notifications:
 *   post:
 *     summary: Create a new notification
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - title
 *               - message
 *               - method
 *               - recipient
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [JOB_CREATED, JOB_STARTED, JOB_COMPLETED, READY_PICKUP, PAYMENT_RECEIVED, REMINDER, PROMOTION]
 *               title:
 *                 type: string
 *               message:
 *                 type: string
 *               method:
 *                 type: string
 *                 enum: [SMS, EMAIL, WHATSAPP]
 *               recipient:
 *                 type: string
 *     responses:
 *       201:
 *         description: Notification created successfully
 *   get:
 *     summary: Get all notifications
 *     tags: [Notifications]
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
 *         name: status
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notifications retrieved successfully
 */
router.post('/', validate(createNotificationSchema), notificationController.createNotification);
router.get('/', validate(notificationQuerySchema), notificationController.getNotifications);

/**
 * @swagger
 * /notifications/stats:
 *   get:
 *     summary: Get notification statistics
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 */
router.get('/stats', notificationController.getNotificationStats);

// =============================================
// SETTINGS ROUTES (must be before /:id routes)
// =============================================

/**
 * @swagger
 * /notifications/settings:
 *   get:
 *     summary: Get all notification settings
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 */
router.get('/settings', notificationController.getNotificationSettings);

/**
 * @swagger
 * /notifications/settings/{type}:
 *   get:
 *     summary: Get notification setting by type
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 */
router.get('/settings/:type', notificationController.getNotificationSettingByType);

/**
 * @swagger
 * /notifications/settings/{type}:
 *   patch:
 *     summary: Update notification setting
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 */
router.patch('/settings/:type', notificationController.updateNotificationSetting);

/**
 * @swagger
 * /notifications/settings/bulk-update:
 *   post:
 *     summary: Bulk update notification settings
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 */
router.post('/settings/bulk-update', notificationController.bulkUpdateNotificationSettings);

// =============================================
// RECIPIENT MANAGEMENT ROUTES (must be before /:id routes)
// =============================================

/**
 * @swagger
 * /notifications/recipients/admins:
 *   get:
 *     summary: Get all admin recipients
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 */
router.get('/recipients/admins', notificationController.getAdminRecipients);

/**
 * @swagger
 * /notifications/recipients/managers:
 *   get:
 *     summary: Get all manager recipients
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 */
router.get('/recipients/managers', notificationController.getManagerRecipients);

/**
 * @swagger
 * /notifications/recipients/by-role/{role}:
 *   get:
 *     summary: Get recipients by role
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 */
router.get('/recipients/by-role/:role', notificationController.getRecipientsByRole);

// =============================================
// USER-SPECIFIC ROUTES (must be before /:id routes)
// =============================================

/**
 * @swagger
 * /notifications/my:
 *   get:
 *     summary: Get current user's notifications
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 */
router.get('/my', notificationController.getMyNotifications);

/**
 * @swagger
 * /notifications/test:
 *   post:
 *     summary: Send test notification
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 */
router.post('/test', notificationController.sendTestNotification);

/**
 * @swagger
 * /notifications/send-job-notification:
 *   post:
 *     summary: Send job-related notification
 *     tags: [Notifications]
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
 *               - notificationType
 *             properties:
 *               jobSheetId:
 *                 type: string
 *               notificationType:
 *                 type: string
 *     responses:
 *       200:
 *         description: Notification sent successfully
 */
router.post('/send-job-notification', notificationController.sendJobNotification);

// =============================================
// SPECIFIC ID ROUTES (must be after all specific path routes)
// =============================================

/**
 * @swagger
 * /notifications/{id}/read:
 *   patch:
 *     summary: Mark notification as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 */
router.patch('/:id/read', notificationController.markNotificationAsRead);

/**
 * @swagger
 * /notifications/{id}/retry:
 *   post:
 *     summary: Retry failed notification
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 */
router.post('/:id/retry', notificationController.retryFailedNotification);

/**
 * @swagger
 * /notifications/{id}/status:
 *   patch:
 *     summary: Update notification status
 *     tags: [Notifications]
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
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PENDING, SENT, FAILED, DELIVERED]
 *     responses:
 *       200:
 *         description: Notification status updated successfully
 */
router.patch('/:id/status', validate(updateNotificationStatusSchema), notificationController.updateNotificationStatus);

/**
 * @swagger
 * /notifications/{id}:
 *   get:
 *     summary: Get notification by ID
 *     tags: [Notifications]
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
 *         description: Notification retrieved successfully
 *   delete:
 *     summary: Delete notification
 *     tags: [Notifications]
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
 *         description: Notification deleted successfully
 */
router.get('/:id', notificationController.getNotificationById);
router.delete('/:id', notificationController.deleteNotification);

export default router;

