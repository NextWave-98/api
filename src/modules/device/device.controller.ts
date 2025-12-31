import { Request, Response } from 'express';
import { DeviceService } from './device.service';
import { ApiResponse } from '../../shared/utils/api-response';
import { asyncHandler } from '../../shared/utils/async-handler';

const deviceService = new DeviceService();

export const createDevice = asyncHandler(async (req: Request, res: Response) => {
  const result = await deviceService.createDevice(req.body);
  ApiResponse.success(res, result, 'Device created successfully', 201);
});

export const getDevices = asyncHandler(async (req: Request, res: Response) => {
  const result = await deviceService.getDevices(req.query as any);
  ApiResponse.success(res, result, 'Devices retrieved successfully');
});

export const getDeviceById = asyncHandler(async (req: Request, res: Response) => {
  const result = await deviceService.getDeviceById(req.params.id);
  ApiResponse.success(res, result, 'Device retrieved successfully');
});

export const getDevicesByCustomerId = asyncHandler(async (req: Request, res: Response) => {
  const result = await deviceService.getDevicesByCustomerId(req.params.customerId);
  ApiResponse.success(res, result, 'Customer devices retrieved successfully');
});

export const updateDevice = asyncHandler(async (req: Request, res: Response) => {
  const result = await deviceService.updateDevice(req.params.id, req.body);
  ApiResponse.success(res, result, 'Device updated successfully');
});

export const deleteDevice = asyncHandler(async (req: Request, res: Response) => {
  const result = await deviceService.deleteDevice(req.params.id);
  ApiResponse.success(res, result, 'Device deleted successfully');
});

export const getDeviceStats = asyncHandler(async (req: Request, res: Response) => {
  const result = await deviceService.getDeviceStats();
  ApiResponse.success(res, result, 'Device statistics retrieved successfully');
});

export const checkWarranty = asyncHandler(async (req: Request, res: Response) => {
  const result = await deviceService.checkWarranty(req.params.id);
  ApiResponse.success(res, result, 'Warranty status retrieved successfully');
});

export const searchDevices = asyncHandler(async (req: Request, res: Response) => {
  const { search, limit } = req.query;
  const result = await deviceService.searchDevices(
    search as string,
    limit ? parseInt(limit as string) : 10
  );
  ApiResponse.success(res, result, 'Devices found successfully');
});

