import { Router } from 'express';
import { authenticate, authorizePermissions } from '../../shared/middleware/auth.middleware';
import * as salesController from './sales.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Sales
 *   description: Sales analytics and reporting endpoints
 */

/**
 * @swagger
 * /sales/dashboard:
 *   get:
 *     summary: Get comprehensive dashboard data (aggregated)
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for the period
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for the period
 *       - in: query
 *         name: branchId
 *         schema:
 *           type: string
 *         description: Filter by specific branch
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [today, yesterday, week, month, year, custom]
 *         description: Predefined time period
 *     responses:
 *       200:
 *         description: Dashboard data retrieved successfully
 */
router.get('/dashboard', authorizePermissions('view_sales'), salesController.getDashboard);

/**
 * @swagger
 * /sales/overview:
 *   get:
 *     summary: Get sales overview statistics
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for the period
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for the period
 *       - in: query
 *         name: branchId
 *         schema:
 *           type: string
 *         description: Filter by specific branch
 *     responses:
 *       200:
 *         description: Sales overview retrieved successfully
 */
router.get('/overview', authorizePermissions('view_sales'), salesController.getSalesOverview);

/**
 * @swagger
 * /sales/trends:
 *   get:
 *     summary: Get sales trends over time
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: branchId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Sales trends retrieved successfully
 */
router.get('/trends', authorizePermissions('view_sales'), salesController.getSalesTrends);

/**
 * @swagger
 * /sales/top-products:
 *   get:
 *     summary: Get top selling products
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: branchId
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Top products retrieved successfully
 */
router.get('/top-products', authorizePermissions('view_sales'), salesController.getTopProducts);

/**
 * @swagger
 * /sales/branch-performance:
 *   get:
 *     summary: Get branch performance metrics
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Branch performance retrieved successfully
 */
router.get('/branch-performance', authorizePermissions('view_sales'), salesController.getBranchPerformance);

/**
 * @swagger
 * /sales/staff-performance:
 *   get:
 *     summary: Get staff performance metrics
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: branchId
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Staff performance retrieved successfully
 */
router.get('/staff-performance', authorizePermissions('view_sales'), salesController.getStaffPerformance);

/**
 * @swagger
 * /sales/payment-methods:
 *   get:
 *     summary: Get payment method statistics
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: branchId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment method statistics retrieved successfully
 */
router.get('/payment-methods', authorizePermissions('view_sales'), salesController.getPaymentMethodStats);

/**
 * @swagger
 * /sales/revenue-breakdown:
 *   get:
 *     summary: Get revenue breakdown by category
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: branchId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Revenue breakdown retrieved successfully
 */
router.get('/revenue-breakdown', authorizePermissions('view_sales'), salesController.getRevenueBreakdown);

/**
 * @swagger
 * /sales/profit-analysis:
 *   get:
 *     summary: Get profit analysis
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: branchId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Profit analysis retrieved successfully
 */
router.get('/profit-analysis', authorizePermissions('view_sales'), salesController.getProfitAnalysis);

/**
 * @swagger
 * /sales/details:
 *   get:
 *     summary: Get detailed sales list with pagination
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: branchId
 *         schema:
 *           type: string
 *       - in: query
 *         name: staffId
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
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
 *         description: Sales details retrieved successfully
 */
router.get('/details', authorizePermissions('view_sales'), salesController.getSalesDetails);

/**
 * @swagger
 * /sales/customer-insights:
 *   get:
 *     summary: Get customer insights and analytics
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: branchId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Customer insights retrieved successfully
 */
router.get('/customer-insights', authorizePermissions('view_sales'), salesController.getCustomerInsights);

/**
 * @swagger
 * /sales/branch/dashboard:
 *   get:
 *     summary: Get branch manager's own branch sales dashboard
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [today, yesterday, week, month, year, custom]
 *     responses:
 *       200:
 *         description: Branch dashboard data retrieved successfully
 */
router.get('/branch/dashboard', authorizePermissions('view_sales'), salesController.getBranchDashboard);

/**
 * @swagger
 * /sales/branch/details:
 *   get:
 *     summary: Get detailed sales list for branch manager's branch
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
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
 *         description: Branch sales details retrieved successfully
 */
router.get('/branch/details', authorizePermissions('view_sales'), salesController.getBranchSalesDetails);

/**
 * @swagger
 * /sales/branch/enhanced-dashboard:
 *   get:
 *     summary: Get enhanced branch dashboard with jobsheet/POS breakdown and product counts
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Enhanced branch dashboard retrieved successfully
 */
router.get('/branch/enhanced-dashboard', authorizePermissions('view_sales'), salesController.getBranchEnhancedDashboard);

/**
 * @swagger
 * /sales/{id}:
 *   get:
 *     summary: Get sale by ID with full details including transactions
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Sale ID (can be a POS sale ID or JobSheet ID)
 *     responses:
 *       200:
 *         description: Sale details retrieved successfully
 *       404:
 *         description: Sale not found
 */
router.get('/:id', authorizePermissions('view_sales'), salesController.getSaleById);

export default router;

