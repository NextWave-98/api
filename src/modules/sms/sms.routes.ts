import { Router } from 'express';
import { SMSController } from './sms.controller';
import { authenticate, authorizePermissions } from '../../shared/middleware/auth.middleware';

const router = Router();
const smsController = new SMSController();

/**
 * @route   POST /api/sms/send-single
 * @desc    Send single SMS via POST
 * @access  Private (Admin, Manager)
 */
router.post(
  '/send-single',
  authenticate,
  authorizePermissions('manage.sms'),
  smsController.sendSingleSMS
);

/**
 * @route   GET /api/sms/send-single-get
 * @desc    Send single SMS via GET
 * @access  Private (Admin, Manager)
 */
router.get(
  '/send-single-get',
  authenticate,
  authorizePermissions('manage.sms'),
  smsController.sendSingleSMSViaGet
);

/**
 * @route   POST /api/sms/send-bulk-same
 * @desc    Send bulk SMS with same message
 * @access  Private (Admin, Manager)
 */
router.post(
  '/send-bulk-same',
  authenticate,
  authorizePermissions('manage.sms'),
  smsController.sendBulkSameSMS
);

/**
 * @route   POST /api/sms/send-bulk-different
 * @desc    Send bulk SMS with different messages
 * @access  Private (Admin, Manager)
 */
router.post(
  '/send-bulk-different',
  authenticate,
  authorizePermissions('manage.sms'),
  smsController.sendBulkDifferentSMS
);

/**
 * @route   GET /api/sms/balance
 * @desc    Check SMS account balance
 * @access  Private (Admin)
 */
router.get(
  '/balance',
  authenticate,
  authorizePermissions('manage.sms'),
  smsController.checkBalance
);

/**
 * @route   GET /api/sms/logs
 * @desc    Get SMS logs
 * @access  Private (Admin, Manager)
 */
router.get(
  '/logs',
  authenticate,
  authorizePermissions('view.sms.logs'),
  smsController.getSMSLogs
);

/**
 * @route   GET /api/sms/stats
 * @desc    Get SMS statistics
 * @access  Private (Admin, Manager)
 */
router.get(
  '/stats',
  authenticate,
  authorizePermissions('view.sms.logs'),
  smsController.getSMSStats
);

export default router;

