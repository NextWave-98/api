import { Request, Response } from 'express';
import { AdminService } from './admin.service';
import { ApiResponse } from '../../shared/utils/api-response';
import { asyncHandler } from '../../shared/utils/async-handler';

const adminService = new AdminService();

export const getDashboardStats = asyncHandler(async (req: Request, res: Response) => {
  const result = await adminService.getDashboardStats();
  ApiResponse.success(res, result, 'Dashboard stats retrieved successfully');
});

export const getSuperAdminDashboard = asyncHandler(async (req: Request, res: Response) => {
  const result = await adminService.getSuperAdminDashboard();
  ApiResponse.success(res, result, 'Superadmin dashboard data retrieved successfully');
});

export const getSystemLogs = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const result = await adminService.getSystemLogs(page, limit);
  ApiResponse.success(res, result, 'System logs retrieved successfully');
});

