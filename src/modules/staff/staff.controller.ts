import { Request, Response } from 'express';
import { StaffService } from './staff.service.sequelize';
import { ApiResponse } from '../../shared/utils/api-response';
import { asyncHandler } from '../../shared/utils/async-handler';
import { AppError } from '../../shared/utils/app-error';

const staffService = new StaffService();

export const getStaffDashboard = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;
  const locationId = user.roleName === 'ADMIN' ? undefined : req.user?.locationId;
  
  const result = await staffService.getStaffDashboard(user.userId, locationId);
  ApiResponse.success(res, result, 'Staff dashboard retrieved successfully');
});

export const getStaffList = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const user = req.user!;
  const locationId = user.roleName === 'ADMIN' ? undefined : req.user?.locationId;
  
  const result = await staffService.getStaffList(page, limit, locationId);
  ApiResponse.success(res, result, 'Staff list retrieved successfully');
});

export const getStaffById = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;
  const requestingUserLocationId = user.roleName === 'ADMIN' ? undefined : req.user?.locationId;
  
  const result = await staffService.getStaffById(req.params.id, requestingUserLocationId);
  ApiResponse.success(res, result, 'Staff member retrieved successfully');
});

export const getMyLocationInfo = asyncHandler(async (req: Request, res: Response) => {
  const result = await staffService.getMyLocationInfo(req.user!.userId);
  ApiResponse.success(res, result, 'Location information retrieved successfully');
});

// Create new staff member
export const createStaff = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;
  const requestingUserLocationId = user.roleName === 'ADMIN' ? undefined : user.locationId;
  
  const result = await staffService.createStaff(req.body, requestingUserLocationId);
  ApiResponse.success(res, result, 'Staff member created successfully', 201);
});

// Get all staff with filters
export const getAllStaff = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const user = req.user!;
  const requestingUserLocationId = user.roleName === 'ADMIN' ? undefined : user.locationId;
  
  const filters = {
    search: req.query.search as string,
    locationId: req.query.locationId as string,
    roleId: req.query.roleId as string,
    isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
  };
  
  const result = await staffService.getAllStaff(page, limit, requestingUserLocationId, filters);
  ApiResponse.success(res, result, 'Staff list retrieved successfully');
});

// Get staff details by ID
export const getStaffDetails = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;
  const requestingUserLocationId = user.roleName === 'ADMIN' ? undefined : user.locationId;
  
  const result = await staffService.getStaffDetailsById(req.params.id, requestingUserLocationId);
  ApiResponse.success(res, result, 'Staff details retrieved successfully');
});

// Update staff member
export const updateStaff = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;
  const requestingUserLocationId = user.roleName === 'ADMIN' ? undefined : user.locationId;
  
  const result = await staffService.updateStaff(req.params.id, req.body, requestingUserLocationId);
  ApiResponse.success(res, result, 'Staff member updated successfully');
});

// Upload staff profile image to Cloudinary
export const uploadStaffImage = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    throw new AppError(400, 'No image file provided');
  }

  const user = req.user!;
  const requestingUserLocationId = user.roleName === 'ADMIN' ? undefined : user.locationId;
  
  // Upload to Cloudinary using buffer
  const result = await staffService.updateStaffImage(req.params.id, req.file.buffer, requestingUserLocationId);
  ApiResponse.success(res, result, 'Staff profile image uploaded successfully');
});

// Assign staff to location
export const assignLocation = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;
  const requestingUserLocationId = user.roleName === 'ADMIN' ? undefined : user.locationId;
  
  const result = await staffService.assignStaffToLocation(
    req.params.id,
    req.body.locationId,
    requestingUserLocationId
  );
  ApiResponse.success(res, result, result.message);
});

// Delete staff member (soft delete)
export const deleteStaff = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;
  const requestingUserLocationId = user.roleName === 'ADMIN' ? undefined : user.locationId;
  
  const result = await staffService.deleteStaff(req.params.id, requestingUserLocationId);
  ApiResponse.success(res, result, 'Staff member deleted successfully');
});

// Activate staff member (set isActive = true)
export const activateStaff = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;
  const requestingUserLocationId = user.roleName === 'ADMIN' ? undefined : user.locationId;

  const result = await staffService.updateStaff(req.params.id, { isActive: true }, requestingUserLocationId);
  ApiResponse.success(res, result, 'Staff member activated successfully');
});

// Deactivate staff member (set isActive = false)
export const deactivateStaff = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;
  const requestingUserLocationId = user.roleName === 'ADMIN' ? undefined : user.locationId;

  const result = await staffService.updateStaff(req.params.id, { isActive: false }, requestingUserLocationId);
  ApiResponse.success(res, result, 'Staff member deactivated successfully');
});

