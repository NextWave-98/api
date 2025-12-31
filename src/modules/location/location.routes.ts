import { Router } from 'express';
import { authenticate, authorizePermissions, isAdmin } from '../../shared/middleware/auth.middleware';
import { validate } from '../../shared/middleware/validation.middleware';
import {
  createLocationSchema,
  updateLocationSchema,
  assignUserToLocationSchema,
  getLocationUsersSchema,
  getLocationInventorySchema,
  getLocationsByTypeSchema,
} from './location.dto';
import {
  createLocation,
  getAllLocations,
  getLocationsByType,
  getWarehouses,
  getBranches,
  getMainWarehouse,
  getLocationById,
  updateLocation,
  deleteLocation,
  assignUserToLocation,
  unassignUserFromLocation,
  getLocationUsers,
  getLocationStats,
  getLocationInventory,
} from './location.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Locations
 *   description: Location management endpoints (Warehouses, Branches, Stores, Outlets)
 */

// Main warehouse route
router.get(
  '/warehouse/main',
  authorizePermissions('locations.read'),
  getMainWarehouse
);

// Warehouse-specific routes
router.get(
  '/warehouses',
  authorizePermissions('locations.read'),
  getWarehouses
);

// Branch-specific routes
router.get(
  '/branches',
  authorizePermissions('locations.read'),
  getBranches
);

// Get locations by type
router.get(
  '/type/:type',
  authorizePermissions('locations.read'),
  validate(getLocationsByTypeSchema),
  getLocationsByType
);

// Create location
router.post(
  '/',
  isAdmin,
  authorizePermissions('locations.create'),
  validate(createLocationSchema),
  createLocation
);

// Get all locations
router.get(
  '/',
  authorizePermissions('locations.read'),
  getAllLocations
);

// Get location by ID
router.get(
  '/:id',
  authorizePermissions('locations.read'),
  getLocationById
);

// Update location
router.put(
  '/:id',
  isAdmin,
  authorizePermissions('locations.update'),
  validate(updateLocationSchema),
  updateLocation
);

// Delete location
router.delete(
  '/:id',
  isAdmin,
  authorizePermissions('locations.delete'),
  deleteLocation
);

// User assignment routes
router.post(
  '/assign-user',
  isAdmin,
  authorizePermissions('locations.manage'),
  validate(assignUserToLocationSchema),
  assignUserToLocation
);

router.delete(
  '/unassign-user/:userId',
  isAdmin,
  authorizePermissions('locations.manage'),
  unassignUserFromLocation
);

// Location users
router.get(
  '/:id/users',
  authorizePermissions('locations.read'),
  validate(getLocationUsersSchema),
  getLocationUsers
);

// Location stats
router.get(
  '/:id/stats',
  authorizePermissions('locations.read'),
  getLocationStats
);

// Location inventory
router.get(
  '/:id/inventory',
  authorizePermissions('inventory.read'),
  validate(getLocationInventorySchema),
  getLocationInventory
);

export default router;

