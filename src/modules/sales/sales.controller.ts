import { Request, Response } from 'express';
import { SalesService } from './sales.service.sequelize';
import { ApiResponse } from '../../shared/utils/api-response';
import { asyncHandler } from '../../shared/utils/async-handler';
import { SalesQueryDTO } from './sales.dto';

const salesService = new SalesService();

/**
 * Get comprehensive dashboard data
 * GET /api/v1/sales/dashboard
 */
export const getDashboard = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as SalesQueryDTO;
  const result = await salesService.getDashboard(query);
  ApiResponse.success(res, result, 'Dashboard data retrieved successfully');
});

/**
 * Get sales overview statistics
 * GET /api/v1/sales/overview
 */
export const getSalesOverview = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as SalesQueryDTO;
  const result = await salesService.getSalesOverview(query);
  ApiResponse.success(res, result, 'Sales overview retrieved successfully');
});

/**
 * Get sales trends over time
 * GET /api/v1/sales/trends
 */
export const getSalesTrends = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as SalesQueryDTO;
  const result = await salesService.getSalesTrends(query);
  ApiResponse.success(res, result, 'Sales trends retrieved successfully');
});

/**
 * Get top selling products
 * GET /api/v1/sales/top-products
 */
export const getTopProducts = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as SalesQueryDTO;
  const result = await salesService.getTopProducts(query);
  ApiResponse.success(res, result, 'Top products retrieved successfully');
});

/**
 * Get branch performance
 * GET /api/v1/sales/location-performance
 */
export const getBranchPerformance = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as SalesQueryDTO;
  const result = await salesService.getLocationPerformance(query);
  ApiResponse.success(res, result, 'Branch performance retrieved successfully');
});

/**
 * Get staff performance
 * GET /api/v1/sales/staff-performance
 */
export const getStaffPerformance = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as SalesQueryDTO;
  const result = await salesService.getStaffPerformance(query);
  ApiResponse.success(res, result, 'Staff performance retrieved successfully');
});

/**
 * Get payment method statistics
 * GET /api/v1/sales/payment-methods
 */
export const getPaymentMethodStats = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as SalesQueryDTO;
  const result = await salesService.getPaymentMethodStats(query);
  ApiResponse.success(res, result, 'Payment method statistics retrieved successfully');
});

/**
 * Get revenue breakdown by category
 * GET /api/v1/sales/revenue-breakdown
 */
export const getRevenueBreakdown = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as SalesQueryDTO;
  const result = await salesService.getRevenueBreakdown(query);
  ApiResponse.success(res, result, 'Revenue breakdown retrieved successfully');
});

/**
 * Get profit analysis
 * GET /api/v1/sales/profit-analysis
 */
export const getProfitAnalysis = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as SalesQueryDTO;
  const result = await salesService.getProfitAnalysis(query);
  ApiResponse.success(res, result, 'Profit analysis retrieved successfully');
});

/**
 * Get detailed sales list
 * GET /api/v1/sales/details
 */
export const getSalesDetails = asyncHandler(async (req: Request, res: Response) => {
  // Parse query parameters properly
    const query: SalesQueryDTO = {
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      locationId: req.query.locationId as string,
      soldById: req.query.staffId as string,
      status: req.query.status as any,
    page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
    limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
  };
  
  const result = await salesService.getSalesDetails(query);
  ApiResponse.success(res, result, 'Sales details retrieved successfully');
});

/**
 * Get customer insights
 * GET /api/v1/sales/customer-insights
 */
export const getCustomerInsights = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as SalesQueryDTO;
  const result = await salesService.getCustomerInsights(query);
  ApiResponse.success(res, result, 'Customer insights retrieved successfully');
});

/**
 * Get branch manager's dashboard (automatically filtered by their branch)
 * GET /api/v1/sales/branch/dashboard
 */
export const getBranchDashboard = asyncHandler(async (req: Request, res: Response) => {
  const locationId = req.user?.locationId;
  
  if (!locationId) {
    throw new Error('Branch manager must be assigned to a location');
  }
  
  // Parse query parameters properly
  const query: SalesQueryDTO = {
    startDate: req.query.startDate as string,
    endDate: req.query.endDate as string,
    locationId: locationId,
    period: req.query.period as 'today' | 'yesterday' | 'week' | 'month' | 'year' | 'custom',
  };
  
  const result = await salesService.getDashboard(query);
  ApiResponse.success(res, result, 'Branch dashboard data retrieved successfully');
});

/**
 * Get branch manager's sales details (automatically filtered by their branch)
 * GET /api/v1/sales/branch/details
 */
export const getBranchSalesDetails = asyncHandler(async (req: Request, res: Response) => {
  const locationId = req.user?.locationId;
  
  if (!locationId) {
    throw new Error('Branch manager must be assigned to a location');
  }
  
  // Parse query parameters properly
  const query: SalesQueryDTO = {
    startDate: req.query.startDate as string,
    endDate: req.query.endDate as string,
    locationId: locationId,
    status: req.query.status as any,
    page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
    limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
  };
  
  const result = await salesService.getSalesDetails(query);
  ApiResponse.success(res, result, 'Branch sales details retrieved successfully');
});

/**
 * Get enhanced branch dashboard with jobsheet/POS breakdown and product counts
 * GET /api/v1/sales/branch/enhanced-dashboard
 */
export const getBranchEnhancedDashboard = asyncHandler(async (req: Request, res: Response) => {
  const locationId = req.user?.locationId;
  
  if (!locationId) {
    throw new Error('Branch manager must be assigned to a location');
  }
  
  const query = req.query as unknown as SalesQueryDTO;
  const result = await salesService.getBranchEnhancedDashboard(locationId, query);
  ApiResponse.success(res, result, 'Enhanced branch dashboard retrieved successfully');
});

/**
 * Get sale by ID with full details including transactions
 * GET /api/v1/sales/:id
 */
export const getSaleById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await salesService.getSaleById(id);
  ApiResponse.success(res, result, 'Sale details retrieved successfully');
});

