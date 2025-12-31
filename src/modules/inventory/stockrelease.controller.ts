import { Request, Response } from 'express';
import stockReleaseService from './stockrelease.service';

class StockReleaseController {
  // Create new stock release
  async createStockRelease(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
      }

      const stockRelease = await stockReleaseService.createStockRelease(req.body, userId);
      return res.status(201).json({
        success: true,
        message: 'Stock release created successfully',
        data: stockRelease,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to create stock release',
      });
    }
  }

  // Get all stock releases
  async getAllStockReleases(req: Request, res: Response) {
    try {
      const result = await stockReleaseService.getAllStockReleases(req.query as any);
      return res.status(200).json({
        success: true,
        message: 'Stock releases retrieved successfully',
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve stock releases',
      });
    }
  }

  // Get stock release by ID
  async getStockReleaseById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const stockRelease = await stockReleaseService.getStockReleaseById(id);
      return res.status(200).json({
        success: true,
        message: 'Stock release retrieved successfully',
        data: stockRelease,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve stock release',
      });
    }
  }

  // Update stock release
  async updateStockRelease(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const stockRelease = await stockReleaseService.updateStockRelease(id, req.body);
      return res.status(200).json({
        success: true,
        message: 'Stock release updated successfully',
        data: stockRelease,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to update stock release',
      });
    }
  }

  // Approve stock release
  async approveStockRelease(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
      }

      const stockRelease = await stockReleaseService.approveStockRelease(id, req.body, userId);
      return res.status(200).json({
        success: true,
        message: 'Stock release approved successfully',
        data: stockRelease,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to approve stock release',
      });
    }
  }

  // Release stock
  async releaseStock(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
      }

      const stockRelease = await stockReleaseService.releaseStock(id, req.body, userId);
      return res.status(200).json({
        success: true,
        message: 'Stock released successfully',
        data: stockRelease,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to release stock',
      });
    }
  }

  // Receive stock
  async receiveStock(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
      }

      const stockRelease = await stockReleaseService.receiveStock(id, req.body, userId);
      return res.status(200).json({
        success: true,
        message: 'Stock received successfully',
        data: stockRelease,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to receive stock',
      });
    }
  }

  // Cancel stock release
  async cancelStockRelease(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { notes } = req.body;
      const stockRelease = await stockReleaseService.cancelStockRelease(id, notes);
      return res.status(200).json({
        success: true,
        message: 'Stock release cancelled successfully',
        data: stockRelease,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to cancel stock release',
      });
    }
  }

  // Get statistics
  async getStockTransferStats(req: Request, res: Response) {
    try {
      const { locationId } = req.query;
      const stats = await stockReleaseService.getStockTransferStats(locationId as string);
      return res.status(200).json({
        success: true,
        message: 'Stock transfer statistics retrieved successfully',
        data: stats,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve statistics',
      });
    }
  }

  // Delete stock release
  async deleteStockRelease(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await stockReleaseService.deleteStockRelease(id);
      return res.status(200).json({
        success: true,
        message: 'Stock release deleted successfully',
        data: result,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete stock release',
      });
    }
  }
}

export default new StockReleaseController();

