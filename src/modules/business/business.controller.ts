import { Request, Response } from 'express';
import { BusinessService } from './business.service';
import { ApiResponse } from '../../shared/utils/api-response';
import { asyncHandler } from '../../shared/utils/async-handler';

const businessService = new BusinessService();

export const getBusinessProfile = asyncHandler(async (req: Request, res: Response) => {
  const result = await businessService.getBusinessProfile();
  ApiResponse.success(res, result, 'Business profile retrieved successfully');
});

export const updateBusinessProfile = asyncHandler(async (req: Request, res: Response) => {
  const logoFile = req.file;
  const result = await businessService.updateBusinessProfile(req.body, logoFile);
  ApiResponse.success(res, result, 'Business profile updated successfully');
});
