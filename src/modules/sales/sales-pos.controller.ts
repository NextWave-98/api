import { Request, Response, NextFunction } from 'express';
import salesPOSService from './sales-pos.service';
import { CreateSaleDTO, CreateSalePaymentDTO, CreateSaleRefundDTO, SalesQueryDTO } from './sales.dto';

export class SalesPOSController {
  /**
   * Create new sale (POS transaction)
   * POST /api/sales/pos
   */
  async createSale(req: Request, res: Response, next: NextFunction) {
    try {
      const data: CreateSaleDTO = req.body;
      const sale = await salesPOSService.createSale(data);

      res.status(201).json({
        success: true,
        message: 'Sale created successfully',
        data: sale
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get sale by ID
   * GET /api/sales/pos/:id
   */
  async getSaleById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const sale = await salesPOSService.getSaleById(id);

      res.json({
        success: true,
        data: sale
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get sales list with filters
   * GET /api/sales/pos
   */
  async getSales(req: Request, res: Response, next: NextFunction) {
    try {
      const query: SalesQueryDTO = {
        locationId: req.query.locationId as string,
        customerId: req.query.customerId as string,
        soldById: req.query.soldById as string,
        status: req.query.status as any,
        paymentStatus: req.query.paymentStatus as any,
        saleType: req.query.saleType as any,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        search: req.query.search as string,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20
      };

      const result = await salesPOSService.getSales(query);
      // console.log(result);

      res.json({
        success: true,
        data: result,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Add payment to sale
   * POST /api/sales/pos/:id/payments
   */
  async addPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data: CreateSalePaymentDTO = {
        ...req.body,
        saleId: id
      };

      const payment = await salesPOSService.addPayment(data);

      res.status(201).json({
        success: true,
        message: 'Payment added successfully',
        data: payment
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create refund for sale
   * POST /api/sales/pos/:id/refunds
   */
  async createRefund(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data: CreateSaleRefundDTO = {
        ...req.body,
        saleId: id
      };

      const refund = await salesPOSService.createRefund(data);

      res.status(201).json({
        success: true,
        message: 'Refund created successfully',
        data: refund
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cancel sale
   * POST /api/sales/pos/:id/cancel
   */
  async cancelSale(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { userId, reason } = req.body;

      const result = await salesPOSService.cancelSale(id, userId, reason);

      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get sale receipt/invoice
   * GET /api/sales/pos/:id/receipt
   */
  async getSaleReceipt(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const receipt = await salesPOSService.getSaleReceipt(id);

      res.json({
        success: true,
        data: receipt
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Download invoice as PDF
   * GET /api/sales/pos/:id/invoice/download
   */
  async downloadInvoice(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const pdfBuffer = await salesPOSService.downloadInvoice(id);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="invoice_${id}.pdf"`);
      res.send(pdfBuffer);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Print invoice (opens in browser)
   * GET /api/sales/pos/:id/invoice/print
   */
  async printInvoice(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const pdfBuffer = await salesPOSService.printInvoice(id);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="invoice_${id}.pdf"`);
      res.send(pdfBuffer);
    } catch (error) {
      next(error);
    }
  }
}

export default new SalesPOSController();

