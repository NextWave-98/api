import { Request, Response } from 'express';
import { BranchService } from './branch.service';
import { ApiResponse } from '../../shared/utils/api-response';
import { asyncHandler } from '../../shared/utils/async-handler';

const branchService = new BranchService();

export const createBranch = asyncHandler(async (req: Request, res: Response) => {
  const result = await branchService.createBranch(req.body);
  ApiResponse.success(res, result, 'Branch created successfully', 201);
});

export const getAllBranches = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const isActive = req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined;
  const branch = req.query.branch as string;
  
  const result = await branchService.getAllBranches(page, limit, isActive, branch);
  ApiResponse.success(res, result, 'Branches retrieved successfully');
});

export const getBranchById = asyncHandler(async (req: Request, res: Response) => {
  const result = await branchService.getBranchById(req.params.id);
  ApiResponse.success(res, result, 'Branch retrieved successfully');
});

export const updateBranch = asyncHandler(async (req: Request, res: Response) => {
  const result = await branchService.updateBranch(req.params.id, req.body);
  ApiResponse.success(res, result, 'Branch updated successfully');
});

export const deleteBranch = asyncHandler(async (req: Request, res: Response) => {
  const result = await branchService.deleteBranch(req.params.id);
  ApiResponse.success(res, result, 'Branch deleted successfully');
});

export const assignUserToBranch = asyncHandler(async (req: Request, res: Response) => {
  const { userId, branchId } = req.body;
  const result = await branchService.assignUserToBranch(userId, branchId);
  ApiResponse.success(res, result, 'User assigned to branch successfully');
});

export const unassignUserFromBranch = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const result = await branchService.unassignUserFromBranch(userId);
  ApiResponse.success(res, result, 'User unassigned from branch successfully');
});

export const getBranchUsers = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const result = await branchService.getBranchUsers(req.params.id, page, limit);
  ApiResponse.success(res, result, 'Branch users retrieved successfully');
});

export const getBranchStats = asyncHandler(async (req: Request, res: Response) => {
  const result = await branchService.getBranchStats(req.params.id);
  ApiResponse.success(res, result, 'Branch statistics retrieved successfully');
});

