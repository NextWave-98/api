import { AppError } from '../../shared/utils/app-error';
import { CreateSaleDTO, CreateSalePaymentDTO, CreateSaleRefundDTO, SalesQueryDTO } from './sales.dto';
import { SaleStatus, PaymentStatus, PaymentMethod } from '../../enums';
import { WarrantyService } from '../warranty/warranty.service';
import { SMSService } from '../sms/sms.service';
import { NotificationOrchestrator } from '../notification/notification-orchestrator.service';
import {
  Sale,
  SaleItem,
  SalePayment,
  SaleRefund,
  Product,
  ProductInventory,
  ProductStockMovement,
  Customer,
  Location,
  User,
  Notification,
  Business,
} from '../../models';
import { and, Op } from 'sequelize';
import sequelize  from '../../shared/config/database';
const PDFDocument = require('pdfkit');
const axios = require('axios');

export class SalesPOSService {
  private warrantyService = new WarrantyService();
  private smsService = new SMSService();
  private notificationOrchestrator = new NotificationOrchestrator();
  
  /**
   * Generate unique sale number
   */
  private async generateSaleNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const lastSale = await Sale.findOne({
      where: {
        saleNumber: {
          [Op.like]: `SALE-${year}-%`
        }
      },
      order: [['created_at', 'DESC']],
    });

    let nextNumber = 1;
    if (lastSale) {
      const lastNumber = parseInt(lastSale.saleNumber.split('-')[2]);
      nextNumber = lastNumber + 1;
    }

    return `SALE-${year}-${nextNumber.toString().padStart(4, '0')}`;
  }

  /**
   * Normalize payment method from frontend to match enum
   */
  private normalizePaymentMethod(method: string): PaymentMethod {
    switch (method.toUpperCase()) {
      case 'CASH':
        return PaymentMethod.CASH;
      case 'CARD':
        return PaymentMethod.CARD;
      case 'BANK_TRANSFER':
        return PaymentMethod.BANK_TRANSFER;
      case 'MOBILE_PAYMENT':
      case 'MOBILE_MONEY':
        return PaymentMethod.MOBILE_PAYMENT;
      case 'CHECK':
      case 'CHEQUE':
        return PaymentMethod.CHECK;
      case 'OTHER':
        return PaymentMethod.OTHER;
      default:
        throw new AppError(400, `Invalid payment method: ${method}`);
    }
  }

  /**
   * Create a new sale (POS transaction)
   */
  async createSale(data: CreateSaleDTO) {
    try {
      // Validate items
      if (!data.items || data.items.length === 0) {
        throw new AppError(400, 'At least one item is required');
      }

      // Fetch customer details if customerId is provided but customer info is missing
      let customerName = data.customerName;
      let customerPhone = data.customerPhone;
      let customerEmail = data.customerEmail;

      if (data.customerId && (!customerName || !customerPhone || !customerEmail)) {
        const customer = await Customer.findByPk(data.customerId, {
          attributes: ['name', 'phone', 'email']
        });

        if (customer) {
          customerName = customerName || customer.name;
          customerPhone = customerPhone || customer.phone;
          customerEmail = customerEmail || customer.email || undefined;
        }
      }

      // Calculate totals
      let subtotal = 0;
      let totalTax = 0;

      const items = data.items.map(item => {
        const itemSubtotal = (item.unitPrice * item.quantity) - (item.discount || 0);
        const itemTax = item.tax || 0;
        subtotal += itemSubtotal;
        totalTax += itemTax;

        return {
          ...item,
          subtotal: itemSubtotal,
          tax: itemTax,
          discount: item.discount || 0
        };
      });

      const discount = data.discount || 0;
      const totalAmount = subtotal + totalTax - discount;
      
      // Calculate paid amount from payments array or use legacy paidAmount
      let paidAmount = 0;
      let paymentMethod = data.paymentMethod;
      let paymentReference = data.paymentReference;

      if (data.payments && data.payments.length > 0) {
        // New format: payments array
        paidAmount = data.payments.reduce((sum, p) => sum + p.amount, 0);
        // Use first payment's details for legacy fields
        paymentMethod = data.payments[0].method as PaymentMethod;
        paymentReference = data.payments[0].reference;
      } else if (data.paidAmount) {
        // Legacy format
        paidAmount = data.paidAmount;
      }

      // Balance amount = paidAmount - totalAmount
      // Positive = Change to give back to customer (overpaid)
      // Negative = Amount still owed by customer (underpaid)
      // Zero = Exact payment
      const balanceAmount = paidAmount - totalAmount;

      // Determine payment status
      let paymentStatus: PaymentStatus = PaymentStatus.PENDING;
      if (paidAmount >= totalAmount) {
        paymentStatus = PaymentStatus.COMPLETED;
      } else if (paidAmount > 0) {
        paymentStatus = PaymentStatus.PARTIAL;
      }

      // Generate sale number
      const saleNumber = await this.generateSaleNumber();

      // Create sale with items in transaction
      const sale = await sequelize.transaction(async (t) => {
        // Create sale
        const newSale = await Sale.create({
          saleNumber,
          customerId: data.customerId,
          customerName,
          customerPhone,
          customerEmail,
          locationId: data.locationId,
          soldById: data.soldById,
          createdBy: data.soldById,
          createdById: data.soldById,
          saleDate: new Date(),
          saleType: data.saleType || 'POS',
          saleChannel: data.saleChannel || 'POS',
          subtotal,
          discount,
          discountAmount: discount,
          discountType: data.discountType,
          discountReason: data.discountReason,
          tax: totalTax,
          taxAmount: totalTax,
          taxRate: data.taxRate || 0,
          totalAmount,
          finalAmount: totalAmount,
          paidAmount,
          balanceAmount,
          paymentStatus,
          paymentMethod,
          paymentReference,
          status: SaleStatus.COMPLETED,
          notes: data.notes,
          // Legacy array columns (required by database schema)
          items: '[]',
          payments: '[]',
          refunds: '[]',
          warrantyCards: '[]',
          notifications: '[]',
        }, { transaction: t });

        // Reload with relations
        await newSale.reload({
          include: [
            { model: Customer, as: 'customer' },
            { model: Location, as: 'location' },
            {
              model: User,
              as: 'soldBy',
              attributes: ['id', 'name', 'email']
            }
          ],
          transaction: t
        });

        // Create sale items
        for (const item of items) {
          const product = await Product.findByPk(item.productId, { transaction: t });

          if (!product) {
            throw new AppError(404, `Product not found: ${item.productId}`);
          }

          // Check stock availability - find by composite key
          const inventory = await ProductInventory.findOne({
            where: {
              productId: item.productId,
              locationId: data.locationId
            },
            transaction: t
          });

          if (!inventory) {
            throw new AppError(400, `Product not available in this location: ${product.name}`);
          }

          // Convert DECIMAL fields to numbers for comparison
          const availableQty = Number(inventory.availableQuantity);
          const currentQty = Number(inventory.quantity);
          const reservedQty = Number(inventory.reservedQuantity);

          if (availableQty < item.quantity) {
            throw new AppError(
              400, 
              `Insufficient stock for ${product.name}. Available: ${availableQty}, Required: ${item.quantity}`
            );
          }

          // Create sale item
          await SaleItem.create({
            saleId: newSale.id,
            productId: item.productId,
            productName: product.name,
            costPrice: product.costPrice || 0,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discountAmount: item.discount || 0,
            tax: item.tax || 0,
            subtotal: item.subtotal,
            warrantyMonths: item.warrantyMonths || 0,
            warrantyExpiry: item.warrantyMonths 
              ? new Date(Date.now() + item.warrantyMonths * 30 * 24 * 60 * 60 * 1000)
              : null
          }, { transaction: t });

          // Update inventory - Decrease stock
          const newQuantity = currentQty - item.quantity;
          const newAvailableQuantity = newQuantity - reservedQty;

          await ProductInventory.update({
            quantity: newQuantity,
            availableQuantity: newAvailableQuantity,
          }, {
            where: {
              productId: item.productId,
              locationId: data.locationId
            },
            transaction: t
          });

          // Create stock movement record
          await ProductStockMovement.create({
            productId: item.productId,
            locationId: data.locationId,
            movementType: 'SALES',
            quantity: item.quantity,
            quantityBefore: currentQty,
            quantityAfter: newQuantity,
            referenceId: newSale.id,
            referenceType: 'SALE',
            createdBy: data.soldById,
            notes: `Sale: ${saleNumber} - ${product.name}`
          }, { transaction: t });
        }

        // Create payment records
        if (data.payments && data.payments.length > 0) {
          // New format: Create a payment record for each payment
          for (let i = 0; i < data.payments.length; i++) {
            const payment = data.payments[i];
            const paymentNumber = `PAY-${saleNumber}-${i + 1}`;
            
            await SalePayment.create({
              paymentNumber,
              saleId: newSale.id,
              amount: payment.amount,
              paymentMethod: this.normalizePaymentMethod(payment.method),
              referenceNumber: payment.reference,
              status: PaymentStatus.COMPLETED,
              receivedById: data.soldById
            }, { transaction: t });
          }
        } else if (paidAmount > 0 && paymentMethod) {
          // Legacy format: Single payment
          const paymentNumber = `PAY-${saleNumber}`;
          await SalePayment.create({
            paymentNumber,
            saleId: newSale.id,
            amount: paidAmount,
            paymentMethod: paymentMethod,
            referenceNumber: paymentReference,
            status: PaymentStatus.COMPLETED,
            receivedById: data.soldById
          }, { transaction: t });
        }

        return newSale;
      });

      // Auto-generate warranty cards for items with warranty
      try {
        // Get all sale items
        const saleItems = await SaleItem.findAll({
          where: { saleId: sale.id },
          attributes: ['id', 'warrantyMonths']
        });

        // Generate warranty for each item that has warranty
        for (const item of saleItems) {
          if (item.warrantyMonths > 0) {
            await this.warrantyService.generateWarrantyFromSaleItem(item.id);
          }
        }
      } catch (warrantyError) {
        // Log error but don't fail the sale
        console.error('Error generating warranty cards:', warrantyError);
      }

      // Send notifications using NotificationOrchestrator
      if (sale.status === SaleStatus.COMPLETED) {
        const locationName = sale.location?.name || 'Our Store';
        try {
          const itemCount = items.length;
          const saleItems = await SaleItem.findAll({
            where: { saleId: sale.id },
            include: [
              {
                model: Product,
                as: 'product',
                attributes: ['name']
              }
            ],
            limit: 3,
          });
          const itemsSummary = saleItems.map(i => i.product?.name).filter(Boolean).slice(0, 3).join(', ') + 
            (items.length > 3 ? '...' : '');
          
          await this.notificationOrchestrator.createSaleNotifications(
            sale.id,
            data.customerId || null,
            data.locationId,
            {
              customerName: customerName || 'Valued Customer',
              saleNumber: sale.saleNumber,
              totalAmount: Number(sale.totalAmount).toFixed(2),
              paidAmount: Number(sale.paidAmount).toFixed(2),
              balanceAmount: Number(sale.balanceAmount).toFixed(2),
              itemCount,
              itemsSummary,
              discount: Number(sale.discount || 0).toFixed(2),
              paymentMethod: paymentMethod || 'Not specified',
              locationName,
              companyName: 'LTS Phone Shop',
              contactPhone: sale.location?.phone || '',
            }
          );
          
          console.log(`Sale notifications sent successfully for sale ${sale.saleNumber}`);
          
          // Check if customer notification was sent successfully
          if (data.customerId && customerPhone) {
            const customerNotifications = await Notification.findAll({
              where: {
                saleId: sale.id,
                recipientType: 'CUSTOMER',
                status: 'SENT'
              }
            });
            
            if (customerNotifications.length === 0) {
              console.log('Customer notification failed, sending fallback SMS...');
              // Fallback: Send direct SMS to customer
              try {
                const smsResult = await this.smsService.sendSaleConfirmationSMS(
                  customerPhone,
                  customerName || 'Valued Customer',
                  sale.saleNumber,
                  parseFloat(sale.totalAmount.toFixed(2)),
                  locationName
                );
                
                if (smsResult.success) {
                  console.log('Fallback SMS sent successfully');
                } else {
                  console.error('Fallback SMS failed:', smsResult.message);
                }
              } catch (smsError) {
                console.error('Error sending fallback SMS:', smsError);
              }
            }
          }
        } catch (notificationError) {
          // Log error but don't fail the sale
          console.error('Error sending sale notifications:', notificationError);
          
          // Fallback: Send direct SMS to customer if notification system fails completely
          if (customerPhone) {
            try {
              console.log('Sending fallback SMS to customer due to notification error...');
              const smsResult = await this.smsService.sendSaleConfirmationSMS(
                customerPhone,
                customerName || 'Valued Customer',
                sale.saleNumber,
                parseFloat(Number(sale.totalAmount).toFixed(2)),
                locationName
              );
              
              if (smsResult.success) {
                console.log('Fallback SMS sent successfully');
              } else {
                console.error('Fallback SMS failed:', smsResult.message);
              }
            } catch (smsError) {
              console.error('Error sending fallback SMS:', smsError);
            }
          }
        }
      }

      return this.getSaleById(sale.id);
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('Error creating sale:', error);
      // Log detailed error information
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      throw new AppError(500, `Failed to create sale: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get sale by ID
   */
  async getSaleById(id: string) {
    const sale = await Sale.findByPk(id, {
      include: [
        { model: Customer, as: 'customer' },
        {
          model: Location,
          as: 'location',
          attributes: ['id', 'name', 'location_code']
        },
        {
          model: User,
          as: 'soldBy',
          attributes: ['id', 'name', 'email']
        },
        {
          model: SaleItem,
          as: 'saleItems',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'name', 'sku'],
              include: [
                {
                  association: 'category',
                  attributes: ['id', 'name']
                }
              ]
            }
          ]
        },
        {
          model: SalePayment,
          as: 'salePayments',
          include: [
            {
              model: User,
              as: 'receivedBy',
              attributes: ['id', 'name', 'email']
            }
          ]
        },
        {
          model: SaleRefund,
          as: 'saleRefunds',
          include: [
            {
              model: User,
              as: 'processedBy',
              attributes: ['id', 'name', 'email']
            }
          ]
        }
      ]
    });

    if (!sale) {
      throw new AppError(404, 'Sale not found');
    }

    return sale.toJSON();
  }

  /**
   * Get sales list with filters
   */
  async getSales(query: SalesQueryDTO) {
    const {
      locationId,
      customerId,
      soldById,
      status,
      paymentStatus,
      saleType,
      startDate,
      endDate,
      search,
      page = 1,
      limit = 20
    } = query;

    const where: any = {};

    if (locationId) where.locationId = locationId;
    if (customerId) where.customerId = customerId;
    if (soldById) where.soldById = soldById;
    if (status) where.status = status;
    if (paymentStatus) where.paymentStatus = paymentStatus;
    if (saleType) where.saleType = saleType;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt[Op.gte] = new Date(startDate);
      if (endDate) where.createdAt[Op.lte] = new Date(endDate);
    }

    if (search) {
      where[Op.or] = [
        { saleNumber: { [Op.iLike]: `%${search}%` } },
        { customerName: { [Op.iLike]: `%${search}%` } },
        { customerPhone: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const { count, rows: sales } = await Sale.findAndCountAll({
      where,
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'name', 'phone', 'email']
        },
        {
          model: Location,
          as: 'location',
          attributes: ['id', 'name', 'location_code']
        },
        {
          model: User,
          as: 'soldBy',
          attributes: ['id', 'name', 'email']
        },
        {
          model: SaleItem,
          as: 'saleItems',
          attributes: ['id', 'quantity', 'unit_price', 'subtotal', 'productId', 'productName', 'warrantyMonths', 'warrantyExpiry', 'createdAt', 'updatedAt'],
        },
       
      ],
    
      order: [['created_at', 'DESC']],
      offset: (page - 1) * limit,
      limit: limit,
      distinct: true
    });

    const productIds = [...new Set(sales.flatMap(sale => sale.saleItems?.map(item => item.productId) || []))];
      
    const SaleProductDetails = await Product.findAll({
        where: { id: { [Op.in]: productIds } },
        attributes: ['id', 'name', 'sku', 'categoryId','productCode', 'barcode', 'costPrice', 'unitPrice', 'brand', 'model', 'specifications', 'description'],
    });

    // console.log(SaleProductDetails)

    return {
      data: sales.map(s => s.toJSON()),
      saleProduct: SaleProductDetails,
      pagination: {
        total: count,
        page,
        limit,
        pages: Math.ceil(count / limit)
      }
    };
  }

  /**
   * Add payment to sale
   */
  async addPayment(data: CreateSalePaymentDTO) {
    try {
      const sale = await Sale.findByPk(data.saleId);

      if (!sale) {
        throw new AppError(404, 'Sale not found');
      }

      if (sale.status === SaleStatus.CANCELLED) {
        throw new AppError(400, 'Cannot add payment to cancelled sale');
      }

      const result = await sequelize.transaction(async (t) => {
        // Generate payment number
        const paymentNumber = `PAY-${sale.saleNumber}-${Date.now()}`;

        // Create payment
        const payment = await SalePayment.create({
          paymentNumber,
          saleId: data.saleId,
          amount: data.amount,
          paymentMethod: data.paymentMethod,
          referenceNumber: data.reference,
          status: PaymentStatus.COMPLETED,
          receivedById: data.receivedById,
          notes: data.notes
        }, { transaction: t });

        // Update sale paid amount and payment status
        const newPaidAmount = Number(sale.paidAmount) + data.amount;
        const newBalance = Number(sale.totalAmount) - newPaidAmount;

        let newPaymentStatus: PaymentStatus = PaymentStatus.PARTIAL;
        if (newBalance <= 0) {
          newPaymentStatus = PaymentStatus.COMPLETED;
        }

        await Sale.update({
          paidAmount: newPaidAmount,
          balanceAmount: newBalance,
          paymentStatus: newPaymentStatus
        }, {
          where: { id: data.saleId },
          transaction: t
        });

        return payment;
      });

      return result.toJSON();
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('Error adding payment:', error);
      throw new AppError(500, 'Failed to add payment');
    }
  }

  /**
   * Create refund for sale
   */
  async createRefund(data: CreateSaleRefundDTO) {
    try {
      const sale = await Sale.findByPk(data.saleId, {
        include: [
          {
            model: SaleRefund,
            as: 'saleRefunds'
          }
        ]
      });

      if (!sale) {
        throw new AppError(404, 'Sale not found');
      }

      if (sale.status === SaleStatus.CANCELLED) {
        throw new AppError(400, 'Cannot refund cancelled sale');
      }

      // Calculate total refunded amount
      const totalRefunded = Array.isArray(sale.saleRefunds) ? sale.saleRefunds.reduce((sum: number, r: any) => sum + Number(r.amount), 0) : 0;

      if (totalRefunded + data.amount > Number(sale.totalAmount)) {
        throw new AppError(400, 'Refund amount exceeds sale total');
      }

      const result = await sequelize.transaction(async (t) => {
        // Generate refund number
        const year = new Date().getFullYear();
        const refundNumber = `REF-${year}-${Date.now()}`;

        // Create refund
        const refund = await SaleRefund.create({
          refundNumber,
          saleId: data.saleId,
          amount: data.amount,
          reason: data.reason,
          refundMethod: data.refundMethod,
          processedById: data.processedById
        }, { transaction: t });

        // Restore stock for returned items (if specified)
        if (data.items && data.items.length > 0) {
          for (const refundItem of data.items) {
            // Get current inventory
            const inventory = await ProductInventory.findOne({
              where: {
                productId: refundItem.productId,
                locationId: sale.locationId
              },
              transaction: t
            });

            if (inventory) {
              // Restore stock
              const currentQuantity = Number(inventory.quantity);
              const newQuantity = inventory.quantity + refundItem.quantity;
              const newAvailableQuantity = newQuantity - inventory.reservedQuantity;

              await ProductInventory.update({
                quantity: newQuantity,
                availableQuantity: newAvailableQuantity,
              }, {
                where: {
                  productId: refundItem.productId,
                  locationId: sale.locationId
                },
                transaction: t
              });

              // Create stock movement record
              await ProductStockMovement.create({
                productId: refundItem.productId,
                locationId: sale.locationId,
                movementType: 'RETURN_FROM_CUSTOMER',
                quantity: refundItem.quantity,
                quantityBefore: currentQuantity,
                quantityAfter: newQuantity,
                referenceId: sale.id,
                referenceType: 'SALE_REFUND',
                createdBy: data.processedById,
                notes: `Stock restored - Refund: ${refundNumber} - ${data.reason}`
              }, { transaction: t });
            }
          }
        }

        // Update sale status
        const newTotalRefunded = totalRefunded + data.amount;
        let newStatus = sale.status;

        if (newTotalRefunded >= Number(sale.totalAmount)) {
          newStatus = SaleStatus.REFUNDED;
        } else {
          newStatus = SaleStatus.PARTIAL_REFUND;
        }

        await Sale.update({
          status: newStatus
        }, {
          where: { id: data.saleId },
          transaction: t
        });

        return refund;
      });

      return result.toJSON();
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('Error creating refund:', error);
      throw new AppError(500, 'Failed to create refund');
    }
  }

  /**
   * Cancel sale
   */
  async cancelSale(id: string, userId: string, reason: string) {
    try {
      const sale = await Sale.findByPk(id);

      if (!sale) {
        throw new AppError(404, 'Sale not found');
      }

      if (sale.status === SaleStatus.CANCELLED) {
        throw new AppError(400, 'Sale is already cancelled');
      }

      if (Number(sale.paidAmount) > 0) {
        throw new AppError(400, 'Cannot cancel sale with payments. Please create a refund instead.');
      }

      // Get user and location details for notifications
      const [user, location] = await Promise.all([
        User.findByPk(userId, { attributes: ['name'] }),
        Location.findByPk(sale.locationId, { attributes: ['name', 'phone'] }),
      ]);

      await sequelize.transaction(async (t) => {
        // Update sale status
        await Sale.update({
          status: SaleStatus.CANCELLED,
          cancelledAt: new Date(),
          notes: `${sale.notes || ''}\n\nCancelled by user ${userId}. Reason: ${reason}`
        }, {
          where: { id },
          transaction: t
        });

        // Restore product stock
        const items = await SaleItem.findAll({
          where: { saleId: id },
          transaction: t
        });

        for (const item of items) {
          // Get current inventory
          const inventory = await ProductInventory.findOne({
            where: {
              productId: item.productId,
              locationId: sale.locationId
            },
            transaction: t
          });

          if (inventory) {
            // Restore stock
            const currentQuantity = Number(inventory.quantity);
            const newQuantity = inventory.quantity + item.quantity;
            const newAvailableQuantity = newQuantity - inventory.reservedQuantity;

            await ProductInventory.update({
              quantity: newQuantity,
              availableQuantity: newAvailableQuantity,
            }, {
              where: {
                productId: item.productId,
                locationId: sale.locationId
              },
              transaction: t
            });

            // Create stock movement record
            await ProductStockMovement.create({
              productId: item.productId,
              locationId: sale.locationId,
              movementType: 'ADJUSTMENT_IN',
              quantity: item.quantity,
              quantityBefore: currentQuantity,
              quantityAfter: newQuantity,
              referenceId: sale.id,
              referenceType: 'SALE',
              createdBy: userId,
              notes: `Stock restored - Sale cancelled: ${sale.saleNumber} - Reason: ${reason}`
            }, { transaction: t });
          }
        }
      });

      // Send cancellation notifications (Customer + Admin + Manager)
      try {
        await this.notificationOrchestrator.createSaleCancellationNotifications(
          sale.id,
          sale.customerId || null,
          sale.locationId,
          {
            customerName: sale.customer?.name || 'Valued Customer',
            saleNumber: sale.saleNumber,
            totalAmount: sale.totalAmount.toFixed(2),
            refundAmount: sale.paidAmount.toFixed(2),
            locationName: location?.name || 'Our Store',
            changedBy: user?.name || 'Staff',
            companyName: 'LTS Phone Shop',
            contactPhone: location?.phone || '',
          }
        );
        console.log(`Sale cancellation notifications sent for sale ${sale.saleNumber}`);
      } catch (notificationError) {
        console.error('Error sending sale cancellation notifications:', notificationError);
      }

      return { message: 'Sale cancelled successfully' };
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('Error cancelling sale:', error);
      throw new AppError(500, 'Failed to cancel sale');
    }
  }

  /**
   * Get sale receipt/invoice data
   */
  async getSaleReceipt(id: string) {
    const sale = await this.getSaleById(id);

    return {
      ...sale,
      company: {
        name: 'Your Company Name',
        address: 'Company Address',
        phone: 'Company Phone',
        email: 'Company Email'
      }
    };
  }

  /**
   * Download invoice as PDF
   */
  async downloadInvoice(saleId: string): Promise<Buffer> {
    const sale = await Sale.findByPk(saleId, {
      include: [
        { model: Customer, as: 'customer' },
        {
          model: Location,
          as: 'location',
          attributes: ['id', 'name', 'location_code', 'address', 'phone', 'email']
        },
        {
          model: User,
          as: 'soldBy',
          attributes: ['id', 'name', 'email']
        },
        {
          model: SaleItem,
          as: 'saleItems',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'name', 'sku'],
              include: [
                {
                  association: 'category',
                  attributes: ['id', 'name']
                }
              ]
            }
          ]
        },
        {
          model: SalePayment,
          as: 'salePayments',
          include: [
            {
              model: User,
              as: 'receivedBy',
              attributes: ['id', 'name', 'email']
            }
          ]
        },
        {
          model: SaleRefund,
          as: 'saleRefunds'
        }
      ]
    });

    if (!sale) {
      throw new AppError(404, 'Sale not found');
    }

    return this.generateInvoicePDF(sale.toJSON());
  }

  /**
   * Print invoice (returns PDF buffer for printing)
   */
  async printInvoice(saleId: string): Promise<Buffer> {
    const sale = await Sale.findByPk(saleId, {
      include: [
        { model: Customer, as: 'customer' },
        {
          model: Location,
          as: 'location',
          attributes: ['id', 'name', 'location_code', 'address', 'phone', 'email']
        },
        {
          model: User,
          as: 'soldBy',
          attributes: ['id', 'name', 'email']
        },
        {
          model: SaleItem,
          as: 'saleItems',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'name', 'sku'],
              include: [
                {
                  association: 'category',
                  attributes: ['id', 'name']
                }
              ]
            }
          ]
        },
        {
          model: SalePayment,
          as: 'salePayments',
          include: [
            {
              model: User,
              as: 'receivedBy',
              attributes: ['id', 'name', 'email']
            }
          ]
        },
        {
          model: SaleRefund,
          as: 'saleRefunds'
        }
      ]
    });

    if (!sale) {
      throw new AppError(404, 'Sale not found');
    }

    return this.generateInvoicePDF(sale.toJSON());
  }

  /**
   * Generate professional invoice PDF
   */
  private async generateInvoicePDF(sale: any): Promise<Buffer> {
    return new Promise(async (resolve, reject) => {
      try {
        const business = await Business.findOne();
        const businessData = business ? business.toJSON() : null;

        const doc = new PDFDocument({
          margin: 30,
          size: 'A4',
          layout: 'portrait'
        });

        const chunks: Buffer[] = [];
        doc.on('data', (chunk: any) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        const pageWidth = doc.page.width;
        const pageHeight = doc.page.height;
        const bottomMargin = 75;
        const CLOUDINARY_BASE_URL = process.env.CLOUDINARY_BASE_URL || 'https://res.cloudinary.com';

        // ===== HEADER WITH COMPANY INFO =====
        doc.rect(0, 0, pageWidth, 120).fill('#1e40af');

        // Logo on the RIGHT side
        if (businessData?.logo) {
          try {
            const logoUrl = `${CLOUDINARY_BASE_URL}${businessData.logo}`;
            const res = await axios.get(logoUrl, { responseType: 'arraybuffer' });
            doc.image(Buffer.from(res.data), pageWidth - 120, 25, { width: 90, height: 70 });
          } catch (err) {
            console.error('Error loading logo:', err);
          }
        }

        // Left side text - company information
        doc.fillColor('white');

        doc.fontSize(24)
          .font('Helvetica-Bold')
          .text('INVOICE', 35, 20);

        doc.fontSize(16)
          .font('Helvetica-Bold')
          .text(businessData?.name || 'Lanka Tech Solutions', 35, 48);

        let contactY = 72;
        doc.fontSize(10).font('Helvetica');

        const address = (businessData?.address || 'No.43, High Level Road, Kirullapone, Colombo 06.')
          .trim()
          .replace(/\s+/g, ' ');

        const phone = businessData?.telephone?.trim() || '0769781811';
        const email = businessData?.email?.trim() || 'info@lankatechsolutions.lk';

        // Address
        doc.text(address, 35, contactY, {
          width: pageWidth - 200,
          lineBreak: true
        });
        contactY += doc.heightOfString(address, { width: pageWidth - 200 }) + 8;

        // Telephone
        doc.text(phone, 35, contactY, { width: pageWidth - 200 });
        contactY += 18;

        // Email
        doc.text(email, 35, contactY, { width: pageWidth - 200 });

        // Start main content
        let y = 135;

        // ===== INVOICE NUMBER AND DATE =====
        doc.rect(30, y, pageWidth - 60, 32)
          .fill('#f0f9ff')
          .stroke('#1e40af');

        doc.fillColor('#1e40af')
          .fontSize(15)
          .font('Helvetica-Bold')
          .text(`Invoice Number: ${sale.saleNumber}`, 0, y + 10, { align: 'center', width: pageWidth });

        y += 48;

        // ===== CUSTOMER INFO + INVOICE DETAILS =====
        const colWidth = (pageWidth - 80) / 2;

        // Customer Information
        doc.rect(30, y, colWidth, 90).fill('#f8fafc').stroke('#94a3b8');
        doc.fillColor('#1e40af').fontSize(10.5).font('Helvetica-Bold').text('BILL TO', 36, y + 12);
        doc.fillColor('#333').fontSize(9).font('Helvetica')
          .text(`Customer: ${sale.customer?.name || sale.customerName || 'Walk-in Customer'}`, 36, y + 28)
          .text(`Phone: ${sale.customer?.phone || sale.customerPhone || 'N/A'}`, 36, y + 42)
          .text(`Email: ${sale.customer?.email || sale.customerEmail || 'N/A'}`, 36, y + 56)
          .text(`Address: ${sale.customer?.address || 'N/A'}`, 36, y + 70);

        // Invoice Details
        doc.rect(40 + colWidth, y, colWidth, 90).fill('#ffffff').stroke('#94a3b8');
        doc.fillColor('#1e40af').fontSize(10.5).font('Helvetica-Bold').text('INVOICE DETAILS', 46 + colWidth, y + 12);
        doc.fillColor('#333').fontSize(9).font('Helvetica')
          .text(`Invoice Date: ${new Date(sale.createdAt).toLocaleDateString()}`, 46 + colWidth, y + 28)
          .text(`Payment Status: ${sale.paymentStatus}`, 46 + colWidth, y + 42)
          .text(`Sale Type: ${sale.saleType}`, 46 + colWidth, y + 56)
          .text(`Location: ${sale.location?.name || 'N/A'}`, 46 + colWidth, y + 70);

        y += 108;

        // ===== ITEMS TABLE =====
        doc.fillColor('#1e40af').fontSize(11).font('Helvetica-Bold').text('ITEMS', 30, y);
        y += 18;

        // Table header
        doc.rect(30, y, pageWidth - 60, 25).fill('#1e40af');
        doc.fillColor('white').fontSize(9).font('Helvetica-Bold')
          .text('#', 35, y + 8, { width: 25 })
          .text('Item', 65, y + 8, { width: 200 })
          .text('Qty', 270, y + 8, { width: 40, align: 'center' })
          .text('Unit Price', 315, y + 8, { width: 70, align: 'right' })
          .text('Discount', 390, y + 8, { width: 60, align: 'right' })
          .text('Subtotal', 455, y + 8, { width: 70, align: 'right' });

        y += 25;

        // Table rows
        doc.fillColor('#333').fontSize(9).font('Helvetica');
        let index = 1;

        for (const item of sale.saleItems || []) {
          const rowHeight = 22;

          // Alternate row colors
          if (index % 2 === 0) {
            doc.rect(30, y, pageWidth - 60, rowHeight).fill('#f9fafb').stroke();
          }

          doc.fillColor('#333')
            .text(index.toString(), 35, y + 6, { width: 25 })
            .text(item.productName || item.product?.name || 'N/A', 65, y + 6, { width: 200 })
            .text(item.quantity.toString(), 270, y + 6, { width: 40, align: 'center' })
            .text(`Rs. ${Number(item.unitPrice).toFixed(2)}`, 315, y + 6, { width: 70, align: 'right' })
            .text(`Rs. ${Number(item.discountAmount || 0).toFixed(2)}`, 390, y + 6, { width: 60, align: 'right' })
            .text(`Rs. ${Number(item.subtotal).toFixed(2)}`, 455, y + 6, { width: 70, align: 'right' });

          y += rowHeight;
          index++;
        }

        y += 20;

        // ===== PAYMENT SUMMARY =====
        const summaryX = pageWidth - 250;
        const summaryWidth = 220;

        doc.fillColor('#333').fontSize(10).font('Helvetica')
          .text('Subtotal:', summaryX, y, { width: summaryWidth - 100, align: 'left' })
          .text(`Rs. ${Number(sale.subtotal || 0).toFixed(2)}`, summaryX + 120, y, { width: 100, align: 'right' });

        y += 18;

        doc.text('Tax:', summaryX, y, { width: summaryWidth - 100, align: 'left' })
          .text(`Rs. ${Number(sale.tax || 0).toFixed(2)}`, summaryX + 120, y, { width: 100, align: 'right' });

        y += 18;

        doc.text('Discount:', summaryX, y, { width: summaryWidth - 100, align: 'left' })
          .text(`Rs. ${Number(sale.discount || sale.discountAmount || 0).toFixed(2)}`, summaryX + 120, y, { width: 100, align: 'right' });

        y += 20;

        // Total line
        doc.moveTo(summaryX, y).lineTo(pageWidth - 30, y).stroke('#1e40af');
        y += 8;

        doc.fontSize(12).font('Helvetica-Bold').fillColor('#1e40af')
          .text('Total Amount:', summaryX, y, { width: summaryWidth - 100, align: 'left' })
          .text(`Rs. ${Number(sale.totalAmount).toFixed(2)}`, summaryX + 120, y, { width: 100, align: 'right' });

        y += 18;

        doc.fontSize(10).font('Helvetica').fillColor('#059669')
          .text('Cash Received:', summaryX, y, { width: summaryWidth - 100, align: 'left' })
          .text(`Rs. ${Number(sale.paidAmount).toFixed(2)}`, summaryX + 120, y, { width: 100, align: 'right' });

        y += 18;

        // Balance amount represents change (if positive) or debt (if negative)
        const balance = Number(sale.balanceAmount);

        if (balance > 0) {
          // Overpaid - show change
          doc.fillColor('#059669')
            .text('Change:', summaryX, y, { width: summaryWidth - 100, align: 'left' })
            .text(`Rs. ${balance.toFixed(2)}`, summaryX + 120, y, { width: 100, align: 'right' });

          y += 18;
        } else if (balance < 0) {
          // Underpaid - show balance due
          doc.fillColor('#d97706')
            .text('Balance Due:', summaryX, y, { width: summaryWidth - 100, align: 'left' })
            .text(`Rs. ${Math.abs(balance).toFixed(2)}`, summaryX + 120, y, { width: 100, align: 'right' });

          y += 18;
        }

        y += 30;

        // ===== PAYMENT DETAILS =====
        if (sale.salePayments && sale.salePayments.length > 0) {
          doc.fillColor('#1e40af').fontSize(11).font('Helvetica-Bold').text('PAYMENT DETAILS', 30, y);
          y += 18;

          doc.fillColor('#333').fontSize(9).font('Helvetica');

          for (const payment of sale.salePayments) {
            doc.text(
              `${payment.paymentMethod} - Rs. ${Number(payment.amount).toFixed(2)} on ${new Date(payment.paymentDate).toLocaleDateString()}${payment.referenceNumber ? ` (Ref: ${payment.referenceNumber})` : ''}`,
              40,
              y
            );
            y += 16;
          }

          y += 12;
        }

        // ===== NOTES =====
        if (sale.notes) {
          doc.fillColor('#1e40af').fontSize(11).font('Helvetica-Bold').text('NOTES', 30, y);
          y += 18;

          doc.fillColor('#333').fontSize(9).font('Helvetica')
            .text(sale.notes, 40, y, { width: pageWidth - 80 });
        }

        // ===== FOOTER AT BOTTOM =====
        const footerY = pageHeight - bottomMargin;

        doc.moveTo(30, footerY).lineTo(pageWidth - 30, footerY).strokeColor('#1e40af').lineWidth(0.7).stroke();

        const generatedDate = new Date().toLocaleString();
        doc.fontSize(7).fillColor('#666666').font('Helvetica')
          .text(`Generated on ${generatedDate} | ${businessData?.name || 'Lanka Tech Solutions'}`, 30, footerY + 12, {
            align: 'center',
            width: pageWidth - 60
          });

        doc.fontSize(9.5).fillColor('#1e40af').font('Helvetica-Bold')
          .text('Solutions by Divenzainc.com', 30, footerY + 28, {
            align: 'center',
            width: pageWidth - 60
          });

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}

export default new SalesPOSService();

