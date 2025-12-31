import { Request, Response } from 'express';
import { CustomerService } from './customer.service.sequelize';
import { ApiResponse } from '../../shared/utils/api-response';
import { asyncHandler } from '../../shared/utils/async-handler';

const customerService = new CustomerService();

export const createCustomer = asyncHandler(async (req: Request, res: Response) => {
  const result = await customerService.createCustomer(req.body);
  ApiResponse.success(res, result, 'Customer created successfully', 201);
});

export const getCustomers = asyncHandler(async (req: Request, res: Response) => {
  const result = await customerService.getCustomers(req.query as any);
  ApiResponse.success(res, result, 'Customers retrieved successfully');
});

export const getCustomerById = asyncHandler(async (req: Request, res: Response) => {
  const result = await customerService.getCustomerById(req.params.id);
  ApiResponse.success(res, result, 'Customer retrieved successfully');
});

export const getCustomerByCustomerId = asyncHandler(async (req: Request, res: Response) => {
  const result = await customerService.getCustomerByCustomerId(req.params.customerId);
  ApiResponse.success(res, result, 'Customer retrieved successfully');
});

export const updateCustomer = asyncHandler(async (req: Request, res: Response) => {
  const result = await customerService.updateCustomer(req.params.id, req.body);
  ApiResponse.success(res, result, 'Customer updated successfully');
});

export const deleteCustomer = asyncHandler(async (req: Request, res: Response) => {
  console.log('DELETE /customers/:id - Received request:', {
    params: req.params,
    id: req.params.id,
    idType: typeof req.params.id,
    url: req.url,
    path: req.path,
  });
  
  const result = await customerService.deleteCustomer(req.params.id);
  ApiResponse.success(res, result, 'Customer deleted successfully');
});

export const addLoyaltyPoints = asyncHandler(async (req: Request, res: Response) => {
  const { points } = req.body;
  const result = await customerService.addLoyaltyPoints(req.params.id, points);
  ApiResponse.success(res, result, 'Loyalty points added successfully');
});

export const getCustomerStats = asyncHandler(async (req: Request, res: Response) => {
  const locationId = req.query.locationId as string;
  const result = await customerService.getCustomerStats(locationId);
  ApiResponse.success(res, result, 'Customer statistics retrieved successfully');
});

export const searchCustomers = asyncHandler(async (req: Request, res: Response) => {
  const { search, limit } = req.query;
  const result = await customerService.searchCustomers(
    search as string,
    limit ? parseInt(limit as string) : 10
  );
  ApiResponse.success(res, result, 'Customers found successfully');
});

