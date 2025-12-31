import { Request, Response } from 'express';
import { LocationService } from './location.service';
import { ApiResponse } from '../../shared/utils/api-response';
import { asyncHandler } from '../../shared/utils/async-handler';
import { LocationType } from '../../enums';

const locationService = new LocationService();

export const createLocation = asyncHandler(async (req: Request, res: Response) => {
  const result = await locationService.createLocation(req.body);
  ApiResponse.success(res, result, 'Location created successfully', 201);
});

export const getAllLocations = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const isActive = req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined;
  const branch = req.query.branch as string;
  let locationType: LocationType | undefined;
  
  if (branch === 'warehouse') {
    locationType = LocationType.WAREHOUSE;
  } else if (branch === 'branch') {
    locationType = LocationType.BRANCH;
  } else if (branch === 'all') {
    locationType = undefined;
  } else if (branch === undefined) {
    locationType = LocationType.BRANCH; // Default to branches
  }
  
  const warehouseOr = req.query.warehouseOr === 'true' ? true : req.query.warehouseOr === 'false' ? false : undefined;
  
  const result = await locationService.getAllLocations(page, limit, isActive, locationType, warehouseOr);
  ApiResponse.success(res, result, 'Locations retrieved successfully');
});

export const getLocationsByType = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const isActive = req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined;
  const locationType = req.params.type as LocationType;
  
  const result = await locationService.getLocationsByType(locationType, page, limit, isActive);
  ApiResponse.success(res, result, `${locationType}s retrieved successfully`);
});

export const getWarehouses = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const isActive = req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined;
  
  const result = await locationService.getWarehouses(page, limit, isActive);
  ApiResponse.success(res, result, 'Warehouses retrieved successfully');
});

export const getBranches = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const isActive = req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined;
  
  const result = await locationService.getBranches(page, limit, isActive);
  ApiResponse.success(res, result, 'Branches retrieved successfully');
});

export const getMainWarehouse = asyncHandler(async (req: Request, res: Response) => {
  const result = await locationService.getMainWarehouse();
  ApiResponse.success(res, result, 'Main warehouse retrieved successfully');
});

export const getLocationById = asyncHandler(async (req: Request, res: Response) => {
  const result = await locationService.getLocationById(req.params.id);
  ApiResponse.success(res, result, 'Location retrieved successfully');
});

export const updateLocation = asyncHandler(async (req: Request, res: Response) => {
  const result = await locationService.updateLocation(req.params.id, req.body);
  ApiResponse.success(res, result, 'Location updated successfully');
});

export const deleteLocation = asyncHandler(async (req: Request, res: Response) => {
  const result = await locationService.deleteLocation(req.params.id);
  ApiResponse.success(res, result, 'Location deleted successfully');
});

export const assignUserToLocation = asyncHandler(async (req: Request, res: Response) => {
  const { userId, locationId } = req.body;
  const result = await locationService.assignUserToLocation(userId, locationId);
  ApiResponse.success(res, result, 'User assigned to location successfully');
});

export const unassignUserFromLocation = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const result = await locationService.unassignUserFromLocation(userId);
  ApiResponse.success(res, result, 'User unassigned from location successfully');
});

export const getLocationUsers = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const result = await locationService.getLocationUsers(req.params.id, page, limit);
  ApiResponse.success(res, result, 'Location users retrieved successfully');
});

export const getLocationStats = asyncHandler(async (req: Request, res: Response) => {
  const result = await locationService.getLocationStats(req.params.id);
  ApiResponse.success(res, result, 'Location statistics retrieved successfully');
});

export const getLocationInventory = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const lowStock = req.query.lowStock === 'true';
  
  const result = await locationService.getLocationInventory(req.params.id, page, limit, lowStock);
  ApiResponse.success(res, result, 'Location inventory retrieved successfully');
});

