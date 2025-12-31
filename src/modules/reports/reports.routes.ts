import { Router } from 'express';
import reportsController from './reports.controller';
import { authenticate, authorizePermissions, authorizeRoles } from '../../shared/middleware/auth.middleware';

const router = Router();

/**
 * @route   POST /api/reports/generate
 * @desc    Generate a report based on type and period
 * @access  Private (Admin, Super Admin)
 */
router.post(
  '/generate',
  authenticate,
  authorizePermissions('read:reports'),
  reportsController.generateReport.bind(reportsController)
);

/**
 * @route   POST /api/reports/download
 * @desc    Download a report in specified format (json, excel, pdf, csv)
 * @access  Private (Admin, Super Admin)
 */
router.post(
  '/download',
  authenticate,
  authorizePermissions('download:reports'),
  reportsController.downloadReport.bind(reportsController)
);

export default router;

