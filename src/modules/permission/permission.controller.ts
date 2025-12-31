import { Request, Response } from 'express';
import { PermissionService } from './permission.service';
import { ApiResponse } from '../../shared/utils/api-response';
import { asyncHandler } from '../../shared/utils/async-handler';

const permissionService = new PermissionService();

export const getAllPermissions = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 50;
  const search = req.query.search as string;
  const module = req.query.module as string;
  const result = await permissionService.getAllPermissions(page, limit, search, module);
  ApiResponse.success(res, result, 'Permissions retrieved successfully');
});

export const getPermissionById = asyncHandler(async (req: Request, res: Response) => {
  const result = await permissionService.getPermissionById(req.params.id);
  ApiResponse.success(res, result, 'Permission retrieved successfully');
});

