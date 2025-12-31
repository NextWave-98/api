import { Request, Response } from 'express';
import { JobSheetService } from './jobsheet.service.sequelize';
import { ApiResponse } from '../../shared/utils/api-response';
import { asyncHandler } from '../../shared/utils/async-handler';

const jobSheetService = new JobSheetService();

export const createJobSheet = asyncHandler(async (req: Request, res: Response) => {
  const result = await jobSheetService.createJobSheet(req.body, req.user!.userId);
  ApiResponse.success(res, result, 'Job sheet created successfully', 201);
});

export const getJobSheets = asyncHandler(async (req: Request, res: Response) => {
  const result = await jobSheetService.getJobSheets(req.query as any);
  ApiResponse.success(res, result, 'Job sheets retrieved successfully');
});

export const getJobSheetById = asyncHandler(async (req: Request, res: Response) => {
  const result = await jobSheetService.getJobSheetById(req.params.id);
  ApiResponse.success(res, result, 'Job sheet retrieved successfully');
});

export const getJobSheetByJobNumber = asyncHandler(async (req: Request, res: Response) => {
  const result = await jobSheetService.getJobSheetByJobNumber(req.params.jobNumber);
  ApiResponse.success(res, result, 'Job sheet retrieved successfully');
});

export const updateJobSheet = asyncHandler(async (req: Request, res: Response) => {
  const result = await jobSheetService.updateJobSheet(req.params.id, req.body);
  ApiResponse.success(res, result, 'Job sheet updated successfully');
});

export const updateJobSheetStatus = asyncHandler(async (req: Request, res: Response) => {
  const result = await jobSheetService.updateJobSheetStatus(req.params.id, req.body);
  ApiResponse.success(res, result, 'Job sheet status updated successfully');
});

export const addPartToJobSheet = asyncHandler(async (req: Request, res: Response) => {
  const result = await jobSheetService.addPartToJobSheet(req.params.id, req.body);
  ApiResponse.success(res, result, 'Part added to job sheet successfully', 201);
});

export const removePartFromJobSheet = asyncHandler(async (req: Request, res: Response) => {
  const result = await jobSheetService.removePartFromJobSheet(
    req.params.id,
    req.params.partId
  );
  ApiResponse.success(res, result, 'Part removed from job sheet successfully');
});

export const getJobSheetStats = asyncHandler(async (req: Request, res: Response) => {
  const { locationId, dateFilter, fromDate, toDate } = req.query;
  const result = await jobSheetService.getJobSheetStats({
    locationId: locationId as string,
    dateFilter: dateFilter as string,
    fromDate: fromDate as string,
    toDate: toDate as string,
  });
  ApiResponse.success(res, result, 'Job sheet statistics retrieved successfully');
});

export const getOverdueJobSheets = asyncHandler(async (req: Request, res: Response) => {
  const locationId = req.query.locationId as string;
  const result = await jobSheetService.getOverdueJobSheets(locationId);
  ApiResponse.success(res, result, 'Overdue job sheets retrieved successfully');
});

export const deleteJobSheet = asyncHandler(async (req: Request, res: Response) => {
  const result = await jobSheetService.deleteJobSheet(req.params.id);
  ApiResponse.success(res, result, 'Job sheet deleted successfully');
});

export const getJobSheetStatusHistory = asyncHandler(async (req: Request, res: Response) => {
  const result = await jobSheetService.getJobSheetStatusHistory(req.params.id);
  ApiResponse.success(res, result, 'Job sheet status history retrieved successfully');
});

export const getJobSheetPayments = asyncHandler(async (req: Request, res: Response) => {
  const result = await jobSheetService.getJobSheetPayments(req.params.id);
  ApiResponse.success(res, result, 'Job sheet payments retrieved successfully');
});

export const addProductToJobSheet = asyncHandler(async (req: Request, res: Response) => {
  const result = await jobSheetService.addProductToJobSheet(req.params.id, req.body);
  ApiResponse.success(res, result, 'Product added to job sheet successfully', 201);
});

export const removeProductFromJobSheet = asyncHandler(async (req: Request, res: Response) => {
  const result = await jobSheetService.removeProductFromJobSheet(
    req.params.id,
    req.params.productId
  );
  ApiResponse.success(res, result, 'Product removed from job sheet successfully');
});

export const getJobSheetProducts = asyncHandler(async (req: Request, res: Response) => {
  const result = await jobSheetService.getJobSheetProducts(req.params.id);
  ApiResponse.success(res, result, 'Job sheet products retrieved successfully');
});

export const updateProductStatus = asyncHandler(async (req: Request, res: Response) => {
  const { status } = req.body;
  const result = await jobSheetService.updateProductStatus(
    req.params.id,
    req.params.productId,
    status
  );
  ApiResponse.success(res, result, 'Product status updated successfully');
});

export const downloadJobSheet = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const pdfBuffer = await jobSheetService.downloadJobSheet(id, req.query as any);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="jobsheet_${id}.pdf"`);
  res.send(pdfBuffer);
});

export const printJobSheet = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const pdfBuffer = await jobSheetService.printJobSheet(id, req.query as any);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="jobsheet_${id}.pdf"`);
  res.send(pdfBuffer);
});

