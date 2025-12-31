import { AppError } from '../../shared/utils/app-error';
import { CreateSupplierPaymentDTO, UpdateSupplierPaymentDTO, SupplierPaymentQueryDTO } from './supplierpayment.dto';
import {
  SupplierPayment,
  PurchaseOrder,
  Supplier,
  PurchaseOrderItem,
  Product,
} from '../../models';
import { Op, fn, col } from 'sequelize';
import sequelize from '../../shared/config/database';

export class SupplierPaymentService {
  private async generatePaymentNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `SPY-${year}-`;

    const lastPayment = await SupplierPayment.findOne({
      where: {
        paymentNumber: { [Op.like]: `${prefix}%` },
      },
      order: [['paymentNumber', 'DESC']],
      attributes: ['paymentNumber'],
    });

    if (!lastPayment || !lastPayment.paymentNumber) {
      return `${prefix}0001`;
    }

    const lastNumber = parseInt(lastPayment.paymentNumber.split('-')[2], 10);
    const nextNumber = lastNumber + 1;
    return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
  }

  async createSupplierPayment(data: CreateSupplierPaymentDTO, userId?: string) {
    if (!userId) {
      throw new AppError(401, 'User authentication required');
    }

    // Verify purchase order exists and belongs to the supplier
    const purchaseOrder = await PurchaseOrder.findByPk(data.purchaseOrderId);

    if (!purchaseOrder) {
      throw new AppError(404, 'Purchase order not found');
    }

    const poData = purchaseOrder.toJSON();
    if (poData.supplierId !== data.supplierId) {
      throw new AppError(400, 'Supplier does not match purchase order');
    }

    // Check if purchase order is in a valid state for payment
    if (!['APPROVED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'COMPLETED'].includes(poData.status)) {
      throw new AppError(400, 'Purchase order must be approved or received to accept payments');
    }

    // Prevent overpayment
    const currentPaidAmount = Number(poData.paidAmount) || 0;
    const totalAmount = Number(poData.totalAmount) || 0;
    const remainingBalance = totalAmount - currentPaidAmount;

    if (data.amount > remainingBalance) {
      throw new AppError(400, `Payment amount (${data.amount.toFixed(2)}) exceeds remaining balance (${remainingBalance.toFixed(2)}). Cannot process overpayment.`);
    }

    const paymentNumber = await this.generatePaymentNumber();

    const payment = await SupplierPayment.create({
      paymentNumber,
      purchaseOrderId: data.purchaseOrderId,
      supplierId: data.supplierId,
      amount: data.amount,
      paymentMethod: data.paymentMethod,
      paymentDate: data.paymentDate ? new Date(data.paymentDate) : new Date(),
      reference: data.reference || null,
      notes: data.notes || null,
      createdBy: userId,
    });

    await payment.reload({
      include: [
        {
          model: PurchaseOrder,
          as: 'purchaseOrder',
          attributes: ['id', 'po_number', 'total_amount', 'paid_amount', 'balance_amount']
        },
        {
          model: Supplier,
          as: 'supplier',
          attributes: ['id', 'supplier_code', 'name', 'contact_person_name', 'phone']
        }
      ]
    });

    // Update purchase order payment amounts and status
    const newPaidAmount = currentPaidAmount + data.amount;
    const poTotalAmount = totalAmount;
    const newBalanceAmount = poTotalAmount - newPaidAmount;

    // Determine payment status
    let paymentStatus: 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'OVERPAID';
    let poStatus = poData.status;

    if (newPaidAmount <= 0) {
      paymentStatus = 'UNPAID';
    } else if (newPaidAmount >= poTotalAmount) {
      paymentStatus = newPaidAmount > poTotalAmount ? 'OVERPAID' : 'PAID';
      // If fully paid and already received, mark as COMPLETED
      if (poData.status === 'RECEIVED') {
        poStatus = 'COMPLETED';
      }
    } else {
      paymentStatus = 'PARTIALLY_PAID';
    }

    await PurchaseOrder.update({
      paidAmount: newPaidAmount,
      balanceAmount: newBalanceAmount,
      paymentStatus,
      status: poStatus,
    }, {
      where: { id: data.purchaseOrderId }
    });

    return payment.toJSON();
  }

  async getSupplierPayments(query: SupplierPaymentQueryDTO) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.purchaseOrderId) {
      where.purchaseOrderId = query.purchaseOrderId;
    }

    if (query.supplierId) {
      where.supplierId = query.supplierId;
    }

    if (query.paymentMethod) {
      where.paymentMethod = query.paymentMethod;
    }

    if (query.fromDate || query.toDate) {
      where.paymentDate = {};
      if (query.fromDate) {
        where.paymentDate[Op.gte] = new Date(query.fromDate);
      }
      if (query.toDate) {
        where.paymentDate[Op.lte] = new Date(query.toDate);
      }
    }

    const [payments, total] = await Promise.all([
      SupplierPayment.findAll({
        where,
        offset: skip,
        limit,
        order: [['paymentDate', 'DESC']],
        include: [
          {
            model: PurchaseOrder,
            as: 'purchaseOrder',
            attributes: ['id', 'po_number', 'total_amount', 'paid_amount', 'balance_amount']
          },
          {
            model: Supplier,
            as: 'supplier',
            attributes: ['id', 'supplier_code', 'name', 'contact_person_name', 'phone']
          }
        ]
      }),
      SupplierPayment.count({ where }),
    ]);

    return {
      payments: payments.map(p => p.toJSON()),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getSupplierPaymentById(id: string) {
    const payment = await SupplierPayment.findByPk(id, {
      include: [
        {
          model: PurchaseOrder,
          as: 'purchaseOrder',
          include: [
            {
              model: PurchaseOrderItem,
              as: 'items',
              include: [
                {
                  model: Product,
                  as: 'product'
                }
              ]
            }
          ]
        },
        {
          model: Supplier,
          as: 'supplier'
        }
      ]
    });

    if (!payment) {
      throw new AppError(404, 'Supplier payment not found');
    }

    return payment.toJSON();
  }

  async getSupplierPaymentByPaymentNumber(paymentNumber: string) {
    const payment = await SupplierPayment.findOne({
      where: { paymentNumber },
      include: [
        {
          model: PurchaseOrder,
          as: 'purchaseOrder'
        },
        {
          model: Supplier,
          as: 'supplier'
        }
      ]
    });

    if (!payment) {
      throw new AppError(404, 'Supplier payment not found');
    }

    return payment.toJSON();
  }

  async updateSupplierPayment(id: string, data: UpdateSupplierPaymentDTO) {
    const existingPayment = await SupplierPayment.findByPk(id, {
      include: [
        {
          model: PurchaseOrder,
          as: 'purchaseOrder'
        }
      ]
    });

    if (!existingPayment) {
      throw new AppError(404, 'Supplier payment not found');
    }

    const existingData = existingPayment.toJSON();
    const existingAmount = Number(existingData.amount) || 0;

    // If amount is being changed, recalculate PO balances and payment status
    if (data.amount !== undefined && data.amount !== existingAmount && existingData.purchaseOrder) {
      const amountDifference = data.amount - existingAmount;
      const poData = existingData.purchaseOrder as any;
      const newPaidAmount = (Number(poData.paidAmount) || 0) + amountDifference;
      const poTotalAmount = Number(poData.totalAmount) || 0;
      const newBalanceAmount = poTotalAmount - newPaidAmount;

      // Prevent overpayment
      if (newPaidAmount > poTotalAmount) {
        throw new AppError(400, `Updated payment amount would result in overpayment. Total: ${poTotalAmount.toFixed(2)}, New paid amount: ${newPaidAmount.toFixed(2)}`);
      }

      // Determine payment status
      let paymentStatus: 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'OVERPAID';
      let poStatus = poData.status;

      if (newPaidAmount <= 0) {
        paymentStatus = 'UNPAID';
      } else if (newPaidAmount >= poTotalAmount) {
        paymentStatus = newPaidAmount > poTotalAmount ? 'OVERPAID' : 'PAID';
        // If fully paid and already received, mark as COMPLETED
        if (poData.status === 'RECEIVED') {
          poStatus = 'COMPLETED';
        }
      } else {
        paymentStatus = 'PARTIALLY_PAID';
      }

      await PurchaseOrder.update({
        paidAmount: newPaidAmount,
        balanceAmount: newBalanceAmount,
        paymentStatus,
        status: poStatus,
      }, {
        where: { id: poData.id }
      });
    }

    const updateData: any = {};
    if (data.amount !== undefined) updateData.amount = data.amount;
    if (data.paymentMethod !== undefined) updateData.paymentMethod = data.paymentMethod;
    if (data.paymentDate !== undefined) updateData.paymentDate = data.paymentDate ? new Date(data.paymentDate) : undefined;
    if (data.reference !== undefined) updateData.reference = data.reference;
    if (data.notes !== undefined) updateData.notes = data.notes;

    await SupplierPayment.update(updateData, {
      where: { id }
    });

    const payment = await SupplierPayment.findByPk(id, {
      include: [
        {
          model: PurchaseOrder,
          as: 'purchaseOrder',
          attributes: ['id', 'po_number', 'total_amount', 'paid_amount', 'balance_amount']
        },
        {
          model: Supplier,
          as: 'supplier',
          attributes: ['id', 'supplier_code', 'name', 'contact_person_name']
        }
      ]
    });

    return payment?.toJSON();
  }

  async deleteSupplierPayment(id: string) {
    const payment = await SupplierPayment.findByPk(id, {
      include: [
        {
          model: PurchaseOrder,
          as: 'purchaseOrder'
        }
      ]
    });

    if (!payment) {
      throw new AppError(404, 'Supplier payment not found');
    }

    const paymentData = payment.toJSON();
    if (!paymentData.purchaseOrder) {
      throw new AppError(400, 'Purchase order not found for this payment');
    }

    // Revert the purchase order payment amounts and status
    const poData = paymentData.purchaseOrder as any;
    const newPaidAmount = (Number(poData.paidAmount) || 0) - (Number(paymentData.amount) || 0);
    const poTotalAmount = Number(poData.totalAmount) || 0;
    const newBalanceAmount = poTotalAmount - newPaidAmount;

    // Determine payment status after deletion
    let paymentStatus: 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'OVERPAID';

    if (newPaidAmount <= 0) {
      paymentStatus = 'UNPAID';
    } else if (newPaidAmount >= poTotalAmount) {
      paymentStatus = newPaidAmount > poTotalAmount ? 'OVERPAID' : 'PAID';
    } else {
      paymentStatus = 'PARTIALLY_PAID';
    }

    await sequelize.transaction(async (t) => {
      await SupplierPayment.destroy({
        where: { id },
        transaction: t
      });

      await PurchaseOrder.update({
        paidAmount: newPaidAmount,
        balanceAmount: newBalanceAmount,
        paymentStatus,
      }, {
        where: { id: poData.id },
        transaction: t
      });
    });

    return { message: 'Supplier payment deleted successfully' };
  }

  async getSupplierPaymentStats(fromDate?: string, toDate?: string) {
    const where: any = {};

    if (fromDate || toDate) {
      where.paymentDate = {};
      if (fromDate) {
        where.paymentDate[Op.gte] = new Date(fromDate);
      }
      if (toDate) {
        where.paymentDate[Op.lte] = new Date(toDate);
      }
    }

    const [totalPayments, paymentsByMethod, recentPayments] = await Promise.all([
      SupplierPayment.findAll({
        where,
        attributes: [
          [fn('SUM', col('amount')), 'total_amount'],
          [fn('COUNT', col('id')), 'count']
        ],
        raw: true
      }),
      SupplierPayment.findAll({
        where,
        attributes: [
          'payment_method',
          [fn('SUM', col('amount')), 'total_amount'],
          [fn('COUNT', col('id')), 'count']
        ],
        group: ['payment_method'],
        raw: true
      }),
      SupplierPayment.findAll({
        where,
        limit: 10,
        order: [['payment_date', 'DESC']],
        include: [
          {
            model: Supplier,
            as: 'supplier',
            attributes: ['id', 'supplier_code', 'name']
          },
          {
            model: PurchaseOrder,
            as: 'purchaseOrder',
            attributes: ['id', 'po_number']
          }
        ]
      }),
    ]);

    const totalData = totalPayments[0] as any;
    return {
      totalAmount: totalData ? Number(totalData.totalAmount) || 0 : 0,
      totalPayments: totalData ? parseInt(totalData.count as string) : 0,
      paymentsByMethod: (paymentsByMethod as any[]).map((item: any) => ({
        paymentMethod: item.paymentMethod,
        totalAmount: Number(item.totalAmount) || 0,
        count: parseInt(item.count as string)
      })),
      recentPayments: recentPayments.map(p => p.toJSON()),
    };
  }
}

