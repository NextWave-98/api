import { Request, Response } from 'express';
import { GoodsReceiptService } from './goodsreceipt.service';
import {
  createGoodsReceiptSchema,
  updateGoodsReceiptSchema,
  updateGoodsReceiptItemSchema,
  qualityCheckSchema,
  approveGoodsReceiptSchema,
  queryGoodsReceiptsSchema,
} from './goodsreceipt.dto';
import { ZodError } from 'zod';

const service = new GoodsReceiptService();

export class GoodsReceiptController {
  async create(req: Request, res: Response) {
    try {
      const validatedData = createGoodsReceiptSchema.parse(req.body);
      const grn = await service.createGoodsReceipt(validatedData);

      res.status(201).json({
        success: true,
        message: 'Goods receipt created successfully',
        data: grn,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          success: false, 
          message: 'Validation error', 
          errors: error.issues 
        });
      }
      res.status(500).json({ 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to create goods receipt' 
      });
    }
  }

  async getAll(req: Request, res: Response) {
    try {
      const query = queryGoodsReceiptsSchema.parse(req.query);
      const result = await service.getGoodsReceipts(query);
      res.status(200).json({ success: true, ...result });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          success: false, 
          message: 'Validation error', 
          errors: error.issues 
        });
      }
      res.status(500).json({ 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to fetch goods receipts' 
      });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const grn = await service.getGoodsReceiptById(id);
      res.status(200).json({ success: true, data: grn });
    } catch (error) {
      res.status(404).json({ 
        success: false, 
        message: error instanceof Error ? error.message : 'Goods receipt not found' 
      });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const validatedData = updateGoodsReceiptSchema.parse(req.body);
      const grn = await service.updateGoodsReceipt(id, validatedData);

      res.status(200).json({
        success: true,
        message: 'Goods receipt updated successfully',
        data: grn,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          success: false, 
          message: 'Validation error', 
          errors: error.issues 
        });
      }
      res.status(500).json({ 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to update goods receipt' 
      });
    }
  }

  async updateItem(req: Request, res: Response) {
    try {
      const { id, itemId } = req.params;
      const validatedData = updateGoodsReceiptItemSchema.parse(req.body);
      const item = await service.updateGoodsReceiptItem(id, itemId, validatedData);

      res.status(200).json({
        success: true,
        message: 'Goods receipt item updated successfully',
        data: item,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          success: false, 
          message: 'Validation error', 
          errors: error.issues 
        });
      }
      res.status(500).json({ 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to update goods receipt item' 
      });
    }
  }

  async performQualityCheck(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const validatedData = qualityCheckSchema.parse(req.body);
      const grn = await service.performQualityCheck(id, validatedData);

      res.status(200).json({
        success: true,
        message: 'Quality check performed successfully',
        data: grn,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          success: false, 
          message: 'Validation error', 
          errors: error.issues 
        });
      }
      res.status(500).json({ 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to perform quality check' 
      });
    }
  }

  async approve(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const validatedData = approveGoodsReceiptSchema.parse(req.body);
      const grn = await service.approveGoodsReceipt(id, validatedData);

      res.status(200).json({
        success: true,
        message: 'Goods receipt approved and inventory updated successfully',
        data: grn,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          success: false, 
          message: 'Validation error', 
          errors: error.issues 
        });
      }
      res.status(500).json({ 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to approve goods receipt' 
      });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await service.deleteGoodsReceipt(id);

      res.status(200).json({
        success: true,
        message: 'Goods receipt deleted successfully',
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to delete goods receipt' 
      });
    }
  }

  async getByPurchaseOrder(req: Request, res: Response) {
    try {
      const { purchaseOrderId } = req.params;
      const grns = await service.getGoodsReceiptsByPurchaseOrder(purchaseOrderId);
      res.status(200).json({ success: true, data: grns });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to fetch goods receipts' 
      });
    }
  }

  async getStats(req: Request, res: Response) {
    try {
      const stats = await service.getGoodsReceiptStats();
      res.status(200).json({ success: true, data: stats });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to fetch statistics' 
      });
    }
  }
}

