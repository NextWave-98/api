import { ProductReturn, Product, ProductCategory, Location, Customer, User, Sale, WarrantyClaim, JobSheet, SaleRefund, SaleItem, ProductInventory, ProductStockMovement } from '../../models';
import { Op } from 'sequelize';
import sequelize from '../../shared/config/database';
import { AppError } from '../../shared/utils/app-error';
import { SaleStatus } from '../../enums';
import {
  CreateProductReturnDTO,
  InspectReturnDTO,
  ApproveReturnDTO,
  RejectReturnDTO,
  ProcessReturnDTO,
  QueryProductReturnsDTO,
  ProductReturnStatsQueryDTO,
  ProductReturnStatsDTO,
  CancelReturnDTO,
  ReturnAnalyticsQueryDTO,
  ReturnAnalyticsDTO,
} from './productreturn.dto';
import { SMSService } from '../sms/sms.service';
import { NotificationOrchestrator } from '../notification/notification-orchestrator.service';

export class ProductReturnService {
  private smsService = new SMSService();
  private notificationOrchestrator = new NotificationOrchestrator();
  
  /**
   * Generate unique return number: RTN-2025-0001
   */
  private async generateReturnNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `RTN-${year}-`;

    const lastReturn = await ProductReturn.findOne({
      where: { returnNumber: { [Op.startsWith]: prefix } },
      order: [['returnNumber', 'DESC']],
    });

    let nextNumber = 1;
    if (lastReturn) {
      const lastNumber = parseInt(lastReturn.returnNumber.split('-').pop() || '0');
      nextNumber = lastNumber + 1;
    }

    return `${prefix}${String(nextNumber).padStart(4, '0')}`;
  }

  /**
   * Create new product return
   */
  async createReturn(data: CreateProductReturnDTO) {
    try {
      // Input validation
      if (!data.locationId) throw new AppError(400, 'Location ID is required');
      if (!data.productId) throw new AppError(400, 'Product ID is required');
      if (!data.quantity || data.quantity < 1) throw new AppError(400, 'Valid quantity is required (minimum 1)');
      if (!data.returnReason || data.returnReason.trim() === '') throw new AppError(400, 'Return reason is required');
      if (!data.returnCategory) throw new AppError(400, 'Return category is required');
      if (!data.sourceType) throw new AppError(400, 'Source type is required');
      if (!data.productValue || data.productValue < 0) throw new AppError(400, 'Valid product value is required');
      if (!data.createdById) throw new AppError(400, 'Created by user ID is required');

      // Validate product exists
      const product = await Product.findByPk(data.productId, {
        include: [{ model: ProductCategory, as: 'category' }],
      });

      if (!product) throw new AppError(404, 'Product not found');

      // Validate location
      const location = await Location.findByPk(data.locationId);
      if (!location) throw new AppError(404, 'Location not found');

      // If sourceId provided, validate source exists
      if (data.sourceId) {
        if (data.sourceType === 'SALE') {
          const sale = await Sale.findByPk(data.sourceId);
          if (!sale) throw new AppError(404, 'Sale not found');
        } else if (data.sourceType === 'WARRANTY_CLAIM') {
          const claim = await WarrantyClaim.findByPk(data.sourceId);
          if (!claim) throw new AppError(404, 'Warranty claim not found');
        } else if (data.sourceType === 'JOB_SHEET') {
          const jobSheet = await JobSheet.findByPk(data.sourceId);
          if (!jobSheet) throw new AppError(404, 'Job sheet not found');
        }
      }

      // Validate customer if provided
      if (data.customerId) {
        const customer = await Customer.findByPk(data.customerId);
        if (!customer) throw new AppError(404, 'Customer not found');
      }

      // Generate return number
      const returnNumber = await this.generateReturnNumber();

      // Create return
      const productReturn = await ProductReturn.create({
        returnNumber,
        locationId: data.locationId,
        sourceType: data.sourceType,
        sourceId: data.sourceId,
        customerId: data.customerId,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        productId: data.productId,
        quantity: data.quantity,
        serialNumber: data.productSerialNumber,
        returnReason: data.returnReason,
        returnCategory: data.returnCategory as any,
        condition: (data.condition as any) || 'USED_GOOD',
        conditionNotes: data.conditionNotes,
        productValue: data.productValue,
        refundAmount: data.refundAmount,
        priority: data.priority || 'NORMAL',
        images: data.images ? (data.images as any) : undefined,
        notes: data.productBatchNumber ? `Batch: ${data.productBatchNumber}${data.notes ? `; ${data.notes}` : ''}` : data.notes,
        createdById: data.createdById,
        status: 'RECEIVED',
      });

      await productReturn.reload({
        include: [
          { model: Product, as: 'product', include: [{ model: ProductCategory, as: 'category' }] },
          { model: Location, as: 'location' },
          { model: Customer, as: 'customer' },
          { model: User, as: 'createdBy', attributes: ['id', 'name', 'email'] },
        ],
      });

      // Send notifications
      try {
        const productReturnData = productReturn.toJSON() as any;
        const locationName = productReturnData.location?.name || 'Our Store';
        const customerName = data.customerName || 'Valued Customer';
        
        await this.notificationOrchestrator.createReturnNotifications(
          productReturn.id,
          data.customerId || null,
          data.locationId,
          {
            customerName,
            returnNumber: productReturn.returnNumber,
            productName: productReturnData.product.name,
            quantity: productReturn.quantity,
            returnReason: productReturn.returnReason.substring(0, 50),
            locationName,
            companyName: 'LTS Phone Shop',
            contactPhone: productReturnData.location?.phone || '',
          }
        );
        
        console.log(`Return creation notifications sent successfully for return ${productReturn.returnNumber}`);
      } catch (notificationError) {
        console.error('Error sending return creation notifications:', notificationError);
      }

      return productReturn;
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('Error creating product return:', error);
      throw new AppError(500, 'Failed to create product return');
    }
  }

  /**
   * Get all returns with filtering and pagination
   */
  async getReturns(query: QueryProductReturnsDTO, user?: any) {
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '20');
    const offset = (page - 1) * limit;

    const where: any = {};

    // Filter by user's location if no locationId provided and user has location
    if (!query.locationId && user?.location?.id) {
      where.locationId = user.location.id;
    } else if (query.locationId) {
      where.locationId = query.locationId;
    }
    if (query.status) where.status = query.status as any;
    if (query.returnCategory) where.returnCategory = query.returnCategory as any;
    if (query.returnReason) where.returnReason = { [Op.iLike]: `%${query.returnReason}%` };
    if (query.customerId) where.customer_id = query.customerId;
    if (query.productId) where.product_id = query.productId;
    if (query.sourceType) where.source_type = query.sourceType as any;
    if (query.sourceId) where.source_id = query.sourceId;

    if (query.search) {
      where[Op.or] = [
        { return_number: { [Op.iLike]: `%${query.search}%` } },
        { customer_name: { [Op.iLike]: `%${query.search}%` } },
        { customer_phone: { [Op.like]: `%${query.search}%` } },
        { '$product.name$': { [Op.iLike]: `%${query.search}%` } },
        { '$product.product_code$': { [Op.iLike]: `%${query.search}%` } },
      ];
    }

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) where.createdAt[Op.gte] = new Date(query.startDate);
      if (query.endDate) where.createdAt[Op.lte] = new Date(query.endDate);
    }

    const sortBy = query.sortBy || 'created_at';
    const sortOrder = (query.sortOrder || 'desc').toUpperCase();

    const { count: total, rows: returns } = await ProductReturn.findAndCountAll({
      where,
      offset,
      limit,
      order: [[sortBy, sortOrder]],
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'product_code', 'name', 'brand', 'model', 'unit_price'],
        },
        {
          model: Location,
          as: 'location',
          attributes: ['id', 'name', 'location_code'],
        },
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'customer_id', 'name', 'phone'],
        },
        {
          model: User,
          as: 'createdBy',
          attributes: ['id', 'name'],
        },
      ],
    });

    return {
      returns: returns.map(r => r.toJSON()),
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get return by ID
   */
  async getReturnById(id: string) {
    const productReturn = await ProductReturn.findByPk(id, {
      include: [
        { model: Product, as: 'product', include: [{ model: ProductCategory, as: 'category' }] },
        { model: Location, as: 'location' },
        { model: Customer, as: 'customer' },
        { model: User, as: 'createdBy', attributes: ['id', 'name', 'email'] },
      ],
    });

    if (!productReturn) {
      throw new AppError(404, 'Product return not found');
    }

    return productReturn;
  }

  /**
   * Get return by return number
   */
  async getReturnByNumber(returnNumber: string) {
    const productReturn = await ProductReturn.findOne({
      where: { returnNumber },
      include: [
        { model: Product, as: 'product', include: [{ model: ProductCategory, as: 'category' }] },
        { model: Location, as: 'location' },
        { model: Customer, as: 'customer' },
        { model: User, as: 'createdBy', attributes: ['id', 'name', 'email'] },
      ],
    });

    if (!productReturn) {
      throw new AppError(404, 'Product return not found');
    }

    return productReturn;
  }

  /**
   * Inspect return
   */
  async inspectReturn(id: string, data: InspectReturnDTO) {
    const productReturn = await this.getReturnById(id);
    const productReturnData = productReturn.toJSON() as any;

    if (productReturnData.status !== 'RECEIVED' && productReturnData.status !== 'INSPECTING') {
      throw new AppError(400, `Return cannot be inspected in current status: ${productReturnData.status}`);
    }

    const newStatus =
      data.recommendedAction === 'APPROVE'
        ? 'PENDING_APPROVAL'
        : data.recommendedAction === 'REJECT'
        ? 'REJECTED'
        : 'INSPECTING';

    await ProductReturn.update(
      {
        status: newStatus as any,
        condition: data.condition as any,
        conditionNotes: data.conditionNotes,
        inspectedBy: data.inspectedById,
        inspectedAt: new Date(),
        inspectionNotes: data.inspectionNotes,
        images: data.images ? (data.images as any) : productReturnData.images,
      },
      { where: { id } }
    );

    const updated = await ProductReturn.findByPk(id, {
      include: [
        { model: Product, as: 'product' },
        { model: Location, as: 'location' },
        { model: Customer, as: 'customer' },
      ],
    });

    const updatedData = updated!.toJSON() as any;

    // Send inspection notifications
    if (newStatus === 'PENDING_APPROVAL') {
      try {
        const locationName = updatedData.location?.name || 'Our Store';
        const customerName = updatedData.customerName || 'Valued Customer';
        
        await this.notificationOrchestrator.createReturnInspectionNotifications(
          updated!.id,
          updatedData.customerId,
          updatedData.locationId,
          {
            customerName,
            returnNumber: updatedData.returnNumber,
            productName: updatedData.product.name,
            refundAmount: updatedData.refundAmount?.toFixed(2) || '0.00',
            inspectionNotes: data.inspectionNotes || 'Inspected',
            locationName,
            companyName: 'LTS Phone Shop',
            contactPhone: updatedData.location?.phone || '',
          }
        );
        
        console.log(`Return inspection notifications sent for return ${updatedData.returnNumber}`);
      } catch (notificationError) {
        console.error('Error sending return inspection notifications:', notificationError);
      }
    } else if (newStatus === 'INSPECTING') {
      try {
        const locationName = updatedData.location?.name || 'Our Store';
        const customerName = updatedData.customerName || 'Valued Customer';
        
        await this.notificationOrchestrator.createReturnInspectingNotifications(
          updated!.id,
          updatedData.customerId,
          updatedData.locationId,
          {
            customerName,
            returnNumber: updatedData.returnNumber,
            productName: updatedData.product.name,
            inspectionNotes: data.inspectionNotes || 'Under Inspection',
            locationName,
            companyName: 'LTS Phone Shop',
            contactPhone: updatedData.location?.phone || '',
          }
        );
        
        console.log(`Return inspecting notifications sent for return ${updatedData.returnNumber}`);
      } catch (notificationError) {
        console.error('Error sending return inspecting notifications:', notificationError);
      }
    }

    return updated;
  }

  /**
   * Approve return
   */
  async approveReturn(id: string, data: ApproveReturnDTO) {
    const productReturn = await this.getReturnById(id);
    const productReturnData = productReturn.toJSON() as any;

    if (productReturnData.status !== 'PENDING_APPROVAL' && productReturnData.status !== 'INSPECTING') {
      throw new AppError(400, `Return cannot be approved in current status: ${productReturnData.status}`);
    }

    await ProductReturn.update(
      {
        status: 'APPROVED',
        approvedBy: data.approvedById,
        approvedAt: new Date(),
        approvalNotes: data.approvalNotes,
        resolutionType: data.resolutionType as any,
        refundAmount: data.refundAmount,
      },
      { where: { id } }
    );

    const updated = await ProductReturn.findByPk(id, {
      include: [
        { model: Product, as: 'product' },
        { model: Location, as: 'location' },
        { model: Customer, as: 'customer' },
      ],
    });

    const updatedData = updated!.toJSON() as any;

    // Send approval notifications
    try {
      const locationName = updatedData.location?.name || 'Our Store';
      const customerName = updatedData.customerName || 'Valued Customer';
      
      const approver = updatedData.approvedBy ? await User.findByPk(updatedData.approvedBy, {
        attributes: ['name'],
      }) : null;
      
      await this.notificationOrchestrator.createReturnDecisionNotifications(
        updated!.id,
        updatedData.customerId,
        updatedData.locationId,
        {
          customerName,
          returnNumber: updatedData.returnNumber,
          productName: updatedData.product.name,
          refundAmount: Number(updatedData.refundAmount || 0).toFixed(2),
          resolutionType: data.resolutionType,
          locationName,
          changedBy: approver?.name || 'Manager',
          companyName: 'LTS Phone Shop',
          contactPhone: updatedData.location?.phone || '',
        },
        true
      );
      
      console.log(`Return approval notifications sent for return ${updatedData.returnNumber}`);
    } catch (notificationError) {
      console.error('Error sending return approval notifications:', notificationError);
    }

    return updated;
  }

  /**
   * Reject return
   */
  async rejectReturn(id: string, data: RejectReturnDTO) {
    const productReturn = await this.getReturnById(id);
    const productReturnData = productReturn.toJSON() as any;

    if (productReturnData.status === 'COMPLETED' || productReturnData.status === 'CANCELLED') {
      throw new AppError(400, `Return cannot be rejected in current status: ${productReturnData.status}`);
    }

    await ProductReturn.update(
      {
        status: 'REJECTED',
        approvedBy: data.rejectedById,
        approvedAt: new Date(),
        approvalNotes: `REJECTED: ${data.rejectionReason}`,
        resolutionType: 'REJECTED',
        resolutionDetails: data.notes,
        completedAt: new Date(),
      },
      { where: { id } }
    );

    const updated = await ProductReturn.findByPk(id, {
      include: [
        { model: Product, as: 'product' },
        { model: Location, as: 'location' },
        { model: Customer, as: 'customer' },
      ],
    });

    const updatedData = updated!.toJSON() as any;

    // Send rejection notifications
    try {
      const locationName = updatedData.location?.name || 'Our Store';
      const customerName = updatedData.customerName || 'Valued Customer';
      
      const rejecter = await User.findByPk(data.rejectedById, {
        attributes: ['name'],
      });
      
      await this.notificationOrchestrator.createReturnDecisionNotifications(
        updated!.id,
        updatedData.customerId,
        updatedData.locationId,
        {
          customerName,
          returnNumber: updatedData.returnNumber,
          productName: updatedData.product.name,
          inspectionNotes: data.rejectionReason,
          locationName,
          changedBy: rejecter?.name || 'Manager',
          companyName: 'LTS Phone Shop',
          contactPhone: updatedData.location?.phone || '',
        },
        false
      );
      
      console.log(`Return rejection notifications sent for return ${updatedData.returnNumber}`);
    } catch (notificationError) {
      console.error('Error sending return rejection notifications:', notificationError);
    }

    return updated;
  }

  /**
   * Process return
   */
  async processReturn(id: string, data: ProcessReturnDTO) {
    const productReturn = await this.getReturnById(id);
    const productReturnData = productReturn.toJSON() as any;

    if (productReturnData.status !== 'APPROVED') {
      throw new AppError(400, `Return must be approved before processing. Current status: ${productReturnData.status}`);
    }

    // Validate refund data if processing refund
    if (data.resolutionType === 'REFUND_PROCESSED') {
      if (!data.refundAmount || data.refundAmount <= 0) {
        throw new AppError(400, 'Valid refund amount is required for refund processing');
      }
      if (!data.refundMethod) {
        throw new AppError(400, 'Refund method is required for refund processing');
      }
      if (productReturnData.sourceType !== 'SALE') {
        throw new AppError(400, 'Refunds can only be processed for returns from sales');
      }
      if (!productReturnData.sourceId) {
        throw new AppError(400, 'Sale ID is required to process refund');
      }
    }

    // Process within transaction to ensure data consistency
    const result = await sequelize.transaction(async (t) => {
      let saleRefundId: string | null = null;

      // Handle REFUND_PROCESSED for SALE returns
      if (data.resolutionType === 'REFUND_PROCESSED' && productReturnData.sourceType === 'SALE' && productReturnData.sourceId) {
        // Get the sale with existing refunds
        const sale = await Sale.findByPk(productReturnData.sourceId, {
          include: [
            {
              model: SaleRefund,
              as: 'saleRefunds'
            },
            {
              model: SaleItem,
              as: 'saleItems'
            }
          ],
          transaction: t
        });

        if (!sale) {
          throw new AppError(404, 'Sale not found');
        }

        if (sale.status === SaleStatus.CANCELLED) {
          throw new AppError(400, 'Cannot refund cancelled sale');
        }

        // Calculate total already refunded
        const totalRefunded = Array.isArray(sale.saleRefunds) 
          ? sale.saleRefunds.reduce((sum: number, r: any) => sum + Number(r.amount), 0) 
          : 0;

        // Validate refund amount doesn't exceed sale total
        if (totalRefunded + data.refundAmount! > Number(sale.totalAmount)) {
          throw new AppError(400, `Refund amount exceeds remaining sale total. Already refunded: ${totalRefunded}, Sale total: ${sale.totalAmount}`);
        }

        // Generate refund number
        const year = new Date().getFullYear();
        const refundNumber = `REF-${year}-${Date.now()}`;

        // Get the user who approved the return (they will be the refund processor)
        const processedById = productReturnData.approvedBy || productReturnData.createdById;

        // Create sale refund record
        const saleRefund = await SaleRefund.create({
          refundNumber,
          saleId: productReturnData.sourceId,
          amount: data.refundAmount,
          reason: `Product Return: ${productReturnData.returnNumber} - ${productReturnData.returnReason}`,
          refundMethod: data.refundMethod,
          processedById: processedById
        }, { transaction: t });

        saleRefundId = saleRefund.id;

        // Restore stock to inventory
        const inventory = await ProductInventory.findOne({
          where: {
            productId: productReturnData.productId,
            locationId: productReturnData.locationId
          },
          transaction: t
        });

        if (inventory) {
          // Restore stock
          const currentQuantity = Number(inventory.quantity);
          const newQuantity = currentQuantity + productReturnData.quantity;
          const newAvailableQuantity = newQuantity - Number(inventory.reservedQuantity);

          await ProductInventory.update({
            quantity: newQuantity,
            availableQuantity: newAvailableQuantity,
          }, {
            where: {
              productId: productReturnData.productId,
              locationId: productReturnData.locationId
            },
            transaction: t
          });

          // Create stock movement record
          await ProductStockMovement.create({
            productId: productReturnData.productId,
            locationId: productReturnData.locationId,
            movementType: 'RETURN_FROM_CUSTOMER',
            quantity: productReturnData.quantity,
            quantityBefore: currentQuantity,
            quantityAfter: newQuantity,
            referenceId: productReturnData.sourceId,
            referenceType: 'SALE_REFUND',
            createdBy: processedById,
            notes: `Stock restored - Return: ${productReturnData.returnNumber} - Refund: ${refundNumber} - ${productReturnData.returnReason}`
          }, { transaction: t });
        } else {
          // If inventory doesn't exist, create it
          await ProductInventory.create({
            productId: productReturnData.productId,
            locationId: productReturnData.locationId,
            quantity: productReturnData.quantity,
            availableQuantity: productReturnData.quantity,
            reservedQuantity: 0,
            minStockLevel: 0,
            maxStockLevel: 0
          }, { transaction: t });

          // Create stock movement record
          await ProductStockMovement.create({
            productId: productReturnData.productId,
            locationId: productReturnData.locationId,
            movementType: 'RETURN_FROM_CUSTOMER',
            quantity: productReturnData.quantity,
            quantityBefore: 0,
            quantityAfter: productReturnData.quantity,
            referenceId: productReturnData.sourceId,
            referenceType: 'SALE_REFUND',
            createdBy: processedById,
            notes: `Stock restored (new inventory) - Return: ${productReturnData.returnNumber} - Refund: ${refundNumber}`
          }, { transaction: t });
        }

        // Update sale status
        const newTotalRefunded = totalRefunded + data.refundAmount!;
        let newSaleStatus = sale.status;

        if (newTotalRefunded >= Number(sale.totalAmount)) {
          newSaleStatus = SaleStatus.REFUNDED;
        } else if (newTotalRefunded > 0) {
          newSaleStatus = SaleStatus.PARTIAL_REFUND;
        }

        await Sale.update({
          status: newSaleStatus
        }, {
          where: { id: productReturnData.sourceId },
          transaction: t
        });

        console.log(`Sale refund created: ${refundNumber} for return ${productReturnData.returnNumber}`);
      }

      // Update product return status and link sale refund
      await ProductReturn.update(
        {
          status: 'COMPLETED',
          resolutionType: data.resolutionType as any,
          resolutionDetails: data.notes,
          resolutionDate: new Date(),
          completedAt: new Date(),
          refundAmount: data.refundAmount,
          saleRefundId: saleRefundId,
        },
        { where: { id }, transaction: t }
      );

      // Fetch updated return with all relations
      const updated = await ProductReturn.findByPk(id, {
        include: [
          { model: Product, as: 'product' },
          { model: Location, as: 'location' },
          { model: Customer, as: 'customer' },
        ],
        transaction: t
      });

      return updated;
    });

    const updatedData = result!.toJSON() as any;

    // Send completion notifications
    try {
      const locationName = updatedData.location?.name || 'Our Store';
      const customerName = updatedData.customerName || 'Valued Customer';
      
      const processor = updatedData.approvedBy ? await User.findByPk(updatedData.approvedBy, {
        attributes: ['name'],
      }) : null;
      
      await this.notificationOrchestrator.createReturnCompletionNotifications(
        result!.id,
        updatedData.customerId,
        updatedData.locationId,
        {
          customerName,
          returnNumber: updatedData.returnNumber,
          productName: updatedData.product.name,
          refundAmount: Number(updatedData.refundAmount || 0).toFixed(2),
          resolutionType: updatedData.resolutionType || 'REFUND_PROCESSED',
          locationName,
          changedBy: processor?.name || 'Manager',
          companyName: 'LTS Phone Shop',
          contactPhone: updatedData.location?.phone || '',
        }
      );
      
      console.log(`Return completion notifications sent for return ${updatedData.returnNumber}`);
    } catch (notificationError) {
      console.error('Error sending return completion notifications:', notificationError);
    }

    return result;
  }

  /**
   * Cancel return
   */
  async cancelReturn(id: string, data: CancelReturnDTO) {
    const productReturn = await this.getReturnById(id);
    const productReturnData = productReturn.toJSON() as any;

    if (productReturnData.status === 'COMPLETED') {
      throw new AppError(400, 'Cannot cancel a completed return');
    }

    if (productReturnData.status === 'CANCELLED') {
      throw new AppError(400, 'Return is already cancelled');
    }

    await ProductReturn.update(
      {
        status: 'CANCELLED',
        notes: `${productReturnData.notes || ''}\n\nCANCELLED: ${data.reason}`,
        completedAt: new Date(),
      },
      { where: { id } }
    );

    const updated = await ProductReturn.findByPk(id, {
      include: [
        { model: Product, as: 'product' },
        { model: Location, as: 'location' },
        { model: Customer, as: 'customer' },
      ],
    });

    const updatedData = updated!.toJSON() as any;

    // Send cancellation notifications
    try {
      const locationName = updatedData.location?.name || 'Our Store';
      const customerName = updatedData.customerName || 'Valued Customer';
      
      await this.notificationOrchestrator.createReturnCancellationNotifications(
        updated!.id,
        updatedData.customerId,
        updatedData.locationId,
        {
          customerName,
          returnNumber: updatedData.returnNumber,
          productName: updatedData.product.name,
          reason: data.reason,
          locationName,
          companyName: 'LTS Phone Shop',
          contactPhone: updatedData.location?.phone || '',
        }
      );
      
      console.log(`Return cancellation notifications sent for return ${updatedData.returnNumber}`);
    } catch (notificationError) {
      console.error('Error sending return cancellation notifications:', notificationError);
    }

    return updated;
  }

  /**
   * Query returns with filters
   */
  async queryReturns(query: QueryProductReturnsDTO) {
    const page = parseInt(query.page as any) || 1;
    const limit = Math.min(parseInt(query.limit as any) || 10, 100);
    const offset = (page - 1) * limit;

    const where: any = {};

    if (query.locationId) where.locationId = query.locationId;
    if (query.customerId) where.customerId = query.customerId;
    if (query.productId) where.productId = query.productId;
    if (query.status) where.status = query.status;
    if (query.returnCategory) where.category = query.returnCategory;
    if (query.sourceType) where.sourceType = query.sourceType;
    if (query.sourceId) where.sourceId = query.sourceId;
    if (query.priority) where.priority = query.priority;

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) where.createdAt[Op.gte] = new Date(query.startDate);
      if (query.endDate) where.createdAt[Op.lte] = new Date(query.endDate);
    }

    if (query.search) {
      where[Op.or] = [
        { returnNumber: { [Op.iLike]: `%${query.search}%` } },
        { customerName: { [Op.iLike]: `%${query.search}%` } },
        { customerPhone: { [Op.like]: `%${query.search}%` } },
        { serialNumber: { [Op.iLike]: `%${query.search}%` } },
      ];
    }

    const { count: total, rows: returns } = await ProductReturn.findAndCountAll({
      where,
      offset,
      limit,
      order: [['created_at', 'DESC']],
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'sku'],
          include: [{ model: ProductCategory, as: 'category', attributes: ['name'] }],
        },
        {
          model: Location,
          as: 'location',
          attributes: ['id', 'name', 'location_code'],
        },
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'customer_id', 'name', 'phone'],
        },
        {
          model: User,
          as: 'createdBy',
          attributes: ['id', 'name'],
        },
      ],
    });

    return {
      returns: returns.map(r => r.toJSON()),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Get return statistics
   */
  async getStats(query?: ProductReturnStatsQueryDTO) {
    const where: any = {};

    if (query?.locationId) where.locationId = query.locationId;
    if (query?.startDate || query?.endDate) {
      where.createdAt = {};
      if (query.startDate) where.createdAt[Op.gte] = new Date(query.startDate);
      if (query.endDate) where.createdAt[Op.lte] = new Date(query.endDate);
    }

    const total = await ProductReturn.count({ where });

    const byStatus = await ProductReturn.findAll({
      where,
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      ],
      group: ['status'],
      raw: true,
    });

    const byCategory = await ProductReturn.findAll({
      where,
      attributes: [
        'returnCategory',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      ],
      group: ['returnCategory'],
      raw: true,
    });

    const byPriority = await ProductReturn.findAll({
      where,
      attributes: [
        'priority',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      ],
      group: ['priority'],
      raw: true,
    });

    const bySourceType = await ProductReturn.findAll({
      where,
      attributes: [
        'source_type',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      ],
      group: ['source_type'],
      raw: true,
    });

    const totalValueResult = await ProductReturn.findAll({
      where,
      attributes: [
        [sequelize.fn('SUM', sequelize.col('product_value')), 'total'],
      ],
      raw: true,
    });

    const totalRefundResult = await ProductReturn.findAll({
      where,
      attributes: [
        [sequelize.fn('SUM', sequelize.col('refund_amount')), 'total'],
      ],
      raw: true,
    });

    return {
      total,
      byStatus: (byStatus as any[]).reduce((acc, item) => {
        acc[item.status] = parseInt(item.count, 10);
        return acc;
      }, {} as any),
      byCategory: (byCategory as any[]).reduce((acc, item) => {
        acc[item.returnCategory] = parseInt(item.count, 10);
        return acc;
      }, {} as any),
      byPriority: (byPriority as any[]).reduce((acc, item) => {
        acc[item.priority] = parseInt(item.count, 10);
        return acc;
      }, {} as any),
      bySourceType: (bySourceType as any[]).reduce((acc, item) => {
        acc[item.source_type] = parseInt(item.count, 10);
        return acc;
      }, {} as any),
      totalValue: parseFloat((totalValueResult as any[])[0]?.total || '0'),
      totalRefundAmount: parseFloat((totalRefundResult as any[])[0]?.total || '0'),
    };
  }

  /**
   * Get return analytics
   */
  async getAnalytics(query: ReturnAnalyticsQueryDTO): Promise<ReturnAnalyticsDTO> {
    const where: any = {};

    if (query.locationId) where.locationId = query.locationId;
    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) where.createdAt[Op.gte] = new Date(query.startDate);
      if (query.endDate) where.createdAt[Op.lte] = new Date(query.endDate);
    }

    const [
      totalReturns,
      approvedReturns,
      rejectedReturns,
      pendingReturns,
      totalRefundResult,
      topReturnedProducts,
      topReturnCategories,
      bySourceType,
    ] = await Promise.all([
      ProductReturn.count({ where }),
      ProductReturn.count({ where: { ...where, status: 'APPROVED' } }),
      ProductReturn.count({ where: { ...where, status: 'REJECTED' } }),
      ProductReturn.count({
        where: {
          ...where,
          status: { [Op.in]: ['RECEIVED', 'INSPECTING', 'PENDING_APPROVAL'] },
        },
      }),
      ProductReturn.findAll({
        where: { ...where, status: 'APPROVED' },
        attributes: [[sequelize.fn('SUM', sequelize.col('refundAmount')), 'total']],
        raw: true,
      }),
      ProductReturn.findAll({
        where,
        attributes: [
          'productId',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        ],
        group: ['productId'],
        order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
        limit: 10,
        raw: true,
      }),
      ProductReturn.findAll({
        where,
        attributes: [
          'category',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        ],
        group: ['category'],
        order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
        raw: true,
      }),
      ProductReturn.findAll({
        where,
        attributes: [
          'source_type',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        ],
        group: ['source_type'],
        raw: true,
      }),
    ]);

    // Get product details
    const productIds = (topReturnedProducts as any[]).map((p) => p.productId);
    const productDetails = await Product.findAll({
      where: { id: { [Op.in]: productIds } },
      attributes: ['id', 'name', 'sku'],
      include: [{ model: ProductCategory, as: 'category', attributes: ['name'] }],
    });

    const topProducts = (topReturnedProducts as any[]).map((item) => {
      const product = productDetails.find((p) => p.id === item.productId);
      return {
        productId: item.productId,
        productName: product?.name || 'Unknown',
        returnCount: parseInt(item.count, 10),
        totalValue: 0,
      };
    });

    const totalRefundAmount = parseFloat((totalRefundResult as any[])[0]?.total || '0');

    return {
      period: query.startDate ? `${query.startDate} to ${query.endDate || 'now'}` : 'All time',
      totalReturns,
      approvedReturns,
      rejectedReturns,
      pendingReturns,
      approvalRate: totalReturns > 0 ? (approvedReturns / totalReturns) * 100 : 0,
      totalRefundAmount,
      topReturnedProducts: topProducts,
      topReturnCategories: (topReturnCategories as any[]).map((item) => ({
        category: item.category,
        count: parseInt(item.count, 10),
      })),
      bySourceType: (bySourceType as any[]).reduce((acc, item) => {
        acc[item.sourceType] = parseInt(item.count, 10);
        return acc;
      }, {} as any),
      byCategory: {},
      byReason: {},
      topProducts,
      returnRate: 0,
      averageValue: 0,
      trends: [],
    };
  }
}

