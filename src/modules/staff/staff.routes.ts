import { Router } from 'express';
import { 
  getStaffDashboard, 
  getStaffList, 
  getStaffById, 
  getMyLocationInfo,
  createStaff,
  getAllStaff,
  getStaffDetails,
  updateStaff,
  uploadStaffImage,
  deleteStaff,
  activateStaff,
  deactivateStaff,
  assignLocation
} from './staff.controller';
import { authenticate, authorizePermissions } from '../../shared/middleware/auth.middleware';
import { validate } from '../../shared/middleware/validation.middleware';
import { uploadSingle } from '../../shared/middleware/upload.middleware';
import {
  createStaffSchema,
  updateStaffSchema,
  getStaffByIdSchema,
  deleteStaffSchema,
  updateStaffImageSchema,
  assignLocationSchema
} from './staff.dto';

const router = Router();

// Staff routes require authentication
router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Staff
 *   description: Staff management endpoints
 */

/**
 * @swagger
 * /staff/dashboard:
 *   get:
 *     summary: Get staff dashboard (branch-scoped for Manager/Staff, all for Admin)
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Staff dashboard retrieved successfully
 *       403:
 *         description: Insufficient permissions
 */
router.get(
  '/dashboard',
  authorizePermissions('dashboard.staff'),
  getStaffDashboard
);

/**
 * @swagger
 * /staff:
 *   get:
 *     summary: Get all staff members (branch-scoped for Manager/Staff, all for Admin)
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         description: Staff list retrieved successfully
 *       403:
 *         description: Insufficient permissions
 */
router.get(
  '/',
  authorizePermissions('users.read'),
  getStaffList
);

/**
 * @swagger
 * /staff/my-location:
 *   get:
 *     summary: Get current user's location information
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Location information retrieved successfully
 *       404:
 *         description: User is not assigned to any location
 */
router.get(
  '/my-location',
  getMyLocationInfo
);

/**
 * @swagger
 * /staff/all:
 *   get:
 *     summary: Get all staff members with filters (branch-scoped for Manager/Staff)
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name, email, or NIC
 *       - in: query
 *         name: locationId
 *         schema:
 *           type: string
 *         description: Filter by location
 *       - in: query
 *         name: roleId
 *         schema:
 *           type: string
 *         description: Filter by role
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: Staff list retrieved successfully
 *       403:
 *         description: Insufficient permissions
 */
router.get(
  '/all',
  authorizePermissions('users.read'),
  getAllStaff
);

/**
 * @swagger
 * /staff/{id}:
 *   get:
 *     summary: Get staff member by ID (branch-scoped for Manager/Staff)
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Staff member retrieved successfully
 *       403:
 *         description: Access denied. Staff member belongs to different branch
 *       404:
 *         description: Staff member not found
 */
router.get(
  '/:id',
  authorizePermissions('users.read'),
  getStaffById
);

/**
 * @swagger
 * /staff/create:
 *   post:
 *     summary: Create new staff member with detailed information
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - name
 *               - password
 *               - roleId
 *               - nicNumber
 *             properties:
 *               email:
 *                 type: string
 *               name:
 *                 type: string
 *               password:
 *                 type: string
 *               roleId:
 *                 type: string
 *               locationId:
 *                 type: string
 *               nicNumber:
 *                 type: string
 *               dateOfBirth:
 *                 type: string
 *                 format: date-time
 *               address:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *               additionalPhone:
 *                 type: string
 *               emergencyContact:
 *                 type: string
 *               emergencyName:
 *                 type: string
 *               emergencyRelation:
 *                 type: string
 *               qualifications:
 *                 type: string
 *               experience:
 *                 type: string
 *               joiningDate:
 *                 type: string
 *                 format: date-time
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Staff member created successfully
 *       400:
 *         description: Validation error or duplicate entry
 *       403:
 *         description: Insufficient permissions
 */
router.post(
  '/create',
  authorizePermissions('users.create'),
  validate(createStaffSchema),
  createStaff
);

/**
 * @swagger
 * /staff/details/{id}:
 *   get:
 *     summary: Get detailed staff information by user ID
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Staff details retrieved successfully
 *       403:
 *         description: Access denied
 *       404:
 *         description: Staff member not found
 */
router.get(
  '/details/:id',
  authorizePermissions('users.read'),
  validate(getStaffByIdSchema),
  getStaffDetails
);

/**
 * @swagger
 * /staff/update/{id}:
 *   put:
 *     summary: Update staff member information
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               name:
 *                 type: string
 *               password:
 *                 type: string
 *               roleId:
 *                 type: string
 *               locationId:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *               nicNumber:
 *                 type: string
 *               dateOfBirth:
 *                 type: string
 *                 format: date-time
 *               address:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *               additionalPhone:
 *                 type: string
 *               emergencyContact:
 *                 type: string
 *               emergencyName:
 *                 type: string
 *               emergencyRelation:
 *                 type: string
 *               qualifications:
 *                 type: string
 *               experience:
 *                 type: string
 *               joiningDate:
 *                 type: string
 *                 format: date-time
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Staff member updated successfully
 *       400:
 *         description: Validation error
 *       403:
 *         description: Access denied
 *       404:
 *         description: Staff member not found
 */
router.put(
  '/update/:id',
  authorizePermissions('users.update'),
  validate(updateStaffSchema),
  updateStaff
);

/**
 * @swagger
 * /staff/activate/{id}:
 *   patch:
 *     summary: Activate a staff member (set isActive = true)
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Staff member activated successfully
 *       403:
 *         description: Access denied
 *       404:
 *         description: Staff member not found
 */
router.patch(
  '/activate/:id',
  authorizePermissions('users.update'),
  validate(getStaffByIdSchema),
  activateStaff
);

/**
 * @swagger
 * /staff/deactivate/{id}:
 *   patch:
 *     summary: Deactivate a staff member (set isActive = false)
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Staff member deactivated successfully
 *       403:
 *         description: Access denied
 *       404:
 *         description: Staff member not found
 */
router.patch(
  '/deactivate/:id',
  authorizePermissions('users.update'),
  validate(getStaffByIdSchema),
  deactivateStaff
);

/**
 * @swagger
 * /staff/upload-image/{id}:
 *   post:
 *     summary: Upload staff profile image
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Profile image uploaded successfully
 *       400:
 *         description: No image file provided
 *       403:
 *         description: Access denied
 *       404:
 *         description: Staff member not found
 */
router.post(
  '/upload-image/:id',
  authorizePermissions('users.update'),
  validate(updateStaffImageSchema),
  uploadSingle('image'),
  uploadStaffImage
);

/**
 * @swagger
 * /staff/delete/{id}:
 *   delete:
 *     summary: Delete staff member (soft delete - deactivate)
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Staff member deleted successfully
 *       403:
 *         description: Access denied
 *       404:
 *         description: Staff member not found
 */
router.delete(
  '/delete/:id',
  authorizePermissions('users.delete'),
  validate(deleteStaffSchema),
  deleteStaff
);

/**
 * @swagger
 * /staff/assign-location/{id}:
 *   patch:
 *     summary: Assign or reassign staff member to a location/branch
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               locationId:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *                 description: Location ID to assign (null to unassign)
 *               branchId:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *                 description: Branch ID to assign (null to unassign) - alternative to locationId
 *     responses:
 *       200:
 *         description: Staff member assigned to location/branch successfully
 *       400:
 *         description: Invalid request or user is not a staff member
 *       403:
 *         description: Access denied
 *       404:
 *         description: Staff member or location/branch not found
 */
router.patch(
  '/assign-location/:id',
  authorizePermissions('locations.manage'),
  validate(assignLocationSchema),
  assignLocation
);

export default router;

