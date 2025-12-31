import { Router } from 'express';
import stockReleaseController from './stockrelease.controller';
import { authenticate, authorizePermissions } from '../../shared/middleware/auth.middleware';
import { validate } from '../../shared/middleware/validation.middleware';
import {
  createStockReleaseSchema,
  updateStockReleaseSchema,
  approveStockReleaseSchema,
  releaseStockSchema,
  receiveStockSchema,
  getStockReleasesSchema,
} from './stockrelease.dto';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get statistics
router.get(
  '/stats',
  authorizePermissions('inventory.read', 'stock.read'),
  stockReleaseController.getStockTransferStats.bind(stockReleaseController)
);

// Get all stock releases with filters
router.get(
  '/',
  validate(getStockReleasesSchema),
  authorizePermissions('inventory.read', 'stock.read'),
  stockReleaseController.getAllStockReleases.bind(stockReleaseController)
);

// Get stock release by ID
router.get(
  '/:id',
  authorizePermissions('inventory.read', 'stock.read'),
  stockReleaseController.getStockReleaseById.bind(stockReleaseController)
);

// Create new stock release
router.post(
  '/',
  validate(createStockReleaseSchema),
  authorizePermissions('inventory:write', 'stock:write'),
  stockReleaseController.createStockRelease.bind(stockReleaseController)
);

// Update stock release (only PENDING)
router.put(
  '/:id',
  validate(updateStockReleaseSchema),
  authorizePermissions('inventory:write', 'stock:write'),
  stockReleaseController.updateStockRelease.bind(stockReleaseController)
);

// Delete stock release (only PENDING or CANCELLED)
router.delete(
  '/:id',
  authorizePermissions('inventory:delete', 'stock:delete'),
  stockReleaseController.deleteStockRelease.bind(stockReleaseController)
);

// Approve stock release
router.post(
  '/:id/approve',
  validate(approveStockReleaseSchema),
  authorizePermissions('inventory:approve', 'stock:approve'),
  stockReleaseController.approveStockRelease.bind(stockReleaseController)
);

// Release stock (decrement inventory)
router.post(
  '/:id/release',
  validate(releaseStockSchema),
  authorizePermissions('inventory:write', 'stock:write'),
  stockReleaseController.releaseStock.bind(stockReleaseController)
);

// Receive stock (increment inventory for transfers)
router.post(
  '/:id/receive',
  validate(receiveStockSchema),
  authorizePermissions('inventory:write', 'stock:write'),
  stockReleaseController.receiveStock.bind(stockReleaseController)
);

// Cancel stock release
router.post(
  '/:id/cancel',
  authorizePermissions('inventory:write', 'stock:write'),
  stockReleaseController.cancelStockRelease.bind(stockReleaseController)
);

export default router;

