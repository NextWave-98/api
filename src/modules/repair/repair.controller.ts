import { Request, Response } from 'express';
import { RepairService } from './repair.service';
import { ApiResponse } from '../../shared/utils/api-response';
import { asyncHandler } from '../../shared/utils/async-handler';

const repairService = new RepairService();

export const createRepair = asyncHandler(async (req: Request, res: Response) => {
  const result = await repairService.createRepair(req.body);
  ApiResponse.success(res, result, 'Repair created successfully', 201);
});

export const getRepairs = asyncHandler(async (req: Request, res: Response) => {
  const jobSheetId = req.query.jobSheetId as string;
  const result = await repairService.getRepairs(jobSheetId);
  ApiResponse.success(res, result, 'Repairs retrieved successfully');
});

export const getRepairById = asyncHandler(async (req: Request, res: Response) => {
  const result = await repairService.getRepairById(req.params.id);
  ApiResponse.success(res, result, 'Repair retrieved successfully');
});

export const updateRepair = asyncHandler(async (req: Request, res: Response) => {
  const result = await repairService.updateRepair(req.params.id, req.body);
  ApiResponse.success(res, result, 'Repair updated successfully');
});

export const deleteRepair = asyncHandler(async (req: Request, res: Response) => {
  const result = await repairService.deleteRepair(req.params.id);
  ApiResponse.success(res, result, 'Repair deleted successfully');
});

