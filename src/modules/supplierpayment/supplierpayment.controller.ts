import { Request, Response } from 'express';
import { SupplierPaymentService } from './supplierpayment.service';
import { ApiResponse } from '../../shared/utils/api-response';
import { asyncHandler } from '../../shared/utils/async-handler';

const supplierPaymentService = new SupplierPaymentService();

export const createSupplierPayment = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const result = await supplierPaymentService.createSupplierPayment(req.body, userId);
  ApiResponse.success(res, result, 'Supplier payment created successfully', 201);
});

export const getSupplierPayments = asyncHandler(async (req: Request, res: Response) => {
  const result = await supplierPaymentService.getSupplierPayments(req.query as any);
  ApiResponse.success(res, result, 'Supplier payments retrieved successfully');
});

export const getSupplierPaymentById = asyncHandler(async (req: Request, res: Response) => {
  const result = await supplierPaymentService.getSupplierPaymentById(req.params.id);
  ApiResponse.success(res, result, 'Supplier payment retrieved successfully');
});

export const getSupplierPaymentByPaymentNumber = asyncHandler(async (req: Request, res: Response) => {
  const result = await supplierPaymentService.getSupplierPaymentByPaymentNumber(req.params.paymentNumber);
  ApiResponse.success(res, result, 'Supplier payment retrieved successfully');
});

export const updateSupplierPayment = asyncHandler(async (req: Request, res: Response) => {
  const result = await supplierPaymentService.updateSupplierPayment(req.params.id, req.body);
  ApiResponse.success(res, result, 'Supplier payment updated successfully');
});

export const deleteSupplierPayment = asyncHandler(async (req: Request, res: Response) => {
  const result = await supplierPaymentService.deleteSupplierPayment(req.params.id);
  ApiResponse.success(res, result, 'Supplier payment deleted successfully');
});

export const getSupplierPaymentStats = asyncHandler(async (req: Request, res: Response) => {
  const { fromDate, toDate } = req.query;
  const result = await supplierPaymentService.getSupplierPaymentStats(
    fromDate as string,
    toDate as string
  );
  ApiResponse.success(res, result, 'Supplier payment statistics retrieved successfully');
});

