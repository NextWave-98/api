import { Request, Response } from 'express';
import { ApiResponse } from '../../shared/utils/api-response';
import { asyncHandler } from '../../shared/utils/async-handler';
import sequelize from '../../shared/config/database';
import { Payment } from '../../models/payment.model';
import { SupplierPayment } from '../../models/supplier-payment.model';
import { SalePayment } from '../../models/sale-payment.model';
import { SaleRefund } from '../../models/sale-refund.model';
import { Sale } from '../../models/sale.model';
import { Customer } from '../../models/customer.model';
import { User } from '../../models/user.model';
import { Supplier } from '../../models/supplier.model';
import { PurchaseOrder } from '../../models/purchase-order.model';
import { JobSheet } from '../../models/jobsheet.model';

/**
 * Get all payments for admin dashboard
 * INCOMING = Customer/Job Sheet Payments (Income/Revenue)
 * OUTGOING = Supplier Payments (Expenses)
 */
export const getAllPayments = asyncHandler(async (req: Request, res: Response) => {
  const { page , limit , paymentType, fromDate, toDate, dateFilter } = req.query;
  
  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  const whereDateFilter: any = {};
  if (dateFilter) {
    // Apply predefined date filters
    const now = new Date();
    
    switch (dateFilter) {
      case 'today':
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        whereDateFilter.gte = today;
        whereDateFilter.lt = new Date(today.getTime() + 24 * 60 * 60 * 1000);
        break;
      case 'yesterday':
        const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        whereDateFilter.gte = yesterday;
        whereDateFilter.lt = new Date(yesterday.getTime() + 24 * 60 * 60 * 1000);
        break;
      case 'this_week':
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay() + 1); // Monday
        startOfWeek.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6); // Sunday
        endOfWeek.setHours(23, 59, 59, 999);
        whereDateFilter.gte = startOfWeek;
        whereDateFilter.lte = endOfWeek;
        break;
      case 'this_year':
        const startOfYear = new Date(now.getFullYear(), 0, 1); // January 1st
        const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999); // December 31st
        whereDateFilter.gte = startOfYear;
        whereDateFilter.lte = endOfYear;
        break;
      case 'custom':
        // For custom, use fromDate and toDate if provided
        if (fromDate) {
          whereDateFilter.gte = new Date(fromDate as string);
        }
        if (toDate) {
          whereDateFilter.lte = new Date(toDate as string);
        }
        break;
    }
  } else {
    // Fallback to direct fromDate/toDate for backward compatibility
    if (fromDate) {
      whereDateFilter.gte = new Date(fromDate as string);
    }
    if (toDate) {
      whereDateFilter.lte = new Date(toDate as string);
    }
  }

  const results: any[] = [];
  let totalCount = 0;

  // Fetch INCOMING payments (Customer/Job Sheet Payments - Revenue)
  if (!paymentType || paymentType === 'INCOMING' || paymentType === 'CUSTOMER') {
    const whereClause = Object.keys(whereDateFilter).length > 0 ? { paymentDate: whereDateFilter } : {};
    const customerPayments = await Payment.findAll({
      where: whereClause,
      limit: (paymentType === 'INCOMING' || paymentType === 'CUSTOMER') ? limitNum : undefined,
      offset: (paymentType === 'INCOMING' || paymentType === 'CUSTOMER') ? skip : undefined,
      order: [['paymentDate', 'DESC']],
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'customerId', 'name', 'phone'],
        },
        {
          model: JobSheet,
          as: 'jobSheet',
          attributes: ['id', 'jobNumber'],
        },
        {
          model: User,
          as: 'receivedByUser',
          attributes: ['id', 'name'],
        },
      ],
    });

    const customerPaymentsWithType = customerPayments.map((payment: any) => ({
      ...payment.toJSON(),
      paymentType: 'INCOMING',
      paymentCategory: 'Customer Payment',
      flow: 'INCOME',
      amount: payment.amount,
    }));

    results.push(...customerPaymentsWithType);

    if (paymentType === 'INCOMING' || paymentType === 'CUSTOMER') {
      const count = await Payment.count({
        where: whereClause,
      });
      totalCount = count;
    }
  }

  //Fetch INCOMING payments (Sale Payments - Revenue)
  if (!paymentType || paymentType === 'INCOMING' || paymentType === 'CUSTOMER') {
    const whereClauseSale = Object.keys(whereDateFilter).length > 0 ? { paymentDate: whereDateFilter } : {};
    const salePayments = await SalePayment.findAll({
      where: whereClauseSale,
      limit: (paymentType === 'INCOMING' || paymentType === 'CUSTOMER') ? limitNum : undefined,
      offset: (paymentType === 'INCOMING' || paymentType === 'CUSTOMER') ? skip : undefined,
      order: [['paymentDate', 'DESC']],
      include: [
        {
          model: Sale,
          as: 'sale',
          attributes: ['id', 'saleNumber'],
          include: [
            {
              model: Customer,
              as: 'customer',
              attributes: ['id', 'customerId', 'name', 'phone'],
            },
          ],
        },
        {
          model: User,
          as: 'receivedBy',
          attributes: ['id', 'name'],
        },
      ],
    });
    const salePaymentsWithType = salePayments.map((payment: any) => ({
      ...payment.toJSON(),
      paymentType: 'INCOMING',
      paymentCategory: 'Sale Payment',
      flow: 'INCOME',
      amount: payment.amount,
    }));
    results.push(...salePaymentsWithType);

    if (paymentType === 'INCOMING' || paymentType === 'CUSTOMER') {
      const count = await SalePayment.count({
        where: whereClauseSale,
      });
      totalCount += count;
    }
  }

  // Fetch OUTGOING payments (Supplier Payments - Expenses)
  if (!paymentType || paymentType === 'OUTGOING' || paymentType === 'SUPPLIER') {
    const whereClauseSupplier = Object.keys(whereDateFilter).length > 0 ? { paymentDate: whereDateFilter } : {};
    const supplierPayments = await SupplierPayment.findAll({
      where: whereClauseSupplier,
      limit: (paymentType === 'OUTGOING' || paymentType === 'SUPPLIER') ? limitNum : undefined,
      offset: (paymentType === 'OUTGOING' || paymentType === 'SUPPLIER') ? skip : undefined,
      order: [['paymentDate', 'DESC']],
      include: [
        {
          model: Supplier,
          as: 'supplier',
          attributes: ['id', 'supplierCode', 'name', 'contactPersonName'],
        },
        {
          model: PurchaseOrder,
          as: 'purchaseOrder',
          attributes: ['id', 'poNumber'],
        },
      ],
    });

    const supplierPaymentsWithType = supplierPayments.map((payment: any) => ({
      ...payment.toJSON(),
      paymentType: 'OUTGOING',
      paymentCategory: 'Supplier Payment',
      flow: 'EXPENSE',
      amount: payment.amount,
    }));

    results.push(...supplierPaymentsWithType);

    if (paymentType === 'OUTGOING' || paymentType === 'SUPPLIER') {
      const count = await SupplierPayment.count({
        where: whereClauseSupplier,
      });
      totalCount = count;
    }
  }

  //Fetch OUTGOING payments (Sale Refunds - Expenses)
  if (!paymentType || paymentType === 'OUTGOING' || paymentType === 'SUPPLIER') {
    const whereClauseRefund = Object.keys(whereDateFilter).length > 0 ? { refundDate: whereDateFilter } : {};
    const saleRefunds = await SaleRefund.findAll({
      where: whereClauseRefund,
      limit: (paymentType === 'OUTGOING' || paymentType === 'SUPPLIER') ? limitNum : undefined,
      offset: (paymentType === 'OUTGOING' || paymentType === 'SUPPLIER') ? skip : undefined,
      order: [['refundDate', 'DESC']],
      include: [
        {
          model: Sale,
          as: 'sale',
          attributes: ['id', 'saleNumber'],
          include: [
            {
              model: Customer,
              as: 'customer',
              attributes: ['id', 'customerId', 'name', 'phone'],
            },
          ],
        },
        {
          model: User,
          as: 'processedBy',
          attributes: ['id', 'name'],
        },
      ],
    });
    const saleRefundsWithType = saleRefunds.map((refund: any) => ({
      ...refund.toJSON(),
      paymentType: 'OUTGOING',
      paymentCategory: 'Sale Refund',
      flow: 'EXPENSE',
      amount: refund.amount,
    }));
    results.push(...saleRefundsWithType);
    if (paymentType === 'OUTGOING' || paymentType === 'SUPPLIER') {
      const count = await SaleRefund.count({
        where: whereClauseRefund,
      });
      totalCount += count;
    }
  }

  // If fetching both types, sort by date and paginate
  if (!paymentType) {
    results.sort((a, b) => new Date(b.paymentDate || b.refundDate || b.createdAt).getTime() - new Date(a.paymentDate || a.refundDate || a.createdAt).getTime());
    totalCount = results.length;
    const paginatedResults = results.slice(skip, skip + limitNum);
    
    // Calculate totals
    const incomingTotal = results
      .filter(p => p.paymentType === 'INCOMING')
      .reduce((sum, p) => sum + p.amount, 0);
    const outgoingTotal = results
      .filter(p => p.paymentType === 'OUTGOING')
      .reduce((sum, p) => sum + p.amount, 0);
    
    return ApiResponse.success(res, {
      payments: paginatedResults,
      summary: {
        incomingTotal,
        outgoingTotal,
        netCashFlow: incomingTotal - outgoingTotal,
      },
      pagination: {
        total: totalCount,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(totalCount / limitNum),
      },
    }, 'All payments retrieved successfully');
  }

  ApiResponse.success(res, {
    payments: results,
    pagination: {
      total: totalCount,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(totalCount / limitNum),
    },
  }, `${paymentType} payments retrieved successfully`);
});

/**
 * Get payment statistics for admin dashboard
 * Separates incoming (customer/job sheet) and outgoing (supplier) payments
 */
export const getPaymentStats = asyncHandler(async (req: Request, res: Response) => {
  const { fromDate, toDate, dateFilter } = req.query;

  const whereDateFilter: any = {};
  if (dateFilter) {
    // Apply predefined date filters
    const now = new Date();
    
    switch (dateFilter) {
      case 'today':
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        whereDateFilter.gte = today;
        whereDateFilter.lt = new Date(today.getTime() + 24 * 60 * 60 * 1000);
        break;
      case 'yesterday':
        const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        whereDateFilter.gte = yesterday;
        whereDateFilter.lt = new Date(yesterday.getTime() + 24 * 60 * 60 * 1000);
        break;
      case 'this_week':
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay() + 1); // Monday
        startOfWeek.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6); // Sunday
        endOfWeek.setHours(23, 59, 59, 999);
        whereDateFilter.gte = startOfWeek;
        whereDateFilter.lte = endOfWeek;
        break;
      case 'this_year':
        const startOfYear = new Date(now.getFullYear(), 0, 1); // January 1st
        const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999); // December 31st
        whereDateFilter.gte = startOfYear;
        whereDateFilter.lte = endOfYear;
        break;
      case 'custom':
        // For custom, use fromDate and toDate if provided
        if (fromDate) {
          whereDateFilter.gte = new Date(fromDate as string);
        }
        if (toDate) {
          whereDateFilter.lte = new Date(toDate as string);
        }
        break;
    }
  } else {
    // Fallback to direct fromDate/toDate for backward compatibility
    if (fromDate) {
      whereDateFilter.gte = new Date(fromDate as string);
    }
    if (toDate) {
      whereDateFilter.lte = new Date(toDate as string);
    }
  }

  const whereClause = Object.keys(whereDateFilter).length > 0 ? { paymentDate: whereDateFilter } : {};
  const refundWhereClause = Object.keys(whereDateFilter).length > 0 ? { refundDate: whereDateFilter } : {};

  // INCOMING PAYMENTS (Customer/Job Sheet Payments - Revenue)
  const incomingAmount = await Payment.sum('amount', { where: whereClause }) || 0;
  const incomingCount = await Payment.count({ where: whereClause });
  const salePaymentAmount = await SalePayment.sum('amount', { where: whereClause }) || 0;
  const salePaymentCount = await SalePayment.count({ where: whereClause });
  

  // OUTGOING PAYMENTS (Supplier Payments - Expenses)
  const outgoingAmount = await SupplierPayment.sum('amount', { where: whereClause }) || 0;
  const outgoingCount = await SupplierPayment.count({ where: whereClause });
  const saleRefundsAmount = await SaleRefund.sum('amount', { where: refundWhereClause }) || 0;
  const saleRefundsCount = await SaleRefund.count({ where: refundWhereClause });

  // Net cash flow = Income - Expenses
  const netCashFlow = (incomingAmount + salePaymentAmount) - (outgoingAmount + saleRefundsAmount);
  
  const totalTransactions = incomingCount + salePaymentCount + outgoingCount + saleRefundsCount;

  // Calculate this month stats
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  const monthWhereClause = { 
    paymentDate: { 
      [require('sequelize').Op.gte]: firstDayOfMonth 
    } 
  };
  const monthRefundWhereClause = { 
    refundDate: { 
      [require('sequelize').Op.gte]: firstDayOfMonth 
    } 
  };

  const thisMonthIncoming = await Payment.sum('amount', { where: monthWhereClause }) + await SalePayment.sum('amount', { where: monthWhereClause }) || 0;
  const thisMonthIncomingCount = await Payment.count({ where: monthWhereClause }) + await SalePayment.count({ where: monthWhereClause });

  const thisMonthOutgoing = await SupplierPayment.sum('amount', { where: monthWhereClause }) + await SaleRefund.sum('amount', { where: monthRefundWhereClause }) || 0;
  const thisMonthOutgoingCount = await SupplierPayment.count({ where: monthWhereClause }) + await SaleRefund.count({ where: monthRefundWhereClause });
  const thisMonthNetCashFlow = thisMonthIncoming - thisMonthOutgoing;
  const thisMonthTransactions = thisMonthIncomingCount + thisMonthOutgoingCount;

  const totalIncome = incomingAmount + salePaymentAmount;
  const totalExpenses = outgoingAmount + saleRefundsAmount;

  ApiResponse.success(res, {
    summary: {
      totalTransactions,
      netCashFlow,
      incomingAmount: totalIncome,
      outgoingAmount: totalExpenses,
    },
    incoming: {
      label: 'Income (Customer Payments)',
      count: incomingCount + salePaymentCount,
      amount: totalIncome,
      description: 'Revenue from job sheet payments',
    },
    outgoing: {
      label: 'Expenses (Supplier Payments)',
      count: outgoingCount + saleRefundsCount,
      amount: outgoingAmount + saleRefundsAmount,
      description: 'Payments made to suppliers',
    },
    thisMonth: {
      transactions: thisMonthTransactions,
      netCashFlow: thisMonthNetCashFlow,
      incoming: thisMonthIncoming,
      outgoing: thisMonthOutgoing,
    },
  }, 'Payment statistics retrieved successfully');
});

