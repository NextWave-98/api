import { Request, Response } from 'express';
import { PaymentService } from './payment.service';
import { ApiResponse } from '../../shared/utils/api-response';
import { asyncHandler } from '../../shared/utils/async-handler';

const paymentService = new PaymentService();

export const createPayment = asyncHandler(async (req: Request, res: Response) => {
  const result = await paymentService.createPayment(req.body, req.user!.userId);
  ApiResponse.success(res, result, 'Payment created successfully', 201);
});

export const getPayments = asyncHandler(async (req: Request, res: Response) => {
  const result = await paymentService.getPayments(req.query as any);
  ApiResponse.success(res, result, 'Payments retrieved successfully');
});

export const getPaymentById = asyncHandler(async (req: Request, res: Response) => {
  const result = await paymentService.getPaymentById(req.params.id);
  ApiResponse.success(res, result, 'Payment retrieved successfully');
});

export const getPaymentByPaymentNumber = asyncHandler(async (req: Request, res: Response) => {
  const result = await paymentService.getPaymentByPaymentNumber(req.params.paymentNumber);
  ApiResponse.success(res, result, 'Payment retrieved successfully');
});

export const updatePayment = asyncHandler(async (req: Request, res: Response) => {
  const result = await paymentService.updatePayment(req.params.id, req.body);
  ApiResponse.success(res, result, 'Payment updated successfully');
});

export const deletePayment = asyncHandler(async (req: Request, res: Response) => {
  const result = await paymentService.deletePayment(req.params.id);
  ApiResponse.success(res, result, 'Payment deleted successfully');
});

export const getPaymentStats = asyncHandler(async (req: Request, res: Response) => {
  const { fromDate, toDate } = req.query;
  const result = await paymentService.getPaymentStats(
    fromDate as string,
    toDate as string
  );
  ApiResponse.success(res, result, 'Payment statistics retrieved successfully');
});

