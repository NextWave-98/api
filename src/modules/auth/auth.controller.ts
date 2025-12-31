// / <reference path="../../shared/types/express.d.ts" />
import { Request, Response } from 'express';
import { AuthService } from './auth.service.sequelize';
import { ApiResponse } from '../../shared/utils/api-response';
import { asyncHandler } from '../../shared/utils/async-handler';

const authService = new AuthService();

export const register = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.register(req.body);
  ApiResponse.success(res, result, 'Registration successful', 201);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.login(req.body);
  ApiResponse.success(res, result, 'Login successful');
});

export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.refreshToken(req.body.refreshToken);
  ApiResponse.success(res, result, 'Token refreshed successfully');
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.logout(req.user!.userId);
  ApiResponse.success(res, result, 'Logout successful');
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.changePassword(
    req.user!.userId,
    req.body.oldPassword,
    req.body.newPassword
  );
  ApiResponse.success(res, result, 'Password changed successfully');
});

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.getProfile(req.user!.userId);
  ApiResponse.success(res, result, 'Profile retrieved successfully');
});

