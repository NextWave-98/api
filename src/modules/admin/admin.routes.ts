import { Router } from 'express';
import { getDashboardStats, getSuperAdminDashboard, getSystemLogs } from './admin.controller';
import { getAllPayments, getPaymentStats } from './admin.payment.controller';
import { authenticate, authorizePermissions } from '../../shared/middleware/auth.middleware';

const router = Router();

// All admin routes require authentication and admin dashboard permission
router.use(authenticate);
router.use(authorizePermissions('dashboard.admin'));

/**
 * @swagger
 * /admin/dashboard:
 *   get:
 *     summary: Get admin dashboard statistics (legacy)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics
 *       403:
 *         description: Forbidden
 */
router.get('/dashboard', getDashboardStats);

/**
 * @swagger
 * /admin/superadmin-dashboard:
 *   get:
 *     summary: Get comprehensive superadmin dashboard data
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Comprehensive dashboard data including shops, staff, inventory, sales, and job sheets
 *       403:
 *         description: Forbidden
 */
router.get('/superadmin-dashboard', getSuperAdminDashboard);

/**
 * @swagger
 * /admin/logs:
 *   get:
 *     summary: Get system logs
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: System logs
 *       403:
 *         description: Forbidden
 */
router.get('/logs', getSystemLogs);

/**
 * @swagger
 * /admin/payments/all:
 *   get:
 *     summary: Get all payments (incoming and outgoing)
 *     description: INCOMING = Customer/Job Sheet Payments (Income), OUTGOING = Supplier Payments (Expenses)
 *     tags: [Admin]
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
 *         name: paymentType
 *         schema:
 *           type: string
 *           enum: [INCOMING, OUTGOING, CUSTOMER, SUPPLIER]
 *         description: INCOMING/CUSTOMER for income, OUTGOING/SUPPLIER for expenses
 *       - in: query
 *         name: fromDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: toDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: All payments with income/expense classification
 */
router.get('/payments/all', getAllPayments);

/**
 * @swagger
 * /admin/payments/stats:
 *   get:
 *     summary: Get payment statistics with cash flow
 *     description: Returns incoming (revenue) vs outgoing (expenses) payments with net cash flow
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: fromDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: toDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Payment statistics with incoming/outgoing breakdown and net cash flow
 */
router.get('/payments/stats', getPaymentStats);

export default router;

