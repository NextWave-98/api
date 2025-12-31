import {
  SalesReportData,
  ProfitLossReportData,
  InventoryReportData,
  StaffPerformanceReportData,
  CustomerAnalysisReportData,
  ShopPerformanceReportData,
  GenerateReportDto,
} from './reports.dto';
import {
  Sale,
  SaleItem,
  SalePayment,
  SaleRefund,
  ProductInventory,
  Product,
  Location,
  User,
  Staff,
  Customer,
  JobSheet,
  SupplierPayment,
  Supplier,
  PurchaseOrder,
  PurchaseOrderItem,
  ProductCategory,
  Payment,
} from '../../models';
import { Op } from 'sequelize';
import { sequelize } from '../../config/database';

export class ReportsService {
  /**
   * Get date range based on period
   */
  private getDateRange(period: string, startDate?: string, endDate?: string): { start: Date; end: Date } {
    const now = new Date();
    let start: Date;
    let end: Date = new Date(now.setHours(23, 59, 59, 999));

    if (period === 'custom' && startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
    } else if (period === 'today') {
      start = new Date(now.setHours(0, 0, 0, 0));
    } else if (period === 'week') {
      start = new Date(now);
      start.setDate(now.getDate() - 7);
      start.setHours(0, 0, 0, 0);
    } else if (period === 'month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      start.setHours(0, 0, 0, 0);
    } else if (period === 'quarter') {
      const currentQuarter = Math.floor(now.getMonth() / 3);
      start = new Date(now.getFullYear(), currentQuarter * 3, 1);
      start.setHours(0, 0, 0, 0);
    } else if (period === 'year') {
      start = new Date(now.getFullYear(), 0, 1);
      start.setHours(0, 0, 0, 0);
    } else {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      start.setHours(0, 0, 0, 0);
    }

    return { start, end };
  }

  /**
   * Generate Sales Report with Full Details
   */
  async generateSalesReport(dto: GenerateReportDto): Promise<SalesReportData> {
    const { start, end } = this.getDateRange(dto.period, dto.startDate, dto.endDate);

    const whereClause: any = {
      createdAt: {
        [Op.gte]: start,
        [Op.lte]: end,
      },
      // status: 'COMPLETED',
    };
    if (dto.locationId) whereClause.locationId = dto.locationId;

    // Get all sales with full details including payments and refunds
    const sales = await Sale.findAll({
      where: whereClause,
      include: [
        {
          model: SaleItem,
          as: 'saleItems',
          include: [
            {
              model: Product,
              as: 'product',
              include: [
                {
                  model: ProductCategory,
                  as: 'category'
                }
              ]
            }
          ]
        },
        {
          model: SalePayment,
          as: 'salePayments'
        },
        {
          model: SaleRefund,
          as: 'saleRefunds',
          include: [
            {
              model: User,
              as: 'processedBy'
            }
          ]
        },
        {
          model: Location,
          as: 'location'
        },
        {
          model: User,
          as: 'soldBy',
          include: [{ model: Staff, as: 'staff' }]
        },
        {
          model: Customer,
          as: 'customer'
        }
      ]
    });

    const salesData = sales.map(s => s.toJSON());
    const totalSales = salesData.length;

    // Calculate revenue with payment details
    const totalRevenue = salesData.reduce((sum, sale) => sum + Number(sale.totalAmount), 0);
    const totalPaid = salesData.reduce((sum, sale) => {
      const payments = (sale.salePayments || []) as any[];
      return sum + payments.reduce((pSum, p) => pSum + Number(p.amount), 0);
    }, 0);
    const totalRefunded = salesData.reduce((sum, sale) => {
      const refunds = (sale.saleRefunds || []) as any[];
      return sum + refunds.reduce((rSum, r) => rSum + Number(r.amount), 0);
    }, 0);
    const netRevenue = totalPaid - totalRefunded;

    // Calculate profit from items (unitPrice - costPrice) * quantity
    const totalProfit = salesData.reduce((sum, sale) => {
      const items = (sale.saleItems || []) as any[];
      const saleProfit = items.reduce((itemSum, item) => {
        const itemProfit = (Number(item.unitPrice) - Number(item.costPrice)) * item.quantity;
        return itemSum + itemProfit;
      }, 0);
      return sum + saleProfit;
    }, 0);

    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
    const averageOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;

    // Top Products with full details
    const productSales = new Map<string, { product: any; quantity: number; revenue: number; profit: number; sales: number }>();
    salesData.forEach((sale) => {
      const items = (sale.saleItems || []) as any[];
      items.forEach((item) => {
        const key = item.productId;
        const existing = productSales.get(key) || {
          product: item.product,
          quantity: 0,
          revenue: 0,
          profit: 0,
          sales: 0,
        };
        existing.quantity += item.quantity;
        existing.revenue += Number(item.subtotal);
        existing.profit += (Number(item.unitPrice) - Number(item.costPrice)) * item.quantity;
        existing.sales += 1;
        productSales.set(key, existing);
      });
    });

    const topProducts = Array.from(productSales.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)
      .map((item) => {
        let profitMargin = 0;
        if (item.revenue && !isNaN(item.profit) && !isNaN(item.revenue) && item.revenue > 0) {
          profitMargin = (item.profit / item.revenue) * 100;
        }
        return {
          productId: item.product.id,
          productName: item.product.name,
          sku: item.product.sku,
          category: item.product.category?.name || 'N/A',
          quantity: item.quantity,
          revenue: item.revenue,
          profit: item.profit,
          profitMargin: (typeof profitMargin === 'number' && !isNaN(profitMargin)) ? profitMargin : '0.00',
          sales: item.sales,
        };
      });

    // Top Locations
    const locationSales = new Map<string, { location: any; sales: number; revenue: number; profit: number }>();
    salesData.forEach((sale) => {
      if (sale.location) {
        const key = sale.locationId;
        const existing = locationSales.get(key) || {
          location: sale.location,
          sales: 0,
          revenue: 0,
          profit: 0,
        };
        const items = (sale.saleItems || []) as any[];
        const saleProfit = items.reduce((sum, item) => {
          return sum + (Number(item.unitPrice) - Number(item.costPrice)) * item.quantity;
        }, 0);
        existing.sales += 1;
        existing.revenue += Number(sale.totalAmount);
        existing.profit += saleProfit;
        locationSales.set(key, existing);
      }
    });

    const topLocations = Array.from(locationSales.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)
      .map((item) => {
        let profitMargin = 0;
        if (item.revenue && !isNaN(item.profit) && !isNaN(item.revenue) && item.revenue > 0) {
          profitMargin = (item.profit / item.revenue) * 100;
        }
        return {
          locationId: item.location.id,
          locationName: item.location.name,
          locationType: item.location.locationType,
          sales: item.sales,
          revenue: item.revenue,
          profit: item.profit,
          profitMargin: (typeof profitMargin === 'number' && !isNaN(profitMargin)) ? profitMargin : '0.00',
        };
      });

    // Sales by Day with full breakdown
    const salesByDay = new Map<string, { sales: number; revenue: number; profit: number; customers: Set<string> }>();
    salesData.forEach((sale) => {
      const dateKey = new Date(sale.createdAt).toISOString().split('T')[0];
      const existing = salesByDay.get(dateKey) || { sales: 0, revenue: 0, profit: 0, customers: new Set<string>() };
      const items = (sale.saleItems || []) as any[];
      const saleProfit = items.reduce((sum, item) => {
        return sum + (Number(item.unitPrice) - Number(item.costPrice)) * item.quantity;
      }, 0);
      existing.sales += 1;
      existing.revenue += Number(sale.totalAmount);
      existing.profit += saleProfit;
      if (sale.customerId) {
        existing.customers.add(sale.customerId);
      }
      salesByDay.set(dateKey, existing);
    });

    const salesByDayArray = Array.from(salesByDay.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, data]) => {
        let averageOrderValue = 0;
        if (data.sales && !isNaN(data.revenue) && data.sales > 0) {
          averageOrderValue = data.revenue / data.sales;
        }
        return {
          date,
          sales: data.sales,
          revenue: data.revenue,
          profit: data.profit,
          averageOrderValue: (typeof averageOrderValue === 'number' && !isNaN(averageOrderValue)) ? averageOrderValue : 0,
          uniqueCustomers: data.customers.size,
        };
      });

    // Payment Methods with full details
    const paymentMethods = new Map<string, { count: number; amount: number; sales: Set<string> }>();
    salesData.forEach((sale) => {
      const payments = (sale.salePayments || []) as any[];
      payments.forEach((payment) => {
        const method = payment.paymentMethod;
        const existing = paymentMethods.get(method) || { count: 0, amount: 0, sales: new Set<string>() };
        existing.count += 1;
        existing.amount += Number(payment.amount);
        existing.sales.add(sale.id);
        paymentMethods.set(method, existing);
      });
    });

    const paymentMethodsArray = Array.from(paymentMethods.entries()).map(([method, data]) => ({
      method,
      count: data.count,
      amount: data.amount,
      salesCount: data.sales.size,
      averageTransaction: (typeof data.amount === 'number' && typeof data.count === 'number' && data.count > 0 && !isNaN(data.amount / data.count)) ? data.amount / data.count : 0,
    }));

    // Refund Analysis
    const refundAnalysis = {
      totalRefunds: totalRefunded,
      refundCount: salesData.reduce((sum, sale) => {
        return sum + ((sale.saleRefunds || []) as any[]).length;
      }, 0),
      refundRate: (typeof totalRefunded === 'number' && typeof totalRevenue === 'number' && totalRevenue > 0 && !isNaN(totalRefunded / totalRevenue)) ? ((totalRefunded / totalRevenue) * 100) : '0.00',
      topRefundReasons: this.getTopRefundReasons(salesData),
    };

    // Customer Analysis
    const customerPurchases = new Map<string, { customer: any; purchases: number; totalSpent: number }>();
    salesData.forEach((sale) => {
      if (sale.customer) {
        const key = sale.customerId;
        const existing = customerPurchases.get(key) || {
          customer: sale.customer,
          purchases: 0,
          totalSpent: 0,
        };
        existing.purchases += 1;
        existing.totalSpent += Number(sale.totalAmount);
        customerPurchases.set(key, existing);
      }
    });

    const topCustomers = Array.from(customerPurchases.values())
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10)
      .map((item) => {
        let averageOrderValue = 0;
        if (item.purchases > 0 && typeof item.totalSpent === 'number' && !isNaN(item.totalSpent / item.purchases)) {
          averageOrderValue = item.totalSpent / item.purchases;
        }
        return {
          customerId: item.customer.id,
          customerName: item.customer.name,
          phone: item.customer.phone,
          email: item.customer.email,
          purchases: item.purchases,
          totalSpent: item.totalSpent,
          averageOrderValue: (typeof averageOrderValue === 'number' && !isNaN(averageOrderValue)) ? averageOrderValue : 0,
        };
      });

    return {
      period: dto.period,
      summary: {
        totalSales: typeof totalSales === 'number' && !isNaN(totalSales) ? totalSales : 0,
        totalRevenue: typeof totalRevenue === 'number' && !isNaN(totalRevenue) ? totalRevenue : 0,
        totalPaid: typeof totalPaid === 'number' && !isNaN(totalPaid) ? totalPaid : 0,
        totalRefunded: typeof totalRefunded === 'number' && !isNaN(totalRefunded) ? totalRefunded : 0,
        netRevenue: typeof netRevenue === 'number' && !isNaN(netRevenue) ? netRevenue : 0,
        totalProfit: typeof totalProfit === 'number' && !isNaN(totalProfit) ? totalProfit : 0,
        profitMargin: typeof profitMargin === 'number' && !isNaN(profitMargin) ? Number(profitMargin) : 0,
        averageOrderValue: typeof averageOrderValue === 'number' && !isNaN(averageOrderValue) ? Number(averageOrderValue) : 0,
      },
      topProducts,
      topLocations,
      salesByDay: salesByDayArray,
      paymentMethods: paymentMethodsArray,
      refundAnalysis,
      topCustomers,
    } as any;
  }

  /**
   * Helper: Get top refund reasons
   */
  private getTopRefundReasons(salesData: any[]): any[] {
    const reasons = new Map<string, { count: number; amount: number }>();
    salesData.forEach((sale) => {
      const refunds = (sale.saleRefunds || []) as any[];
      refunds.forEach((refund) => {
        const reason = refund.reason || 'Not specified';
        const existing = reasons.get(reason) || { count: 0, amount: 0 };
        existing.count += 1;
        existing.amount += Number(refund.amount);
        reasons.set(reason, existing);
      });
    });
    return Array.from(reasons.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5)
      .map(([reason, data]) => ({ reason, count: data.count, amount: data.amount }));
  }

  /**
   * Generate Profit & Loss Report with Full Details
   */
  async generateProfitLossReport(dto: GenerateReportDto): Promise<ProfitLossReportData> {
    const { start, end } = this.getDateRange(dto.period, dto.startDate, dto.endDate);

    // ========== INCOME ==========

    // 1. POS Sales Income
    const salesWhere: any = {
      createdAt: { [Op.gte]: start, [Op.lte]: end },
      // status: 'COMPLETED',
      saleType: 'POS',
    };
    if (dto.locationId) salesWhere.locationId = dto.locationId;

    const posSales = await Sale.findAll({
      where: salesWhere,
      include: [
        {
          model: SaleItem,
          as: 'saleItems'
        },
        {
          model: SalePayment,
          as: 'salePayments'
        },
        {
          model: SaleRefund,
          as: 'saleRefunds'
        }
      ]
    });

    const posSalesData = posSales.map(s => s.toJSON());
    const posSalesIncome = posSalesData.reduce((sum, sale) => {
      const payments = (sale.salePayments || []) as any[];
      const refunds = (sale.saleRefunds || []) as any[];
      const paid = payments.reduce((pSum, p) => pSum + Number(p.amount), 0);
      const refunded = refunds.reduce((rSum, r) => rSum + Number(r.amount), 0);
      return sum + (paid - refunded);
    }, 0);

    const posCostOfGoods = posSalesData.reduce((sum, sale) => {
      const items = (sale.saleItems || []) as any[];
      return sum + items.reduce((itemSum: number, item) => {
        return itemSum + item.quantity * Number(item.costPrice);
      }, 0);
    }, 0);

    // 2. Jobsheet Income
    const jobsheetWhere: any = {
      createdAt: { [Op.gte]: start, [Op.lte]: end },
      // status: 'COMPLETED',
    };
    if (dto.locationId) jobsheetWhere.locationId = dto.locationId;

    const jobsheets = await JobSheet.findAll({
      where: jobsheetWhere,
      include: [
        {
          model: Customer,
          as: 'customer'
        },
        {
          model: User,
          as: 'assignedTo',
          include: [{ model: Staff, as: 'staff' }]
        },
        {
          model: Payment,
          as: 'payments'
        },
        {
          model: Location,
          as: 'location'
        }
      ]
    });

    const jobsheetsData = jobsheets.map(j => j.toJSON());
    const jobsheetIncome = jobsheetsData.reduce((sum, job) => {
      return sum + job.payments.reduce((pSum: number, p: any) => pSum + Number(p.amount), 0);
    }, 0);

    const jobsheetCost = jobsheetsData.reduce((sum, job) => {
      return sum + Number(job.labourCost) + Number(job.partsCost);
    }, 0);

    // 3. Total Sales (including other sale types)
    const allSalesWhere: any = {
      createdAt: { [Op.gte]: start, [Op.lte]: end },
      // status: 'COMPLETED',
    };
    if (dto.locationId) allSalesWhere.locationId = dto.locationId;

    const allSales = await Sale.findAll({
      where: allSalesWhere,
      include: [
        {
          model: SaleItem,
          as: 'saleItems'
        },
        {
          model: SalePayment,
          as: 'salePayments'
        },
        {
          model: SaleRefund,
          as: 'saleRefunds'
        }
      ]
    });

    const allSalesData = allSales.map(s => s.toJSON());
    const totalSalesRevenue = allSalesData.reduce((sum, sale) => {
      const payments = (sale.salePayments || []) as any[];
      const refunds = (sale.saleRefunds || []) as any[];
      const paid = payments.reduce((pSum, p) => pSum + Number(p.amount), 0);
      const refunded = refunds.reduce((rSum, r) => rSum + Number(r.amount), 0);
      return sum + (paid - refunded);
    }, 0);

    const totalCostOfGoodsSold = allSalesData.reduce((sum, sale) => {
      const items = (sale.saleItems || []) as any[];
      return sum + items.reduce((itemSum: number, item) => {
        return itemSum + item.quantity * Number(item.costPrice);
      }, 0);
    }, 0);

    // Total Revenue
    const totalRevenue = totalSalesRevenue + jobsheetIncome;
    const grossProfit = totalRevenue - (totalCostOfGoodsSold + jobsheetCost);
    const grossProfitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

    // ========== EXPENSES ==========

    // 1. Supplier Payments
    const supplierPaymentWhere: any = {
      paymentDate: { [Op.gte]: start, [Op.lte]: end },
    };

    const supplierPayments = await SupplierPayment.findAll({
      where: supplierPaymentWhere,
      include: [
        {
          model: Supplier,
          as: 'supplier'
        },
        {
          model: PurchaseOrder,
          as: 'purchaseOrder',
          include: [
            {
              model: PurchaseOrderItem,
              as: 'items'
            }
          ]
        },
        {
          model: User,
          as: 'creator'
        }
      ]
    });

    const supplierPaymentsData = supplierPayments.map(p => p.toJSON());
    const totalSupplierPayments = supplierPaymentsData.reduce((sum, payment) => {
      return sum + Number(payment.amount);
    }, 0);

    // 2. Sale Refunds as Expense
    const totalRefunds = allSalesData.reduce((sum, sale) => {
      const refunds = (sale.saleRefunds || []) as any[];
      return sum + refunds.reduce((rSum, r) => rSum + Number(r.amount), 0);
    }, 0);

    // Operating Expenses (can be extended with actual expense tracking)
    const operatingExpenses = {
      supplierPayments: totalSupplierPayments,
      saleRefunds: totalRefunds,
      salaries: 0, // Can be calculated from staff payments if available
      rent: 0, // Can be added from expense tracking
      utilities: 0,
      marketing: 0,
      other: 0,
      total: totalSupplierPayments + totalRefunds,
    };

    const netProfit = grossProfit - operatingExpenses.total;
    const netProfitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    // ========== DETAILED BREAKDOWN ==========

    // Daily breakdown
    const dailyData = new Map<
      string,
      { revenue: number; costs: number; profit: number; salesCount: number; jobsheetCount: number }
    >();

    allSalesData.forEach((sale) => {
      const dateKey = new Date(sale.createdAt).toISOString().split('T')[0];
      const existing = dailyData.get(dateKey) || { revenue: 0, costs: 0, profit: 0, salesCount: 0, jobsheetCount: 0 };
      const items = (sale.saleItems || []) as any[];
      const saleCost = items.reduce((sum: number, item) => {
        return sum + item.quantity * Number(item.costPrice);
      }, 0);
      const payments = (sale.salePayments || []) as any[];
      const refunds = (sale.saleRefunds || []) as any[];
      const paid = payments.reduce((pSum, p) => pSum + Number(p.amount), 0);
      const refunded = refunds.reduce((rSum, r) => rSum + Number(r.amount), 0);
      const saleRevenue = paid - refunded;
      existing.revenue += saleRevenue;
      existing.costs += saleCost;
      existing.profit += saleRevenue - saleCost;
      existing.salesCount += 1;
      dailyData.set(dateKey, existing);
    });

    jobsheetsData.forEach((job) => {
      const dateKey = new Date(job.receivedDate).toISOString().split('T')[0];
      const existing = dailyData.get(dateKey) || { revenue: 0, costs: 0, profit: 0, salesCount: 0, jobsheetCount: 0 };
      const jobRev = job.payments.reduce((pSum: number, p: any) => pSum + Number(p.amount), 0);
      const jobCost = Number(job.labourCost) + Number(job.partsCost);
      existing.revenue += jobRev;
      existing.costs += jobCost;
      existing.profit += jobRev - jobCost;
      existing.jobsheetCount += 1;
      dailyData.set(dateKey, existing);
    });

    // console.log(jobsheetsData);

    const breakdown = Array.from(dailyData.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, data]) => ({
        date,
        revenue: data.revenue,
        costs: data.costs,
        profit: data.profit,
        profitMargin: data.revenue > 0 ? ((data.profit / data.revenue) * 100) : 0,
        salesCount: data.salesCount,
        jobsheetCount: data.jobsheetCount,
      }));

    // Income breakdown
    const incomeBreakdown = {
      posSales: {
        revenue: posSalesIncome,
        cost: posCostOfGoods,
        profit: posSalesIncome - posCostOfGoods,
        count: posSalesData.length,
      },
      jobsheets: {
        revenue: jobsheetIncome,
        cost: jobsheetCost,
        profit: jobsheetIncome - jobsheetCost,
        count: jobsheetsData.length,
      },
      otherSales: {
        revenue: totalSalesRevenue - posSalesIncome,
        cost: totalCostOfGoodsSold - posCostOfGoods,
        profit: (totalSalesRevenue - posSalesIncome) - (totalCostOfGoodsSold - posCostOfGoods),
        count: allSalesData.length - posSalesData.length,
      },
    };

    // Payment method breakdown
    const paymentMethodRevenue = new Map<string, number>();
    allSalesData.forEach((sale) => {
      const payments = (sale.salePayments || []) as any[];
      payments.forEach((payment) => {
        const method = payment.paymentMethod;
        const existing = paymentMethodRevenue.get(method) || 0;
        paymentMethodRevenue.set(method, existing + Number(payment.amount));
      });
    });

    const paymentMethods = Array.from(paymentMethodRevenue.entries()).map(([method, amount]) => ({
      method,
      amount,
      percentage: totalRevenue > 0 ? ((amount / totalRevenue) * 100) : 0,
    }));

    // Supplier payment details
    const supplierPaymentDetails = supplierPaymentsData.map((payment) => ({
      paymentNumber: payment.paymentNumber,
      supplierName: payment.supplier?.name || 'Unknown',
      amount: Number(payment.amount),
      paymentMethod: payment.paymentMethod,
      paymentDate: payment.paymentDate,
      purchaseOrderNumber: payment.purchaseOrder?.poNumber || 'N/A',
      status: payment.status,
    }));

    // Top jobsheets by income
    const topJobsheets = jobsheetsData
      .sort((a, b) => (Number(b.totalCost) || 0) - (Number(a.totalCost) || 0))
      .slice(0, 10)
      .map((job) => ({
        jobNumber: job.jobNumber,
        customerName: job.customer?.name || 'Unknown',
        totalCost: Number(job.totalCost) || 0,
        status: job.status,
        assignedTo: job.assignedTo?.name || 'Unassigned',
        location: job.location?.name || 'N/A',
        createdAt: job.createdAt,
      }));

    return {
      period: dto.period,
      summary: {
        totalRevenue,
        costOfGoodsSold: totalCostOfGoodsSold + jobsheetCost,
        grossProfit,
        grossProfitMargin: Number(grossProfitMargin),
        operatingExpenses: operatingExpenses.total,
        netProfit,
        netProfitMargin: Number(netProfitMargin),
      },
      incomeBreakdown,
      operatingExpenses,
      breakdown,
      paymentMethods,
      supplierPayments: {
        total: totalSupplierPayments,
        count: supplierPaymentsData.length,
        details: supplierPaymentDetails,
      },
      jobsheets: {
        total: jobsheetIncome,
        count: jobsheetsData.length,
        topJobsheets,
      },
      refunds: {
        total: totalRefunds,
        count: allSalesData.reduce((sum, sale) => sum + ((sale.saleRefunds || []) as any[]).length, 0),
      },
    } as any;
  }

  /**
   * Generate Inventory Report with Full Details
   */
  async generateInventoryReport(dto: GenerateReportDto): Promise<InventoryReportData> {
    const whereClause: any = {};
    if (dto.locationId) whereClause.locationId = dto.locationId;

    const inventory = await ProductInventory.findAll({
      where: whereClause,
      include: [
        {
          model: Product,
          as: 'product',
          include: [
            {
              model: ProductCategory,
              as: 'category'
            },
            {
              model: require('../../models/supplier-product.model').SupplierProduct,
              as: 'supplierProducts',
              include: [
                {
                  model: require('../../models/supplier.model').Supplier,
                  as: 'supplier',
                  required: false
                }
              ],
              required: false
            }
          ]
        },
        {
          model: Location,
          as: 'location'
        }
      ]
    });

    const inventoryData = inventory.map(i => i.toJSON());
    const totalItems = inventoryData.length;
    const totalQuantity = inventoryData.reduce((sum, item) => sum + item.quantity, 0);

    // Calculate total value using cost price from product
    const totalValue = inventoryData.reduce(
      (sum, item) => sum + item.quantity * (Number((item.product as any)?.costPrice) || 0),
      0
    );

    // Calculate retail value
    const totalRetailValue = inventoryData.reduce(
      (sum, item) => sum + item.quantity * (Number((item.product as any)?.price) || 0),
      0
    );

    const potentialProfit = totalRetailValue - totalValue;

    // Stock level analysis
    const lowStockItems = inventoryData.filter((item) => item.quantity <= (item.minStockLevel || 10)).length;
    const outOfStockItems = inventoryData.filter((item) => item.quantity === 0).length;
    const excessStockItems = inventoryData.filter((item) => item.quantity > (item.maxStockLevel || 100)).length;
    const optimalStockItems = inventoryData.filter((item) => {
      const min = item.minStockLevel || 10;
      const max = item.maxStockLevel || 100;
      return item.quantity > min && item.quantity <= max;
    }).length;

    // Category-wise breakdown
    const categoryBreakdown = new Map<string, {
      items: number;
      quantity: number;
      value: number;
      retailValue: number;
      category: any;
    }>();

    inventoryData.forEach((item) => {
      const categoryId = (item.product as any)?.categoryId || 'uncategorized';
      const categoryName = (item.product as any)?.category?.name || 'Uncategorized';
      const existing = categoryBreakdown.get(categoryId) || {
        items: 0,
        quantity: 0,
        value: 0,
        retailValue: 0,
        category: { id: categoryId, name: categoryName },
      };
      existing.items += 1;
      existing.quantity += item.quantity;
      existing.value += item.quantity * (Number((item.product as any)?.costPrice) || 0);
      existing.retailValue += item.quantity * (Number((item.product as any)?.price) || 0);
      categoryBreakdown.set(categoryId, existing);
    });

    const categoryWise = Array.from(categoryBreakdown.values()).map((item) => ({
      categoryId: item.category.id,
      categoryName: item.category.name,
      items: item.items,
      quantity: item.quantity,
      value: item.value,
      retailValue: item.retailValue,
      potentialProfit: item.retailValue - item.value,
      profitMargin: item.value > 0 ? (((item.retailValue - item.value) / item.value) * 100) : 0,
    }));

    // Calculate inventory turnover
    const { start, end } = this.getDateRange(dto.period, dto.startDate, dto.endDate);
    const saleWhere: any = {
      createdAt: { [Op.gte]: start, [Op.lte]: end },
      status: 'COMPLETED',
    };
    if (dto.locationId) saleWhere.locationId = dto.locationId;

    const sales = await SaleItem.findAll({
      include: [
        {
          model: Sale,
          as: 'sale',
          where: saleWhere
        },
        {
          model: Product,
          as: 'product'
        }
      ]
    });

    const salesData = sales.map(s => s.toJSON());
    const productTurnover = new Map<string, { sold: number; avgStock: number; revenue: number }>();

    salesData.forEach((item) => {
      const key = item.productId;
      const existing = productTurnover.get(key) || { sold: 0, avgStock: 0, revenue: 0 };
      existing.sold += item.quantity;
      existing.revenue += Number(item.subtotal);
      productTurnover.set(key, existing);
    });

    inventoryData.forEach((item) => {
      const key = item.productId;
      const existing = productTurnover.get(key);
      if (existing) {
        existing.avgStock = item.quantity;
      } else {
        productTurnover.set(key, { sold: 0, avgStock: item.quantity, revenue: 0 });
      }
    });

    // Fast moving items
    const fastMovingItems = Array.from(productTurnover.entries())
      .filter(([_, data]) => data.sold > 0 && data.avgStock > 0)
      .map(([productId, data]) => {
        const invItem = inventoryData.find((i) => i.productId === productId);
        const product = invItem?.product as any;
        return {
          productId,
          productName: product?.name || 'Unknown',
          sku: product?.sku || 'N/A',
          category: product?.category?.name || 'N/A',
          quantitySold: data.sold,
          currentStock: data.avgStock,
          turnoverRate: data.avgStock > 0 ? (data.sold / data.avgStock) : 0,
          revenue: data.revenue,
          stockValue: data.avgStock * (Number(product?.costPrice) || 0),
          location: invItem?.location?.name || 'N/A',
        };
      })
      .sort((a, b) => Number(b.turnoverRate) - Number(a.turnoverRate))
      .slice(0, 20);

    // Slow moving items
    const slowMovingItems = Array.from(productTurnover.entries())
      .filter(([_, data]) => data.sold === 0 || (data.avgStock > 0 && data.sold / data.avgStock < 0.1))
      .map(([productId, data]) => {
        const invItem = inventoryData.find((i) => i.productId === productId);
        const product = invItem?.product as any;
        const daysInStock = Math.floor((new Date().getTime() - new Date(invItem?.updatedAt || new Date()).getTime()) / (1000 * 60 * 60 * 24));
        return {
          productId,
          productName: product?.name || 'Unknown',
          sku: product?.sku || 'N/A',
          category: product?.category?.name || 'N/A',
          quantity: data.avgStock,
          daysInStock,
          value: data.avgStock * (Number(product?.costPrice) || 0),
          minStockLevel: invItem?.minStockLevel || 0,
          location: invItem?.location?.name || 'N/A',
        };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 20);

    // Low stock alerts
    const lowStockAlerts = inventoryData
      .filter((item) => item.quantity <= (item.minStockLevel || 10) && item.quantity > 0)
      .map((item) => {
        const product = item.product as any;
        let suppliers = 'N/A';
        if (product && Array.isArray(product.supplierProducts) && product.supplierProducts.length > 0) {
          suppliers = product.supplierProducts
            .map((sp: any) => sp.supplier?.name)
            .filter(Boolean)
            .join(', ');
        }
        return {
          productId: item.productId,
          productName: product?.name || 'Unknown',
          sku: product?.sku || 'N/A',
          currentStock: item.quantity,
          minStockLevel: item.minStockLevel || 10,
          reorderQuantity: (item.maxStockLevel || 100) - item.quantity,
          location: item.location?.name || 'N/A',
          suppliers,
        };
      })
      .sort((a, b) => a.currentStock - b.currentStock);

    // Out of stock items
    const outOfStockList = inventoryData
      .filter((item) => item.quantity === 0)
      .map((item) => {
        const product = item.product as any;
        return {
          productId: item.productId,
          productName: product?.name || 'Unknown',
          sku: product?.sku || 'N/A',
          minStockLevel: item.minStockLevel || 10,
          reorderQuantity: item.maxStockLevel || 100,
          location: item.location?.name || 'N/A',
          suppliers: (product?.suppliers || []).map((s: any) => s.name).join(', ') || 'N/A',
        };
      });

    // Location wise inventory
    const locationWise = new Map<string, {
      location: any;
      totalItems: number;
      totalQuantity: number;
      totalValue: number;
      lowStockCount: number;
      outOfStockCount: number;
      productName: string;
    }>();

    inventoryData.forEach((item) => {
      if (item.location) {
        const key = item.locationId;
        const existing = locationWise.get(key) || {
          location: item.location,
          totalItems: 0,
          totalQuantity: 0,
          totalValue: 0,
          lowStockCount: 0,
          outOfStockCount: 0,
          productName: item.product?.name || 'Unknown',
        };
        existing.totalItems += 1;
        existing.totalQuantity += item.quantity;
        existing.totalValue += item.quantity * (Number((item.product as any)?.costPrice) || 0);
        if (item.quantity === 0) existing.outOfStockCount += 1;
        else if (item.quantity <= (item.minStockLevel || 10)) existing.lowStockCount += 1;
        locationWise.set(key, existing);
      }
    });

    const locationWiseArray = Array.from(locationWise.values()).map((item) => ({
      locationId: item.location.id,
      locationName: item.location.name,
      locationType: item.location.locationType,
      totalItems: item.totalItems,
      totalQuantity: item.totalQuantity,
      totalValue: item.totalValue,
      lowStockCount: item.lowStockCount,
      outOfStockCount: item.outOfStockCount,
      productName: item.productName,
      stockHealth: ((item.totalItems - item.lowStockCount - item.outOfStockCount) / item.totalItems * 100) + '%',
    }));

    // Calculate overall inventory turnover
    const totalSold = Array.from(productTurnover.values()).reduce((sum, item) => sum + item.sold, 0);
    const avgInventory = totalValue / 2; // Simplified
    const inventoryTurnover = avgInventory > 0 ? totalSold / (totalQuantity / 2) : 0;

    // Stock aging analysis
    const stockAging = {
      fresh: inventoryData.filter((item) => {
        const days = Math.floor((new Date().getTime() - new Date(item.updatedAt).getTime()) / (1000 * 60 * 60 * 24));
        return days <= 30;
      }).length,
      moderate: inventoryData.filter((item) => {
        const days = Math.floor((new Date().getTime() - new Date(item.updatedAt).getTime()) / (1000 * 60 * 60 * 24));
        return days > 30 && days <= 90;
      }).length,
      old: inventoryData.filter((item) => {
        const days = Math.floor((new Date().getTime() - new Date(item.updatedAt).getTime()) / (1000 * 60 * 60 * 24));
        return days > 90;
      }).length,
    };

    return {
      summary: {
        totalItems,
        totalValue,
        totalRetailValue,
        potentialProfit,
        totalQuantity,
        lowStockItems,
        outOfStockItems,
        excessStockItems,
        optimalStockItems,
        inventoryTurnover: Number(inventoryTurnover),
        stockHealthScore: ((optimalStockItems / totalItems) * 100) + '%',
      },
      categoryWise,
      fastMovingItems,
      slowMovingItems,
      lowStockAlerts,
      outOfStockList,
      locationWise: locationWiseArray,
      stockAging,
    } as any;
  }

  /**
   * Generate Staff Performance Report with Full Details
   */
  async generateStaffPerformanceReport(dto: GenerateReportDto): Promise<StaffPerformanceReportData> {
    const { start, end } = this.getDateRange(dto.period, dto.startDate, dto.endDate);

    // Get sales by staff
    const saleWhere: any = {
      createdAt: { [Op.gte]: start, [Op.lte]: end },
      // status: 'COMPLETED',
    };
    if (dto.locationId) saleWhere.locationId = dto.locationId;

    const sales = await Sale.findAll({
      where: saleWhere,
      include: [
        {
          model: SaleItem,
          as: 'saleItems'
        },
        {
          model: SalePayment,
          as: 'salePayments'
        },
        {
          model: User,
          as: 'soldBy',
          include: [{ model: Staff, as: 'staff' }]
        },
        // {
        //   model: Location,
        //   as: 'location'
        // }
      ]
    });

    // Get completed job sheets by staff
    const jobWhere: any = {
      createdAt: { [Op.gte]: start, [Op.lte]: end },
      status: 'COMPLETED',
    };
    if (dto.locationId) jobWhere.locationId = dto.locationId;

    const jobSheets = await JobSheet.findAll({
      where: jobWhere,
      include: [
        {
          model: User,
          as: 'assignedTo',
          include: [{ model: Staff, as: 'staff' }]
        },
        {
          model: Customer,
          as: 'customer'
        },
        {
          model: Location,
          as: 'location'
        }
      ]
    });

    const staffPerformance = new Map<
      string,
      {
        staff: any;
        user: any;
        totalSales: number;
        revenue: number;
        profit: number;
        completedJobs: number;
        jobRevenue: number;
        customers: Set<string>;
        locations: Set<string>;
        ratings: number[];
      }
    >();

    const salesData = sales.map(s => s.toJSON());
    salesData.forEach((sale) => {
      if (sale.soldBy) {
        const key = sale.soldBy.id;
        const existing = staffPerformance.get(key) || {
          staff: sale.soldBy.staff || null,
          user: sale.soldBy,
          totalSales: 0,
          revenue: 0,
          profit: 0,
          completedJobs: 0,
          jobRevenue: 0,
          customers: new Set<string>(),
          locations: new Set<string>(),
          ratings: [],
        };

        const items = (sale.saleItems || []) as any[];
        const saleProfit = items.reduce((sum, item) => {
          return sum + (Number(item.unitPrice) - Number(item.costPrice)) * item.quantity;
        }, 0);

        existing.totalSales += 1;
        existing.revenue += Number(sale.totalAmount);
        existing.profit += saleProfit;

        if (sale.customerId) {
          existing.customers.add(sale.customerId);
        }
        if (sale.locationId) {
          existing.locations.add(sale.locationId);
        }

        staffPerformance.set(key, existing);
      }
    });

    const jobSheetsData = jobSheets.map(j => j.toJSON());
    jobSheetsData.forEach((job) => {
      if (job.assignedTo) {
        const key = job.assignedTo.id;
        const existing = staffPerformance.get(key) || {
          staff: job.assignedTo.staff || null,
          user: job.assignedTo,
          totalSales: 0,
          revenue: 0,
          profit: 0,
          completedJobs: 0,
          jobRevenue: 0,
          customers: new Set<string>(),
          locations: new Set<string>(),
          ratings: [],
        };

        existing.completedJobs += 1;
        existing.jobRevenue += Number(job.totalCost) || 0;

        if (job.customerId) {
          existing.customers.add(job.customerId);
        }
        if (job.locationId) {
          existing.locations.add(job.locationId);
        }

        staffPerformance.set(key, existing);
      }
    });

    const staffWhere: any = {};
    // Removed locationId filter as Staff table does not have locationId column

    const allStaff = await Staff.findAll({
      where: staffWhere,
      include: [
        {
          model: User,
          as: 'user'
        }
        // Removed Location include as Staff is not associated to Location
      ]
    });

    const totalStaff = allStaff.length;

    // Top performers by total revenue (sales + jobs)
    const topPerformers = Array.from(staffPerformance.values())
      .sort((a, b) => (b.revenue + b.jobRevenue) - (a.revenue + a.jobRevenue))
      .slice(0, 10)
      .map((item) => ({
        staffId: item.user.id,
        staffName: item.user.name,
        email: item.user.email,
        phone: item.staff?.phone || 'N/A',
        position: item.staff?.position || 'N/A',
        totalSales: item.totalSales,
        salesRevenue: item.revenue,
        salesProfit: item.profit,
        completedJobs: item.completedJobs,
        jobRevenue: item.jobRevenue,
        totalRevenue: item.revenue + item.jobRevenue,
        totalProfit: item.profit + (item.jobRevenue * 0.6), // Assuming 60% profit margin on jobs
        uniqueCustomers: item.customers.size,
        locationsServed: item.locations.size,
        averageOrderValue: item.totalSales > 0 ? item.revenue / item.totalSales : 0,
        averageRating: item.ratings.length > 0 ? item.ratings.reduce((a, b) => a + b) / item.ratings.length : 0,
      }));

    // Calculate department/position wise performance
    const departmentPerformance = new Map<string, {
      staff: number;
      sales: number;
      revenue: number;
      jobs: number
    }>();

    Array.from(staffPerformance.values()).forEach((item) => {
      const dept = item.staff?.position || 'Unassigned';
      const existing = departmentPerformance.get(dept) || {
        staff: 0,
        sales: 0,
        revenue: 0,
        jobs: 0,
      };
      existing.staff += 1;
      existing.sales += item.totalSales;
      existing.revenue += item.revenue + item.jobRevenue;
      existing.jobs += item.completedJobs;
      departmentPerformance.set(dept, existing);
    });

    const departmentWise = Array.from(departmentPerformance.entries()).map(([department, data]) => ({
      department,
      totalStaff: data.staff,
      totalSales: data.sales,
      totalRevenue: data.revenue,
      totalJobs: data.jobs,
      averageRevenuePerStaff: data.staff > 0 ? data.revenue / data.staff : 0,
    }));

    // Performance trends by day
    const dailyPerformance = new Map<string, {
      sales: number;
      revenue: number;
      jobs: number;
      activeStaff: Set<string>
    }>();

    salesData.forEach((sale) => {
      if (sale.soldBy) {
        const dateKey = new Date(sale.createdAt).toISOString().split('T')[0];
        const existing = dailyPerformance.get(dateKey) || {
          sales: 0,
          revenue: 0,
          jobs: 0,
          activeStaff: new Set<string>(),
        };
        existing.sales += 1;
        existing.revenue += Number(sale.totalAmount);
        existing.activeStaff.add(sale.soldBy.id);
        dailyPerformance.set(dateKey, existing);
      }
    });

    jobSheetsData.forEach((job) => {
      if (job.assignedTo) {
        const dateKey = new Date(job.createdAt).toISOString().split('T')[0];
        const existing = dailyPerformance.get(dateKey) || {
          sales: 0,
          revenue: 0,
          jobs: 0,
          activeStaff: new Set<string>(),
        };
        existing.jobs += 1;
        existing.revenue += Number(job.totalCost) || 0;
        existing.activeStaff.add(job.assignedTo.id);
        dailyPerformance.set(dateKey, existing);
      }
    });

    const performanceTrends = Array.from(dailyPerformance.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, data]) => ({
        date,
        sales: data.sales,
        jobs: data.jobs,
        revenue: data.revenue,
        activeStaff: data.activeStaff.size,
        averageRevenuePerStaff: data.activeStaff.size > 0 ? data.revenue / data.activeStaff.size : 0,
      }));

    // Underperforming staff (staff with no sales or jobs)
    const performingStaffIds = new Set(Array.from(staffPerformance.keys()));
    const underperformingStaff = allStaff
      .filter((staff) => !performingStaffIds.has(staff.user?.id))
      .map((staff) => ({
        staffId: staff.user?.id || staff.id,
        staffName: staff.user?.name || 'Unknown',
        nicNumber: staff.nicNumber || 'N/A',
        email: staff.user?.email || 'N/A',
      }));

    const totalRevenue = Array.from(staffPerformance.values()).reduce(
      (sum, item) => sum + item.revenue + item.jobRevenue,
      0
    );
    const averageSalesPerStaff = totalStaff > 0 ? totalRevenue / totalStaff : 0;

    return {
      period: dto.period,
      summary: {
        totalStaff,
        activeStaff: staffPerformance.size,
        inactiveStaff: totalStaff - staffPerformance.size,
        totalRevenue,
        totalSales: Array.from(staffPerformance.values()).reduce((sum, item) => sum + item.totalSales, 0),
        totalJobs: Array.from(staffPerformance.values()).reduce((sum, item) => sum + item.completedJobs, 0),
        averageSalesPerStaff: Number(averageSalesPerStaff),
      },
      topPerformers,
      departmentWise,
      performanceTrends,
      underperformingStaff,
    } as any;
  }

  /**
   * Generate Customer Analysis Report with Full Details
   */
  async generateCustomerAnalysisReport(dto: GenerateReportDto): Promise<CustomerAnalysisReportData> {
    const { start, end } = this.getDateRange(dto.period, dto.startDate, dto.endDate);

    // Get all customers
    const customerWhere: any = {};
    if (dto.locationId) customerWhere.locationId = dto.locationId;

    const allCustomers = await Customer.findAll({
      where: customerWhere,
      include: [
        {
          model: Location,
          as: 'location'
        }
      ]
    });

    const totalCustomers = allCustomers.length;

    // Get new customers in period
    const newCustomerWhere: any = {
      createdAt: { [Op.gte]: start, [Op.lte]: end },
    };
    if (dto.locationId) newCustomerWhere.locationId = dto.locationId;

    const newCustomersList = await Customer.findAll({
      where: newCustomerWhere
    });

    const newCustomers = newCustomersList.length;

    // Get sales data with full customer details
    const saleWhere: any = {
      createdAt: { [Op.gte]: start, [Op.lte]: end },
      // status: 'COMPLETED',
    };
    if (dto.locationId) saleWhere.locationId = dto.locationId;

    const sales = await Sale.findAll({
      where: saleWhere,
      include: [
        {
          model: Customer,
          as: 'customer',
          include: [
            {
              model: Location,
              as: 'location'
            }
          ]
        },
        {
          model: SaleItem,
          as: 'saleItems'
        },
        {
          model: SalePayment,
          as: 'salePayments'
        }
      ]
    });

    // Get jobsheets for customer service analysis
    const jobsheetWhere: any = {
      createdAt: { [Op.gte]: start, [Op.lte]: end },
    };
    if (dto.locationId) jobsheetWhere.locationId = dto.locationId;

    const jobsheets = await JobSheet.findAll({
      where: jobsheetWhere,
      include: [
        {
          model: Customer,
          as: 'customer'
        }
      ]
    });

    const customerPurchases = new Map<
      string,
      {
        customer: any;
        purchases: number;
        totalSpent: number;
        lastPurchase: Date;
        firstPurchase: Date;
        jobsheets: number;
        items: number;
        paymentMethods: Set<string>;
        averageOrderValue: number;
      }
    >();

    // Process sales to group by customer
    const salesData = sales.map(s => s.toJSON());
    for (const sale of salesData) {
      if (sale.customer) {
        const key = sale.customerId;
        const saleDate = new Date(sale.createdAt);
        const items = (sale.saleItems || []) as any[];
        const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

        const payments = (sale.salePayments || []) as any[];
        const paymentMethods = new Set(payments.map(p => p.paymentMethod));

        const existing = customerPurchases.get(key) || {
          customer: sale.customer,
          purchases: 0,
          totalSpent: 0,
          lastPurchase: saleDate,
          firstPurchase: saleDate,
          jobsheets: 0,
          items: 0,
          paymentMethods: new Set<string>(),
          averageOrderValue: 0,
        };

        existing.purchases += 1;
        existing.totalSpent += Number(sale.totalAmount);
        existing.items += itemCount;

        if (saleDate > existing.lastPurchase) {
          existing.lastPurchase = saleDate;
        }
        if (saleDate < existing.firstPurchase) {
          existing.firstPurchase = saleDate;
        }

        paymentMethods.forEach(method => existing.paymentMethods.add(method));
        existing.averageOrderValue = existing.totalSpent / existing.purchases;

        customerPurchases.set(key, existing);
      }
    }

    // Add jobsheet data
    const jobsheetsData = jobsheets.map(j => j.toJSON());
    jobsheetsData.forEach((job) => {
      if (job.customer) {
        const key = job.customerId;
        const existing = customerPurchases.get(key);
        if (existing) {
          existing.jobsheets += 1;
        } else {
          const jobDate = new Date(job.createdAt);
          customerPurchases.set(key, {
            customer: job.customer,
            purchases: 0,
            totalSpent: Number(job.totalCost) || 0,
            lastPurchase: jobDate,
            firstPurchase: jobDate,
            jobsheets: 1,
            items: 0,
            paymentMethods: new Set<string>(),
            averageOrderValue: Number(job.totalCost) || 0,
          });
        }
      }
    });

    const returningCustomers = Array.from(customerPurchases.values()).filter(
      (c) => c.purchases > 1 || c.jobsheets > 0
    ).length;

    const customerRetentionRate =
      totalCustomers > 0 ? (returningCustomers / totalCustomers) * 100 : 0;

    const totalSpent = Array.from(customerPurchases.values()).reduce(
      (sum, c) => sum + c.totalSpent,
      0
    );
    const averageCustomerValue = customerPurchases.size > 0 ? totalSpent / customerPurchases.size : 0;

    // Customer lifetime value calculation
    const avgPurchaseFrequency = Array.from(customerPurchases.values()).reduce(
      (sum, c) => sum + c.purchases, 0
    ) / customerPurchases.size;

    const avgCustomerLifespan = Array.from(customerPurchases.values()).reduce((sum, c) => {
      const days = Math.floor((c.lastPurchase.getTime() - c.firstPurchase.getTime()) / (1000 * 60 * 60 * 24));
      return sum + (days || 1);
    }, 0) / customerPurchases.size;

    const customerLifetimeValue = averageCustomerValue * avgPurchaseFrequency * (avgCustomerLifespan / 365);

    // Top customers
    const topCustomers = Array.from(customerPurchases.entries())
      .sort((a, b) => b[1].totalSpent - a[1].totalSpent)
      .slice(0, 20)
      .map(([customerId, data]) => ({
        customerId,
        customerName: data.customer.name,
        phone: data.customer.phone,
        email: data.customer.email,
        customerType: data.customer.customerType,
        location: data.customer.location?.name || 'N/A',
        totalPurchases: data.purchases,
        totalJobsheets: data.jobsheets,
        totalSpent: data.totalSpent,
        averageOrderValue: data.averageOrderValue,
        itemsPurchased: data.items,
        preferredPaymentMethods: Array.from(data.paymentMethods).join(', '),
        lastPurchase: data.lastPurchase.toISOString(),
        firstPurchase: data.firstPurchase.toISOString(),
        daysSinceLastPurchase: Math.floor((new Date().getTime() - data.lastPurchase.getTime()) / (1000 * 60 * 60 * 24)),
      }));

    // Customer segmentation
    const highValueCustomers = Array.from(customerPurchases.values()).filter(
      c => c.totalSpent > averageCustomerValue * 2
    ).length;

    const mediumValueCustomers = Array.from(customerPurchases.values()).filter(
      c => c.totalSpent >= averageCustomerValue * 0.5 && c.totalSpent <= averageCustomerValue * 2
    ).length;

    const lowValueCustomers = Array.from(customerPurchases.values()).filter(
      c => c.totalSpent < averageCustomerValue * 0.5
    ).length;

    // Customers at risk (no purchase in last 90 days)
    const atRiskCustomers = Array.from(customerPurchases.values())
      .filter(c => {
        const daysSinceLast = Math.floor((new Date().getTime() - c.lastPurchase.getTime()) / (1000 * 60 * 60 * 24));
        return daysSinceLast > 90;
      })
      .map(c => ({
        customerId: c.customer.id,
        customerName: c.customer.name,
        phone: c.customer.phone,
        totalSpent: c.totalSpent,
        lastPurchase: c.lastPurchase.toISOString(),
        daysSinceLastPurchase: Math.floor((new Date().getTime() - c.lastPurchase.getTime()) / (1000 * 60 * 60 * 24)),
      }));

    // Customers by type
    const customersByType = new Map<string, { count: number; revenue: number; avgSpent: number }>();
    Array.from(customerPurchases.values()).forEach(c => {
      const type = c.customer.customerType || 'INDIVIDUAL';
      const existing = customersByType.get(type) || { count: 0, revenue: 0, avgSpent: 0 };
      existing.count += 1;
      existing.revenue += c.totalSpent;
      customersByType.set(type, existing);
    });

    const customersByTypeArray = Array.from(customersByType.entries()).map(([type, data]) => ({
      type,
      count: data.count,
      revenue: data.revenue,
      averageSpent: data.count > 0 ? data.revenue / data.count : 0,
      percentage: (customerPurchases.size > 0 ? (data.count / customerPurchases.size) * 100 : 0) + '%',
    }));

    // Customers by location
    const customersByLocation = new Map<string, {
      location: any;
      customers: Set<string>;
      revenue: number
    }>();

    Array.from(customerPurchases.values()).forEach(c => {
      if (c.customer.location) {
        const key = c.customer.locationId;
        const existing = customersByLocation.get(key) || {
          location: c.customer.location,
          customers: new Set<string>(),
          revenue: 0,
        };
        existing.customers.add(c.customer.id);
        existing.revenue += c.totalSpent;
        customersByLocation.set(key, existing);
      }
    });

    const customersByLocationArray = Array.from(customersByLocation.values()).map(item => ({
      locationId: item.location.id,
      locationName: item.location.name,
      customerCount: item.customers.size,
      revenue: item.revenue,
      averageRevenuePerCustomer: item.customers.size > 0 ? item.revenue / item.customers.size : 0,
    }));

    return {
      period: dto.period,
      summary: {
        totalCustomers,
        newCustomers,
        returningCustomers,
        activeCustomers: customerPurchases.size,
        customerRetentionRate: Number(customerRetentionRate),
        averageCustomerValue: Number(averageCustomerValue),
        customerLifetimeValue: Number(customerLifetimeValue),
        totalRevenue: totalSpent,
      },
      segmentation: {
        highValue: highValueCustomers,
        mediumValue: mediumValueCustomers,
        lowValue: lowValueCustomers,
      },
      topCustomers,
      atRiskCustomers,
      customersByType: customersByTypeArray,
      customersByLocation: customersByLocationArray,
    } as any;
  }

  /**
   * Generate Shop Performance Report with Full Details
   */
  async generateShopPerformanceReport(dto: GenerateReportDto): Promise<ShopPerformanceReportData> {
    const { start, end } = this.getDateRange(dto.period, dto.startDate, dto.endDate);

    // Get all locations
    const locationWhere: any = {
      // isActive: true,
    };
    // if (dto.locationId) locationWhere.id = dto.locationId;

    const locations = await Location.findAll({

    });

    const locationPerformance = new Map<
      string,
      {
        location: any;
        totalSales: number;
        revenue: number;
        profit: number;
        jobsheets: number;
        jobRevenue: number;
        customersServed: Set<string>;
        staffCount: number;
        inventoryValue: number;
        lowStockItems: number;
        outOfStockItems: number;
      }
    >();

    // Get sales data
    const saleWhere: any = {
      createdAt: { [Op.gte]: start, [Op.lte]: end },
      // status: 'COMPLETED',
    };

    const sales = await Sale.findAll({
      where: saleWhere,
      include: [
        {
          model: Location,
          as: 'location'
        },
        {
          model: SaleItem,
          as: 'saleItems'
        },
        {
          model: SalePayment,
          as: 'salePayments'
        }
      ]
    });

    const salesData = sales.map(s => s.toJSON());
    salesData.forEach((sale) => {
      if (sale.location) {
        const key = sale.locationId;
        const existing = locationPerformance.get(key) || {
          location: sale.location,
          totalSales: 0,
          revenue: 0,
          profit: 0,
          jobsheets: 0,
          jobRevenue: 0,
          customersServed: new Set<string>(),
          staffCount: 0,
          inventoryValue: 0,
          lowStockItems: 0,
          outOfStockItems: 0,
        };
        existing.totalSales += 1;

        // Calculate actual paid amount
        const payments = (sale.salePayments || []) as any[];
        const paidAmount = payments.reduce((sum, p) => sum + Number(p.amount), 0);
        existing.revenue += paidAmount;

        // Calculate profit from items
        const items = (sale.saleItems || []) as any[];
        const saleProfit = items.reduce((sum, item) => {
          return sum + (Number(item.unitPrice) - Number(item.costPrice)) * item.quantity;
        }, 0);
        existing.profit += saleProfit;

        if (sale.customerId) {
          existing.customersServed.add(sale.customerId);
        }
        locationPerformance.set(key, existing);
      }
    });

    // Get jobsheet data
    const jobsheetWhere: any = {
      createdAt: { [Op.gte]: start, [Op.lte]: end },
      // status: 'COMPLETED',
    };

    const jobsheets = await JobSheet.findAll({
      where: jobsheetWhere,
      include: [
        {
          model: Location,
          as: 'location'
        },
        {
          model: Customer,
          as: 'customer'
        }
      ]
    });

    const jobsheetsData = jobsheets.map(j => j.toJSON());
    jobsheetsData.forEach((job) => {
      if (job.location) {
        const key = job.locationId;
        const existing = locationPerformance.get(key);
        if (existing) {
          existing.jobsheets += 1;
          existing.jobRevenue += Number(job.totalCost) || 0;
          if (job.customerId) {
            existing.customersServed.add(job.customerId);
          }
        }
      }
    });

    // Get staff count per location
    const staffCounts = await User.findAll({
      attributes: [
        'locationId',
        [sequelize.fn('COUNT', sequelize.col('User.id')), 'count']
      ],
      include: [
        {
          model: Staff,
          as: 'staff',
          required: true,
          attributes: []
        }
      ],
      where: {
        locationId: { [Op.ne]: null }
      },
      group: ['User.location_id']
    });

    const staffCountMap = new Map<string, number>();
    staffCounts.forEach((staff: any) => {
      staffCountMap.set(staff.locationId, Number(staff.get('count')));
    });

    // Get inventory data per location
    const inventoryData = await ProductInventory.findAll({
      include: [
        {
          model: Product,
          as: 'product'
        }
      ]
    });

    const inventoryMap = new Map<string, { value: number; lowStock: number; outOfStock: number }>();
    inventoryData.forEach((inv) => {
      const invData = inv.toJSON();
      const key = invData.locationId;
      const existing = inventoryMap.get(key) || { value: 0, lowStock: 0, outOfStock: 0 };
      existing.value += invData.quantity * (Number((invData.product as any)?.costPrice) || 0);
      if (invData.quantity === 0) existing.outOfStock += 1;
      else if (invData.quantity <= (invData.minStockLevel || 10)) existing.lowStock += 1;
      inventoryMap.set(key, existing);
    });

    // Merge inventory and staff data
    locationPerformance.forEach((data, locationId) => {
      data.staffCount = staffCountMap.get(locationId) || 0;
      const inv = inventoryMap.get(locationId) || { value: 0, lowStock: 0, outOfStock: 0 };
      data.inventoryValue = inv.value;
      data.lowStockItems = inv.lowStock;
      data.outOfStockItems = inv.outOfStock;
    });

    const topPerformingLocations = Array.from(locationPerformance.values())
      .sort((a, b) => (b.revenue + b.jobRevenue) - (a.revenue + a.jobRevenue))
      .map((item) => ({
        locationId: item.location.id,
        locationName: item.location.name,
        locationType: item.location.locationType,
        address: item.location.address,
        totalSales: item.totalSales,
        salesRevenue: item.revenue,
        jobsheets: item.jobsheets,
        jobRevenue: item.jobRevenue,
        totalRevenue: item.revenue + item.jobRevenue,
        profit: item.profit + (item.jobRevenue * 0.6), // Assuming 60% profit on jobs
        profitMargin: (item.revenue + item.jobRevenue) > 0
          ? (((item.profit + item.jobRevenue * 0.6) / (item.revenue + item.jobRevenue)) * 100)
          : 0,
        customersServed: item.customersServed.size,
        staffCount: item.staffCount,
        revenuePerStaff: item.staffCount > 0 ? (item.revenue + item.jobRevenue) / item.staffCount : 0,
        inventoryValue: item.inventoryValue,
        lowStockItems: item.lowStockItems,
        outOfStockItems: item.outOfStockItems,
        averageOrderValue: item.totalSales > 0 ? item.revenue / item.totalSales : 0,
      }));

    const totalRevenue = topPerformingLocations.reduce((sum, loc) => sum + loc.totalRevenue, 0);
    const totalProfit = topPerformingLocations.reduce((sum, loc) => sum + Number(loc.profit), 0);
    const averageRevenuePerLocation =
      topPerformingLocations.length > 0 ? totalRevenue / topPerformingLocations.length : 0;

    // Previous period comparison
    const periodDays = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const prevPeriodStart = new Date(start);
    prevPeriodStart.setDate(prevPeriodStart.getDate() - periodDays);
    const prevPeriodEnd = new Date(start);

    const prevSales = await Sale.findAll({
      where: {
        createdAt: { [Op.gte]: prevPeriodStart, [Op.lte]: prevPeriodEnd },
        status: 'COMPLETED',
      },
      include: [
        {
          model: SalePayment,
          as: 'salePayments'
        }
      ]
    });

    const prevLocationRevenue = new Map<string, number>();
    const prevSalesData = prevSales.map(s => s.toJSON());
    prevSalesData.forEach((sale) => {
      const payments = (sale.salePayments || []) as any[];
      const paidAmount = payments.reduce((sum, p) => sum + Number(p.amount), 0);
      const existing = prevLocationRevenue.get(sale.locationId) || 0;
      prevLocationRevenue.set(sale.locationId, existing + paidAmount);
    });

    const locationComparison = topPerformingLocations.map((loc) => {
      const prevRevenue = prevLocationRevenue.get(loc.locationId) || 0;
      const growth = prevRevenue > 0 ? ((loc.totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;
      return {
        locationId: loc.locationId,
        locationName: loc.locationName,
        currentRevenue: loc.totalRevenue,
        previousRevenue: prevRevenue,
        growth: Number(growth),
        growthTrend: growth > 0 ? 'UP' : growth < 0 ? 'DOWN' : 'STABLE',
      };
    });

    // Performance by location type
    const typePerformance = new Map<string, {
      locations: number;
      revenue: number;
      profit: number;
      sales: number
    }>();

    topPerformingLocations.forEach((loc) => {
      const type = loc.locationType;
      const existing = typePerformance.get(type) || {
        locations: 0,
        revenue: 0,
        profit: 0,
        sales: 0,
      };
      existing.locations += 1;
      existing.revenue += loc.totalRevenue;
      existing.profit += Number(loc.profit);
      existing.sales += loc.totalSales;
      typePerformance.set(type, existing);
    });

    const performanceByType = Array.from(typePerformance.entries()).map(([type, data]) => ({
      type,
      locations: data.locations,
      revenue: data.revenue,
      profit: data.profit,
      sales: data.sales,
      averageRevenuePerLocation: data.locations > 0 ? data.revenue / data.locations : 0,
    }));

    // Daily performance trends
    const dailyTrends = new Map<string, {
      revenue: number;
      sales: number;
      locations: Set<string>
    }>();

    salesData.forEach((sale) => {
      const dateKey = new Date(sale.createdAt).toISOString().split('T')[0];
      const existing = dailyTrends.get(dateKey) || {
        revenue: 0,
        sales: 0,
        locations: new Set<string>(),
      };
      const payments = (sale.salePayments || []) as any[];
      const paidAmount = payments.reduce((sum, p) => sum + Number(p.amount), 0);
      existing.revenue += paidAmount;
      existing.sales += 1;
      existing.locations.add(sale.locationId);
      dailyTrends.set(dateKey, existing);
    });

    const performanceTrends = Array.from(dailyTrends.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, data]) => ({
        date,
        revenue: data.revenue,
        sales: data.sales,
        activeLocations: data.locations.size,
        averageRevenuePerLocation: data.locations.size > 0 ? data.revenue / data.locations.size : 0,
      }));

    return {
      period: dto.period,
      summary: {
        totalLocations: locations.length,
        activeLocations: locationPerformance.size,
        totalRevenue,
        totalProfit,
        totalProfitMargin: totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100) : 0,
        averageRevenuePerLocation: Number(averageRevenuePerLocation),
        totalSales: topPerformingLocations.reduce((sum, loc) => sum + loc.totalSales, 0),
        totalJobsheets: topPerformingLocations.reduce((sum, loc) => sum + loc.jobsheets, 0),
      },
      topPerformingLocations,
      locationComparison,
      performanceByType,
      performanceTrends,
    } as any;
  }

  /**
   * Generate Jobsheet Report with Full Details
   */
  async generateJobsheetReport(dto: GenerateReportDto): Promise<any> {
    const { start, end } = this.getDateRange(dto.period, dto.startDate, dto.endDate);

    // Get all jobsheets in period
    const jobsheetWhere: any = {
      createdAt: { [Op.gte]: start, [Op.lte]: end },
    };
    if (dto.locationId) jobsheetWhere.locationId = dto.locationId;

    const jobsheets = await JobSheet.findAll({
      where: jobsheetWhere,
      include: [
        {
          model: Customer,
          as: 'customer',
          include: [
            {
              model: Location,
              as: 'location'
            }
          ]
        },
        {
          model: User,
          as: 'assignedTo',
          include: [{ model: Staff, as: 'staff' }]
        },
        {
          model:Payment,
         as: 'payments'
        },
        {
          model: User,
          as: 'createdBy'
        },
        {
          model: Location,
          as: 'location'
        }
      ]
    });

    const jobsheetsData = jobsheets.map(j => j.toJSON());
    const jobsheetIncome = jobsheetsData.reduce((sum, job) => {
      return sum + job.payments.reduce((pSum: number, p: any) => pSum + Number(p.amount), 0);
    }, 0);
    const totalbalanceAmounts = jobsheetsData.reduce((sum, job) => {
      return sum + job.location.balanceAmount;
    }, 0);

    // console.log(JSON.stringify(jobsheetsData, null, 2))
    // Calculate status-wise breakdown
    const statusBreakdown = new Map<string, {
      count: number;
      revenue: number;
      avgCompletionTime: number;
      completionTimes: number[];
    }>();

    jobsheetsData.forEach((job) => {
      const status = job.status;
      const existing = statusBreakdown.get(status) || {
        count: 0,
        revenue: 0,
        avgCompletionTime: 0,
        completionTimes: [],
      };
      existing.count += 1;
      if (status === 'COMPLETED') {

        existing.revenue += Number(job.totalCost) || 0;
        if (job.completedAt) {
          const completionTime = Math.floor(
            (new Date(job.completedAt).getTime() - new Date(job.createdAt).getTime()) / (1000 * 60 * 60)
          ); // hours
          existing.completionTimes.push(completionTime);
        }
      }
      statusBreakdown.set(status, existing);
    });

    // Calculate average completion times
    statusBreakdown.forEach((data) => {
      if (data.completionTimes.length > 0) {
        data.avgCompletionTime = data.completionTimes.reduce((sum, time) => sum + time, 0) / data.completionTimes.length;
      }
    });

    const statusSummary = Array.from(statusBreakdown.entries()).map(([status, data]) => ({
      status,
      count: data.count,
      revenue: data.revenue,
      avgCompletionTime: Number(data.avgCompletionTime),
      percentage: ((data.count / jobsheetsData.length) * 100) + '%',
    }));

    // Technician performance
    const technicianPerformance = new Map<string, {
      technician: any;
      totalJobs: number;
      completedJobs: number;
      revenue: number;
      avgCompletionTime: number;
      completionTimes: number[];
      customers: Set<string>;
    }>();

    jobsheetsData.forEach((job) => {
      if (job.assignedTo) {
        const key = job.assignedTo.id;
        const existing = technicianPerformance.get(key) || {
          technician: job.assignedTo,
          totalJobs: 0,
          completedJobs: 0,
          revenue: 0,
          avgCompletionTime: 0,
          completionTimes: [],
          customers: new Set<string>(),
        };
        existing.totalJobs += 1;
        if (job.status === 'COMPLETED') {
          existing.completedJobs += 1;
          existing.revenue += Number(job.totalCost) || 0;
          if (job.completedAt) {
            const completionTime = Math.floor(
              (new Date(job.completedAt).getTime() - new Date(job.createdAt).getTime()) / (1000 * 60 * 60)
            );
            existing.completionTimes.push(completionTime);
          }
        }
        if (job.customerId) {
          existing.customers.add(job.customerId);
        }
        technicianPerformance.set(key, existing);
      }
    });

    // Calculate averages
    technicianPerformance.forEach((data) => {
      if (data.completionTimes.length > 0) {
        data.avgCompletionTime = data.completionTimes.reduce((sum, time) => sum + time, 0) / data.completionTimes.length;
      }
    });

    const topTechnicians = Array.from(technicianPerformance.values())
      .sort((a, b) => b.completedJobs - a.completedJobs)
      .slice(0, 10)
      .map((item) => ({
        technicianId: item.technician.id,
        technicianName: item.technician.name,
        email: item.technician.email,
        totalJobs: item.totalJobs,
        completedJobs: item.completedJobs,
        completionRate: ((item.completedJobs / item.totalJobs) * 100) + '%',
        revenue: item.revenue,
        avgCompletionTime: Number(item.avgCompletionTime),
        uniqueCustomers: item.customers.size,
      }));

    // Customer analysis
    const customerJobsheets = new Map<string, {
      customer: any;
      totalJobs: number;
      completedJobs: number;
      totalSpent: number;
      lastJobDate: Date;
    }>();

    jobsheetsData.forEach((job) => {
      if (job.customer) {
        const key = job.customerId;
        const jobDate = new Date(job.createdAt);
        const existing = customerJobsheets.get(key) || {
          customer: job.customer,
          totalJobs: 0,
          completedJobs: 0,
          totalSpent: 0,
          lastJobDate: jobDate,
        };
        existing.totalJobs += 1;
        if (job.status === 'COMPLETED') {
          existing.completedJobs += 1;
          existing.totalSpent += Number(job.totalCost) || 0;
        }
        if (jobDate > existing.lastJobDate) {
          existing.lastJobDate = jobDate;
        }
        customerJobsheets.set(key, existing);
      }
    });

    const topCustomers = Array.from(customerJobsheets.values())
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 20)
      .map((item) => ({
        customerId: item.customer.id,
        customerName: item.customer.name,
        phone: item.customer.phone,
        email: item.customer.email,
        totalJobs: item.totalJobs,
        completedJobs: item.completedJobs,
        totalSpent: item.totalSpent,
        averageJobValue: item.completedJobs > 0 ? item.totalSpent / item.completedJobs : 0,
        lastJobDate: item.lastJobDate.toISOString(),
      }));

    // Location performance
    const locationPerformance = new Map<string, {
      location: any;
      totalJobs: number;
      completedJobs: number;
      revenue: number;
      technicians: Set<string>;
    }>();

    jobsheetsData.forEach((job) => {
      if (job.location) {
        const key = job.locationId;
        const existing = locationPerformance.get(key) || {
          location: job.location,
          totalJobs: 0,
          completedJobs: 0,
          revenue: 0,
          technicians: new Set<string>(),
        };
        existing.totalJobs += 1;
        if (job.status === 'COMPLETED') {
          existing.completedJobs += 1;
          existing.revenue += Number(job.totalCost) || 0;
        }
        if (job.assignedToId) {
          existing.technicians.add(job.assignedToId);
        }
        locationPerformance.set(key, existing);
      }
    });

    const locationSummary = Array.from(locationPerformance.values())
      .sort((a, b) => b.revenue - a.revenue)
      .map((item) => ({
        locationId: item.location.id,
        locationName: item.location.name,
        locationType: item.location.locationType,
        totalJobs: item.totalJobs,
        completedJobs: item.completedJobs,
        completionRate: item.totalJobs > 0 ? ((item.completedJobs / item.totalJobs) * 100) + '%' : '0%',
        revenue: item.revenue,
        techniciansCount: item.technicians.size,
        avgRevenuePerJob: item.completedJobs > 0 ? item.revenue / item.completedJobs : 0,
      }));

    // Daily trends
    const dailyTrends = new Map<string, {
      created: number;
      completed: number;
      revenue: number;
      technicians: Set<string>;
    }>();

    jobsheetsData.forEach((job) => {
      const dateKey = new Date(job.createdAt).toISOString().split('T')[0];
      const existing = dailyTrends.get(dateKey) || {
        created: 0,
        completed: 0,
        revenue: 0,
        technicians: new Set<string>(),
      };
      existing.created += 1;
      if (job.status === 'COMPLETED') {
        existing.completed += 1;
        existing.revenue += Number(job.totalCost) || 0;
      }
      if (job.assignedToId) {
        existing.technicians.add(job.assignedToId);
      }
      dailyTrends.set(dateKey, existing);
    });

    const trendsByDay = Array.from(dailyTrends.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, data]) => ({
        date,
        created: data.created,
        completed: data.completed,
        revenue: data.revenue,
        completionRate: data.created > 0 ? ((data.completed / data.created) * 100) + '%' : '0%',
        activeTechnicians: data.technicians.size,
      }));

    // Revenue breakdown
    const totalRevenue = jobsheetIncome;

    const avgJobValue = jobsheetsData.filter(j => j.status === 'COMPLETED').length > 0
      ? totalRevenue / jobsheetsData.filter(j => j.status === 'COMPLETED').length
      : 0;

    // Top revenue generating jobsheets
    const topJobsheets = jobsheetsData
      .filter(j => j.status === 'COMPLETED')
      .sort((a, b) => (Number(b.totalCost) || 0) - (Number(a.totalCost) || 0))
      .slice(0, 20)
      .map((job) => ({
        jobNumber: job.jobNumber,
        customerName: job.customer?.name || 'Unknown',
        customerPhone: job.customer?.phone || 'N/A',
        technicianName: job.assignedTo?.name || 'Unassigned',
        totalCost: Number(job.totalCost) || 0,
        status: job.status,
        priority: job.priority,
        deviceType: job.deviceType,
        location: job.location?.name || 'N/A',
        createdAt: job.createdAt,
        completedAt: job.completedAt,
        completionTime: job.completedAt
          ? Math.floor((new Date(job.completedAt).getTime() - new Date(job.createdAt).getTime()) / (1000 * 60 * 60))
          : null,
      }));

    // Priority analysis
    const priorityBreakdown = new Map<string, { count: number; completed: number; revenue: number }>();
    jobsheetsData.forEach((job) => {
      const priority = job.priority || 'NORMAL';
      const existing = priorityBreakdown.get(priority) || { count: 0, completed: 0, revenue: 0 };
      existing.count += 1;
      if (job.status === 'COMPLETED') {
        existing.completed += 1;
        existing.revenue += Number(job.totalCost) || 0;
      }
      priorityBreakdown.set(priority, existing);
    });

    const prioritySummary = Array.from(priorityBreakdown.entries()).map(([priority, data]) => ({
      priority,
      count: data.count,
      completed: data.completed,
      completionRate: data.count > 0 ? ((data.completed / data.count) * 100) + '%' : '0%',
      revenue: data.revenue,
      percentage: ((data.count / jobsheetsData.length) * 100) + '%',
    }));

    // Device type analysis
    const deviceTypeBreakdown = new Map<string, { count: number; revenue: number }>();
    jobsheetsData.forEach((job) => {
      if (job.deviceType) {
        const existing = deviceTypeBreakdown.get(job.deviceType) || { count: 0, revenue: 0 };
        existing.count += 1;
        if (job.status === 'COMPLETED') {
          existing.revenue += Number(job.totalCost) || 0;
        }
        deviceTypeBreakdown.set(job.deviceType, existing);
      }
    });

    const deviceTypeSummary = Array.from(deviceTypeBreakdown.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .map(([deviceType, data]) => ({
        deviceType,
        count: data.count,
        revenue: data.revenue,
        avgRevenue: data.count > 0 ? data.revenue / data.count : 0,
        percentage: ((data.count / jobsheetsData.length) * 100) + '%',
      }));

    const completedJobs = jobsheetsData.filter(j => j.status === 'COMPLETED').length;
    const pendingJobs = jobsheetsData.filter(j => j.status === 'PENDING').length;
    const inProgressJobs = jobsheetsData.filter(j => j.status === 'IN_PROGRESS').length;
    const overallCompletionRate = jobsheetsData.length > 0
      ? ((completedJobs / jobsheetsData.length) * 100)
      : '0';

    return {
      period: dto.period,
      summary: {
        totalJobsheets: jobsheetsData.length,
        completedJobs,
        pendingJobs,
        inProgressJobs,
        completionRate: overallCompletionRate + '%',
        totalRevenue,
        avgJobValue: Number(avgJobValue),
        uniqueCustomers: customerJobsheets.size,
        activeTechnicians: technicianPerformance.size,
      },
      statusSummary,
      prioritySummary,
      deviceTypeSummary,
      topTechnicians,
      topCustomers,
      topJobsheets,
      locationSummary,
      trendsByDay,
    };
  }
}

export default new ReportsService();
