import { Request, Response } from 'express';
import { InventoryService } from './inventory.service';
import { ApiResponse } from '../../shared/utils/api-response';
import { AppError } from '../../shared/utils/app-error';
import { asyncHandler } from '../../shared/utils/async-handler';

const inventoryService = new InventoryService();

export const createInventory = asyncHandler(async (req: Request, res: Response) => {
  const result = await inventoryService.createInventory(req.body);
  ApiResponse.success(res, result, 'Inventory created successfully', 201);
});

export const getInventory = asyncHandler(async (req: Request, res: Response) => {
  const { locationId, productId, search, sortBy, sortOrder } = req.query;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const result = await inventoryService.getInventory(
    locationId as string,
    productId as string,
    page,
    limit,
    search as string,
    sortBy as string,
    sortOrder as string
  );
  ApiResponse.success(res, result, 'Inventory retrieved successfully');
});

export const getInventoryById = asyncHandler(async (req: Request, res: Response) => {
  const result = await inventoryService.getInventoryById(req.params.id);
  ApiResponse.success(res, result, 'Inventory retrieved successfully');
});

export const updateInventory = asyncHandler(async (req: Request, res: Response) => {
  const result = await inventoryService.updateInventory(req.params.id, req.body);
  ApiResponse.success(res, result, 'Inventory updated successfully');
});

export const adjustStock = asyncHandler(async (req: Request, res: Response) => {
  let id = req.params.id ?? (req.body.id as string | undefined);
  if (!id) {
    const { productId, locationId } = req.body as { productId?: string; locationId?: string };
    if (!productId || !locationId) {
      throw new AppError(400, 'Inventory id or both productId and locationId are required');
    }
    const result = await inventoryService.getInventory(locationId, productId, 1, 1);
    if (!result.inventory || result.inventory.length === 0) {
      throw new AppError(404, 'Inventory not found for provided productId and locationId');
    }
    id = result.inventory[0].id as string;
  }
  const result = await inventoryService.adjustStock(id, req.body);
  ApiResponse.success(res, result, 'Stock adjusted successfully');
});

export const transferStock = asyncHandler(async (req: Request, res: Response) => {
  const result = await inventoryService.transferStock(req.body);
  ApiResponse.success(res, result, 'Stock transferred successfully');
});

export const getLowStockItems = asyncHandler(async (req: Request, res: Response) => {
  const locationId = req.query.locationId as string;
  const result = await inventoryService.getLowStockItems(locationId);
  ApiResponse.success(res, result, 'Low stock items retrieved successfully');
});

export const getStockMovements = asyncHandler(async (req: Request, res: Response) => {
  const { productId, locationId } = req.query;
  const result = await inventoryService.getStockMovements(
    productId as string,
    locationId as string
  );
  ApiResponse.success(res, result, 'Stock movements retrieved successfully');
});

export const getLocationInventory = asyncHandler(async (req: Request, res: Response) => {
  const locationId = req.params.locationId;
  const result = await inventoryService.getLocationInventory(locationId);
  ApiResponse.success(res, result, 'Location inventory retrieved successfully');
});

export const getDashboardStats = asyncHandler(async (req: Request, res: Response) => {
  const locationId = req.query.locationId as string | undefined;
  const result = await inventoryService.getDashboardStats(locationId);
  ApiResponse.success(res, result, 'Dashboard statistics retrieved successfully');
});

export const getDashboardStatusStore = asyncHandler( async (req: Request, res: Response) => {
  const locationId = req.query.locationId as string | undefined;
  const result = await inventoryService.getDashboardStatsStore(locationId);
  ApiResponse.success(res, result, 'Dashboard statistics retrieved successfully');
});

