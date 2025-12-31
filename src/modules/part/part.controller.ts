// import { Request, Response } from 'express';
// import { PartService } from './part.service';
// import { ApiResponse } from '../../shared/utils/api-response';
// import { asyncHandler } from '../../shared/utils/async-handler';

// const partService = new PartService();

// export const createPart = asyncHandler(async (req: Request, res: Response) => {
//   const result = await partService.createPart(req.body);
//   ApiResponse.success(res, result, 'Part created successfully', 201);
// });

// export const getParts = asyncHandler(async (req: Request, res: Response) => {
//   const result = await partService.getParts(req.query as any);
//   ApiResponse.success(res, result, 'Parts retrieved successfully');
// });

// export const getPartById = asyncHandler(async (req: Request, res: Response) => {
//   const result = await partService.getPartById(req.params.id);
//   ApiResponse.success(res, result, 'Part retrieved successfully');
// });

// export const getPartByPartNumber = asyncHandler(async (req: Request, res: Response) => {
//   const result = await partService.getPartByPartNumber(req.params.partNumber);
//   ApiResponse.success(res, result, 'Part retrieved successfully');
// });

// export const updatePart = asyncHandler(async (req: Request, res: Response) => {
//   const result = await partService.updatePart(req.params.id, req.body);
//   ApiResponse.success(res, result, 'Part updated successfully');
// });

// export const deletePart = asyncHandler(async (req: Request, res: Response) => {
//   const result = await partService.deletePart(req.params.id);
//   ApiResponse.success(res, result, 'Part deleted successfully');
// });

// export const getPartStats = asyncHandler(async (req: Request, res: Response) => {
//   const result = await partService.getPartStats();
//   ApiResponse.success(res, result, 'Part statistics retrieved successfully');
// });

// export const searchParts = asyncHandler(async (req: Request, res: Response) => {
//   const { search, limit } = req.query;
//   const result = await partService.searchParts(
//     search as string,
//     limit ? parseInt(limit as string) : 10
//   );
//   ApiResponse.success(res, result, 'Parts found successfully');
// });

