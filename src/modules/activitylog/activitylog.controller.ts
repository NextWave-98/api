import { Request, Response } from 'express';
import { ActivityLogService } from './activitylog.service';
import { ApiResponse } from '../../shared/utils/api-response';
import { asyncHandler } from '../../shared/utils/async-handler';
import { ActivityLogQueryDTO } from './activitylog.dto';

const activityLogService = new ActivityLogService();

export const getActivityLogs = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as ActivityLogQueryDTO;
  const result = await activityLogService.getActivityLogs(query);
  
  return ApiResponse.success(res, {
    activityLogs: result.activityLogs,
    pagination: result.pagination
  }, 'Activity logs retrieved successfully');
});

export const getActivityLogById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const activityLog = await activityLogService.getActivityLogById(id);
  
  return ApiResponse.success(res, activityLog, 'Activity log retrieved successfully');
});

export const getUserActivityLogs = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
  const activityLogs = await activityLogService.getUserActivityLogs(userId, limit);
  
  return ApiResponse.success(res, activityLogs, 'User activity logs retrieved successfully');
});

export const getRecentActivity = asyncHandler(async (req: Request, res: Response) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
  const activityLogs = await activityLogService.getRecentActivity(limit);
  
  return ApiResponse.success(res, activityLogs, 'Recent activity retrieved successfully');
});

export const getActivityStats = asyncHandler(async (req: Request, res: Response) => {
  const { fromDate, toDate } = req.query;
  const stats = await activityLogService.getActivityStats(
    fromDate as string,
    toDate as string
  );
  
  return ApiResponse.success(res, stats, 'Activity statistics retrieved successfully');
});

export const deleteOldLogs = asyncHandler(async (req: Request, res: Response) => {
  const daysToKeep = req.body.daysToKeep || 90;
  const result = await activityLogService.deleteOldLogs(daysToKeep);
  
  return ApiResponse.success(res, result, result.message);
});

