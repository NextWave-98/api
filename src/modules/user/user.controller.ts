import { Request, Response } from 'express';
import { UserService } from './user.service.sequelize';
import { ApiResponse } from '../../shared/utils/api-response';
import { asyncHandler } from '../../shared/utils/async-handler';

const userService = new UserService();

export const createUser = asyncHandler(async (req: Request, res: Response) => {
  const result = await userService.createUser(req.body);
  ApiResponse.success(res, result, 'User created successfully', 201);
});

export const getAllUsers = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const result = await userService.getAllUsers(page, limit);
  ApiResponse.success(res, result, 'Users retrieved successfully');
});

export const getUserById = asyncHandler(async (req: Request, res: Response) => {
  const result = await userService.getUserById(req.params.id);
  ApiResponse.success(res, result, 'User retrieved successfully');
});

export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const result = await userService.updateUser(req.params.id, req.body);
  ApiResponse.success(res, result, 'User updated successfully');
});

export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const result = await userService.deleteUser(req.params.id);
  ApiResponse.success(res, result, 'User deleted successfully');
});

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  console.log('🔍 DEBUG - getProfile Controller:', {
    hasUser: !!req.user,
    userId,
    fullUser: req.user
  });
  const result = await userService.getProfile(userId);
  ApiResponse.success(res, result, 'Profile retrieved successfully');
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const result = await userService.updateProfile(userId, req.body);
  ApiResponse.success(res, result, 'Profile updated successfully');
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { currentPassword, newPassword } = req.body;
  const result = await userService.changePassword(userId, currentPassword, newPassword);
  ApiResponse.success(res, result, 'Password changed successfully');
});

export const exportUserData = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const result = await userService.exportUserData(userId);
  
  // Set headers for file download
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename=user-data-${userId}.json`);
  
  ApiResponse.success(res, result, 'User data exported successfully');
});

