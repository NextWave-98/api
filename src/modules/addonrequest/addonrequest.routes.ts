import { Router } from 'express';
import { AddonRequestController } from './addonrequest.controller';
import { authenticate } from '../../shared/middleware/auth.middleware';
// import { authorize } from '../../shared/middleware/authorize.middleware';

const router = Router();
const addonRequestController = new AddonRequestController();

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/addon-requests
 * @desc    Create a new addon request
 * @access  Branch Staff, Branch Manager
 */
router.post(
  '/',
//   authorize(['BRANCH_STAFF', 'BRANCH_MANAGER', 'ADMIN']),
  addonRequestController.createAddonRequest
);

/**
 * @route   GET /api/addon-requests
 * @desc    Get all addon requests with filtering
 * @access  Admin, Branch Manager
 */
router.get(
  '/',
//   authorize(['ADMIN', 'BRANCH_MANAGER', 'WAREHOUSE_MANAGER']),
  addonRequestController.getAllAddonRequests
);

/**
 * @route   GET /api/addon-requests/stats
 * @desc    Get addon request statistics
 * @access  Admin, Branch Manager
 */
router.get(
  '/stats',
//   authorize(['ADMIN', 'BRANCH_MANAGER', 'WAREHOUSE_MANAGER']),
  addonRequestController.getAddonRequestStats
);

/**
 * @route   GET /api/addon-requests/:id
 * @desc    Get a single addon request by ID
 * @access  Admin, Branch Manager, Staff (own requests)
 */
router.get(
  '/:id',
//   authorize(['ADMIN', 'BRANCH_MANAGER', 'BRANCH_STAFF', 'WAREHOUSE_MANAGER']),
  addonRequestController.getAddonRequest
);

/**
 * @route   PUT /api/addon-requests/:id
 * @desc    Update an addon request
 * @access  Admin, Branch Manager
 */
router.put(
  '/:id',
//   authorize(['ADMIN', 'BRANCH_MANAGER', 'WAREHOUSE_MANAGER']),
  addonRequestController.updateAddonRequest
);

/**
 * @route   DELETE /api/addon-requests/:id
 * @desc    Delete an addon request
 * @access  Admin only
 */
router.delete(
  '/:id',
//   authorize(['ADMIN']),
  addonRequestController.deleteAddonRequest
);

/**
 * @route   POST /api/addon-requests/:id/resend-notification
 * @desc    Resend notification for an addon request
 * @access  Admin only
 */
router.post(
  '/:id/resend-notification',
//   authorize(['ADMIN']),
  addonRequestController.resendNotification
);

export default router;
