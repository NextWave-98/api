import { Payment, JobSheet, Customer, User, Staff, Device } from '../../models';
import { Op } from 'sequelize';
import  sequelize  from '../../shared/config/database';
import { AppError } from '../../shared/utils/app-error';
import { CreatePaymentDTO, UpdatePaymentDTO, PaymentQueryDTO } from './payment.dto';
import { NotificationOrchestrator } from '../notification/notification-orchestrator.service';

export class PaymentService {
  private notificationOrchestrator = new NotificationOrchestrator();
  private async generatePaymentNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `PAY-${year}-`;

    const lastPayment = await Payment.findOne({
      where: {
        payment_number: { [Op.startsWith]: prefix },
      },
      order: [['paymentNumber', 'DESC']],
      attributes: ['paymentNumber'],
    });

    if (!lastPayment) {
      return `${prefix}0001`;
    }

    const lastNumber = parseInt(lastPayment.paymentNumber.split('-')[2], 10);
    const nextNumber = lastNumber + 1;
    return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
  }

  async createPayment(data: CreatePaymentDTO, receivedById: string) {
    const jobSheet = await JobSheet.findByPk(data.jobSheetId);

    if (!jobSheet) {
      throw new AppError(404, 'Job sheet not found');
    }

    if (jobSheet.customerId !== data.customerId) {
      throw new AppError(400, 'Customer does not match job sheet');
    }

    const paymentNumber = await this.generatePaymentNumber();

    const payment = await sequelize.transaction(async (t) => {
      const newPayment = await Payment.create({
        paymentNumber,
        jobSheetId: data.jobSheetId,
        customerId: data.customerId,
        receivedBy: receivedById,
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        paymentDate: data.paymentDate ? new Date(data.paymentDate) : new Date(),
        referenceNumber: data.reference,
        notes: data.notes,
      }, { transaction: t });

      const newPaidAmount = parseFloat(jobSheet.paidAmount as any) + data.amount;
      const newBalanceAmount = parseFloat(jobSheet.totalAmount as any) - newPaidAmount;

      await JobSheet.update({
        paidAmount: newPaidAmount,
        balanceAmount: newBalanceAmount,
      }, {
        where: { id: data.jobSheetId },
        transaction: t
      });

      return newPayment;
    });

    // Reload with relations
    const paymentWithRelations = await Payment.findByPk(payment.id, {
      include: [
        {
          model: JobSheet,
          as: 'jobSheet',
          attributes: ['id', 'jobNumber', 'totalAmount', 'balanceAmount'],
        },
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'customer_id', 'name', 'phone'],
        },
        {
          model: User,
          as: 'receivedByUser',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });

    if (!paymentWithRelations) {
      throw new AppError(404, 'Payment not found after creation');
    }

    // Send payment received notifications (Customer + Admin) - outside transaction
    try {
      await this.notificationOrchestrator.createPaymentReceivedNotifications(
        payment.id,
        data.jobSheetId,
        data.customerId,
        paymentWithRelations.jobSheet?.locationId || '',
        {
          customerName: paymentWithRelations.customer?.name || '',
          jobSheetNumber: paymentWithRelations.jobSheet?.jobNumber || '',
          paidAmount: data.amount.toFixed(2),
          balanceAmount: (parseFloat(paymentWithRelations.jobSheet?.balanceAmount as any) || 0).toFixed(2),
          paymentMethod: data.paymentMethod,
          companyName: 'LTS Phone Shop',
        }
      );
    } catch (notificationError) {
      console.error('Error sending payment received notifications:', notificationError);
    }

    return paymentWithRelations;
  }

  async getPayments(query: PaymentQueryDTO) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const offset = (page - 1) * limit;

    const where: any = {};

    if (query.jobSheetId) {
      where.jobSheetId = query.jobSheetId;
    }

    if (query.customerId) {
      where.customerId = query.customerId;
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

    const { count: total, rows: payments } = await Payment.findAndCountAll({
      where,
      offset,
      limit,
      order: [['payment_date', 'DESC']],
      include: [
        {
          model: JobSheet,
          as: 'jobSheet',
          attributes: ['id', 'job_number', 'total_amount'],
        },
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'customer_id', 'name', 'phone'],
        },
        {
          model: User,
          as: 'receivedByUser',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });

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

  async getPaymentById(id: string) {
    const payment = await Payment.findByPk(id, {
      include: [
        {
          model: JobSheet,
          as: 'jobSheet',
          include: [
            {
              model: Device,
              as: 'device',
            },
          ],
        },
        {
          model: Customer,
          as: 'customer',
        },
        {
          model: User,
          as: 'receivedByUser',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });

    if (!payment) {
      throw new AppError(404, 'Payment not found');
    }

    return payment;
  }

  async getPaymentByPaymentNumber(paymentNumber: string) {
    const payment = await Payment.findOne({
      where: { paymentNumber },
      include: [
        {
          model: JobSheet,
          as: 'jobSheet',
        },
        {
          model: Customer,
          as: 'customer',
        },
        {
          model: User,
          as: 'receivedByUser',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });

    if (!payment) {
      throw new AppError(404, 'Payment not found');
    }

    return payment;
  }

  async updatePayment(id: string, data: UpdatePaymentDTO) {
    const existingPayment = await Payment.findByPk(id, {
      include: [{ model: JobSheet, as: 'jobSheet' }],
    });

    if (!existingPayment) {
      throw new AppError(404, 'Payment not found');
    }

    const updateData: any = { ...data };
    if (data.paymentDate) {
      updateData.paymentDate = new Date(data.paymentDate);
    }

    if (data.amount && data.amount !== parseFloat(existingPayment.amount as any)) {
      await sequelize.transaction(async (t) => {
        const amountDifference = data.amount! - parseFloat(existingPayment.amount as any);
        const jobSheet = (existingPayment as any).jobSheet;
        const newPaidAmount = parseFloat(jobSheet.paidAmount) + amountDifference;
        const newBalanceAmount = parseFloat(jobSheet.totalAmount) - newPaidAmount;

        await JobSheet.update({
          paidAmount: newPaidAmount,
          balanceAmount: newBalanceAmount,
        }, {
          where: { id: existingPayment.jobSheetId },
          transaction: t
        });

        await Payment.update(updateData, {
          where: { id },
          transaction: t
        });
      });
    } else {
      await Payment.update(updateData, { where: { id } });
    }

    const payment = await Payment.findByPk(id, {
      include: [
        {
          model: JobSheet,
          as: 'jobSheet',
          attributes: ['id', 'job_number'],
        },
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'customer_id', 'name'],
        },
      ],
    });

    return payment;
  }

  async deletePayment(id: string) {
    const payment = await Payment.findByPk(id, {
      include: [{ model: JobSheet, as: 'jobSheet' }],
    });

    if (!payment) {
      throw new AppError(404, 'Payment not found');
    }

    await sequelize.transaction(async (t) => {
      const jobSheet = (payment as any).jobSheet;
      const newPaidAmount = parseFloat(jobSheet.paidAmount) - parseFloat(payment.amount as any);
      const newBalanceAmount = parseFloat(jobSheet.totalAmount) - newPaidAmount;

      await JobSheet.update({
        paidAmount: newPaidAmount,
        balanceAmount: newBalanceAmount,
      }, {
        where: { id: payment.jobSheetId },
        transaction: t
      });

      await Payment.destroy({
        where: { id },
        transaction: t
      });
    });

    return { message: 'Payment deleted successfully' };
  }

  async getPaymentStats(fromDate?: string, toDate?: string) {
    const where: any = {};

    if (fromDate || toDate) {
      where.paymentDate = {};
      if (fromDate) where.paymentDate[Op.gte] = new Date(fromDate);
      if (toDate) where.paymentDate[Op.lte] = new Date(toDate);
    }

    const [total, byMethod, totalAmount] = await Promise.all([
      Payment.count({ where }),
      Payment.findAll({
        where,
        attributes: [
          'payment_method',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
          [sequelize.fn('SUM', sequelize.col('amount')), 'total'],
        ],
        group: ['payment_method'],
        raw: true,
      }),
      Payment.findOne({
        where,
        attributes: [[sequelize.fn('SUM', sequelize.col('amount')), 'total']],
        raw: true,
      }),
    ]);

    const methodStats = (byMethod as any[]).reduce((acc: any, item) => {
      acc[item.paymentMethod] = {
        count: parseInt(item.count, 10),
        total: parseFloat(item.total) || 0,
      };
      return acc;
    }, {});

    return {
      total,
      totalAmount: (totalAmount as any)?.total || 0,
      byMethod: methodStats,
    };
  }
}

