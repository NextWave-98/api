import { Request, Response } from 'express';
import { RoleService } from './role.service';
import { ApiResponse } from '../../shared/utils/api-response';
import { asyncHandler } from '../../shared/utils/async-handler';

const roleService = new RoleService();

export const createRole = asyncHandler(async (req: Request, res: Response) => {
  const result = await roleService.createRole(req.body);
  ApiResponse.success(res, result, 'Role created successfully', 201);
});

export const getAllRoles = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const search = req.query.search as string;
  const result = await roleService.getAllRoles(page, limit, search);
  ApiResponse.success(res, result, 'Roles retrieved successfully');
});

export const getRoleById = asyncHandler(async (req: Request, res: Response) => {
  const result = await roleService.getRoleById(req.params.id);
  ApiResponse.success(res, result, 'Role retrieved successfully');
});

export const updateRole = asyncHandler(async (req: Request, res: Response) => {
  const result = await roleService.updateRole(req.params.id, req.body);
  ApiResponse.success(res, result, 'Role updated successfully');
});

export const deleteRole = asyncHandler(async (req: Request, res: Response) => {
  const result = await roleService.deleteRole(req.params.id);
  ApiResponse.success(res, result, 'Role deleted successfully');
});

