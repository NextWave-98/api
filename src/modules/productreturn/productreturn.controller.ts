import { Request, Response } from 'express';
import { AppError } from '../../shared/utils/app-error';
import { ProductReturnService } from './productreturn.service';
import {
  CreateProductReturnDTO,
  InspectReturnDTO,
  ApproveReturnDTO,
  RejectReturnDTO,
  ProcessReturnDTO,
  QueryProductReturnsDTO,
  CancelReturnDTO,
  ReturnAnalyticsQueryDTO,
} from './productreturn.dto';

export class ProductReturnController {
  private productReturnService: ProductReturnService;

  constructor() {
    this.productReturnService = new ProductReturnService();
  }

  /**
   * POST /api/returns
   * Create new product return
   */
  createReturn = async (req: Request, res: Response) => {
    try {
      const data: CreateProductReturnDTO = req.body;
      
      // Add createdById from authenticated user
      if (!data.createdById && (req as any).user) {
        data.createdById = (req as any).user.id;
      }

      const productReturn = await this.productReturnService.createReturn(data);

      res.status(201).json({
        success: true,
        message: 'Product return created successfully',
        data: productReturn,
      });
    } catch (error: any) {
      console.error('Error creating product return:', error);
      console.error('Request data:', req.body);
      console.error('Error stack:', error.stack);
      
      // Return more specific error messages
      let errorMessage = 'Failed to create product return';
      let statusCode = 500;
      let details = undefined;
      
      if (error instanceof AppError) {
        errorMessage = error.message;
        statusCode = error.statusCode;
      } else if (error.code === 'P2002') {
        errorMessage = 'A return with this information already exists';
        statusCode = 409;
        details = error.meta;
      } else if (error.code === 'P2025') {
        errorMessage = 'Related record not found (product, location, or customer)';
        statusCode = 404;
        details = error.meta;
      } else if (error.code === 'P2003') {
        errorMessage = 'Foreign key constraint failed - invalid reference to product, location, customer, or user';
        statusCode = 400;
        details = error.meta;
      } else if (error.name === 'PrismaClientValidationError') {
        errorMessage = 'Invalid data provided - please check all required fields';
        statusCode = 400;
      }
      
      res.status(statusCode).json({
        success: false,
        message: errorMessage,
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? details : undefined,
      });
    }
  };

  /**
   * GET /api/returns
   * Get all returns with filters
   */
  getReturns = async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;

      // Check if user has an assigned location (skip for ADMIN)
      if (!user.locationId && user.roleName !== 'ADMIN') {
        throw new AppError(403, 'User is not associated to ProductReturn!');
      }

      const query: QueryProductReturnsDTO = req.query;

      const result = await this.productReturnService.getReturns(query, user);

      res.status(200).json({
        success: true,
        message: 'Returns fetched successfully',
        data: result.returns,
        pagination: result.pagination,
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to fetch returns',
      });
    }
  };

  /**
   * GET /api/returns/:id
   * Get return by ID
   */
  getReturnById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const user = (req as any).user;

      // Check if user has an assigned location (skip for ADMIN)
      if (!user.locationId && user.roleName !== 'ADMIN') {
        throw new AppError(403, 'User is not associated to ProductReturn!');
      }

      const productReturn = await this.productReturnService.getReturnById(id);

      // Check if the return belongs to the user's location (skip for ADMIN)
      if (user.roleName !== 'ADMIN' && productReturn.locationId !== user.locationId) {
        throw new AppError(403, 'User is not associated to ProductReturn!');
      }

      res.status(200).json({
        success: true,
        message: 'Return fetched successfully',
        data: productReturn,
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to fetch return',
      });
    }
  };

  /**
   * GET /api/returns/number/:returnNumber
   * Get return by return number
   */
  getReturnByNumber = async (req: Request, res: Response) => {
    try {
      const { returnNumber } = req.params;
      const user = (req as any).user;

      // Check if user has an assigned location (skip for ADMIN)
      if (!user.locationId && user.roleName !== 'ADMIN') {
        throw new AppError(403, 'User is not associated to ProductReturn!');
      }

      const productReturn = await this.productReturnService.getReturnByNumber(returnNumber);

      // Check if the return belongs to the user's location (skip for ADMIN)
      if (user.roleName !== 'ADMIN' && productReturn.locationId !== user.locationId) {
        throw new AppError(403, 'User is not associated to ProductReturn!');
      }

      res.status(200).json({
        success: true,
        message: 'Return fetched successfully',
        data: productReturn,
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to fetch return',
      });
    }
  };

  /**
   * PATCH /api/returns/:id/inspect
   * Inspect return
   */
  inspectReturn = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const data: InspectReturnDTO = req.body;

      // Add inspectedById from authenticated user
      if (!data.inspectedById && (req as any).user) {
        data.inspectedById = (req as any).user.id;
      }

      const productReturn = await this.productReturnService.inspectReturn(id, data);

      res.status(200).json({
        success: true,
        message: 'Return inspection recorded successfully',
        data: productReturn,
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to inspect return',
      });
    }
  };

  /**
   * PATCH /api/returns/:id/approve
   * Approve return
   */
  approveReturn = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const data: ApproveReturnDTO = req.body;

      // Add approvedById from authenticated user
      if (!data.approvedById && (req as any).user) {
        data.approvedById = (req as any).user.id;
      }

      const productReturn = await this.productReturnService.approveReturn(id, data);

      res.status(200).json({
        success: true,
        message: 'Return approved successfully',
        data: productReturn,
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to approve return',
      });
    }
  };

  /**
   * PATCH /api/returns/:id/reject
   * Reject return
   */
  rejectReturn = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const data: RejectReturnDTO = req.body;

      // Add rejectedById from authenticated user
      if (!data.rejectedById && (req as any).user) {
        data.rejectedById = (req as any).user.id;
      }

      const productReturn = await this.productReturnService.rejectReturn(id, data);

      res.status(200).json({
        success: true,
        message: 'Return rejected successfully',
        data: productReturn,
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to reject return',
      });
    }
  };

  /**
   * PATCH /api/returns/:id/process
   * Process return (execute resolution)
   */
  processReturn = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const data: ProcessReturnDTO = req.body;

      const productReturn = await this.productReturnService.processReturn(id, data);

      res.status(200).json({
        success: true,
        message: 'Return processed successfully',
        data: productReturn,
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to process return',
      });
    }
  };

  /**
   * DELETE /api/returns/:id
   * Cancel return
   */
  cancelReturn = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const data: CancelReturnDTO = req.body;

      // Add cancelledById from authenticated user
      if (!data.cancelledById && (req as any).user) {
        data.cancelledById = (req as any).user.id;
      }

      const productReturn = await this.productReturnService.cancelReturn(id, data);

      res.status(200).json({
        success: true,
        message: 'Return cancelled successfully',
        data: productReturn,
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to cancel return',
      });
    }
  };

  /**
   * GET /api/returns/stats
   * Get return statistics
   */
  getReturnStats = async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;

      // Check if user has an assigned location (skip for ADMIN)
      if (!user.locationId && user.roleName !== 'ADMIN') {
        throw new AppError(403, 'User is not associated to ProductReturn!');
      }

      const { locationId, startDate, endDate } = req.query;

      const stats = await this.productReturnService.getStats({
        locationId: locationId as string || user.locationId,
        startDate: startDate as string,
        endDate: endDate as string,
      } as any);

      res.status(200).json({
        success: true,
        message: 'Return statistics fetched successfully',
        data: stats,
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to fetch return statistics',
      });
    }
  };

  /**
   * GET /api/returns/analytics
   * Get return analytics
   */
  getReturnAnalytics = async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;

      // Check if user has an assigned location (skip for ADMIN)
      if (!user.locationId && user.roleName !== 'ADMIN') {
        throw new AppError(403, 'User is not associated to ProductReturn!');
      }

      const query: ReturnAnalyticsQueryDTO = req.query;

      // Default to user's location if not specified (ADMIN can see all)
      if (!query.locationId && user.locationId) {
        query.locationId = user.locationId;
      }

      const analytics = await this.productReturnService.getAnalytics(query);

      res.status(200).json({
        success: true,
        message: 'Return analytics fetched successfully',
        data: analytics,
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to fetch return analytics',
      });
    }
  };
}

