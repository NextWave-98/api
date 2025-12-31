import { Request, Response } from 'express';
import { PurchaseOrderService } from './purchaseorder.service';
import {
  createPurchaseOrderSchema,
  updatePurchaseOrderSchema,
  updatePOStatusSchema,
  queryPurchaseOrdersSchema,
  addPOItemSchema,
  updatePOItemSchema,
  approvePOSchema,
  receivePOSchema,
  receivePOWithItemsSchema,
  cancelPOSchema,
} from './purchaseorder.dto';
import { ZodError } from 'zod';

const service = new PurchaseOrderService();

export class PurchaseOrderController {
  async create(req: Request, res: Response) {
    try {
      const validatedData = createPurchaseOrderSchema.parse(req.body);
      const po = await service.createPurchaseOrder(validatedData, req.user?.userId);

      res.status(201).json({
        success: true,
        message: 'Purchase order created successfully',
        data: po,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ success: false, message: 'Validation error', errors: error.issues });
      }
      res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Failed to create purchase order' });
    }
  }

  async getAll(req: Request, res: Response) {
    try {
      const query = queryPurchaseOrdersSchema.parse(req.query);
      const result = await service.getPurchaseOrders(query);
      res.status(200).json({ success: true, ...result });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ success: false, message: 'Validation error', errors: error.issues });
      }
      res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Failed to fetch purchase orders' });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const po = await service.getPurchaseOrderById(id);
      res.status(200).json({ success: true, data: po });
    } catch (error) {
      res.status(error instanceof Error && error.message === 'Purchase order not found' ? 404 : 500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch purchase order',
      });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const validatedData = updatePurchaseOrderSchema.parse(req.body);
      const po = await service.updatePurchaseOrder(id, validatedData);
      res.status(200).json({ success: true, message: 'Purchase order updated successfully', data: po });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ success: false, message: 'Validation error', errors: error.issues });
      }
      res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Failed to update purchase order' });
    }
  }

  async updateStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const validatedData = updatePOStatusSchema.parse(req.body);
      const po = await service.updatePOStatus(id, validatedData, req.user?.userId);
      res.status(200).json({ success: true, message: 'Purchase order status updated successfully', data: po });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ success: false, message: 'Validation error', errors: error.issues });
      }
      res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Failed to update status' });
    }
  }

  async approve(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const validatedData = approvePOSchema.parse(req.body);
      const po = await service.approvePurchaseOrder(id, validatedData, req.user?.userId);
      res.status(200).json({ success: true, message: 'Purchase order approved successfully', data: po });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ success: false, message: 'Validation error', errors: error.issues });
      }
      res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Failed to approve purchase order' });
    }
  }

  async receive(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const validatedData = receivePOSchema.parse(req.body);
      const po = await service.receivePurchaseOrder(id, validatedData, req.user?.userId);
      res.status(200).json({ 
        success: true, 
        message: 'Purchase order marked as received successfully. Inventory updated automatically.', 
        data: po 
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ success: false, message: 'Validation error', errors: error.issues });
      }
      res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Failed to receive purchase order' });
    }
  }

  async receiveWithItems(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const validatedData = receivePOWithItemsSchema.parse(req.body);
      const result = await service.receivePurchaseOrderWithItems(id, validatedData, req.user?.userId);
      res.status(200).json({ 
        success: true, 
        message: `Purchase order partially received (${result.receivedItems}/${result.totalItems} items). Inventory updated automatically.`, 
        data: result 
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ success: false, message: 'Validation error', errors: error.issues });
      }
      res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Failed to receive purchase order items' });
    }
  }

  async cancel(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const validatedData = cancelPOSchema.parse(req.body);
      const po = await service.cancelPurchaseOrder(id, validatedData, req.user?.userId);
      res.status(200).json({ success: true, message: 'Purchase order cancelled successfully', data: po });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ success: false, message: 'Validation error', errors: error.issues });
      }
      res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Failed to cancel purchase order' });
    }
  }

  async submit(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const remarks = (req.body && (req.body as any).remarks) || 'Submitted via API';
      const changedBy = req.user?.userId;
      const po = await service.updatePOStatus(id, { status: 'SUBMITTED', remarks }, changedBy);
      res.status(200).json({ success: true, message: 'Purchase order submitted successfully', data: po });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ success: false, message: 'Validation error', errors: error.issues });
      }
      res.status(error instanceof Error && error.message === 'Purchase order not found' ? 404 : 500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to submit purchase order',
      });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await service.deletePurchaseOrder(id);
      res.status(200).json({ success: true, message: 'Purchase order deleted successfully' });
    } catch (error) {
      res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Failed to delete purchase order' });
    }
  }

  async addItem(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const validatedData = addPOItemSchema.parse(req.body);
      const item = await service.addPOItem(id, validatedData);
      res.status(201).json({ success: true, message: 'Item added successfully', data: item });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ success: false, message: 'Validation error', errors: error.issues });
      }
      res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Failed to add item' });
    }
  }

  async updateItem(req: Request, res: Response) {
    try {
      const { id, itemId } = req.params;
      const validatedData = updatePOItemSchema.parse(req.body);
      const item = await service.updatePOItem(id, itemId, validatedData);
      res.status(200).json({ success: true, message: 'Item updated successfully', data: item });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ success: false, message: 'Validation error', errors: error.issues });
      }
      res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Failed to update item' });
    }
  }

  async deleteItem(req: Request, res: Response) {
    try {
      const { id, itemId } = req.params;
      await service.deletePOItem(id, itemId);
      res.status(200).json({ success: true, message: 'Item deleted successfully' });
    } catch (error) {
      res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Failed to delete item' });
    }
  }

  async getStats(req: Request, res: Response) {
    try {
      const stats = await service.getPOStats();
      res.status(200).json({ success: true, data: stats });
    } catch (error) {
      res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Failed to fetch statistics' });
    }
  }
}

