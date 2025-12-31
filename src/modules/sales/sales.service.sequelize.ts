import { AppError } from '../../shared/utils/app-error';
import {
  Sale,
  SaleItem,
  Product,
  Customer,
  Location,
  User,
  SalePayment,
  SaleRefund,
  ProductInventory,
  JobSheet,
  Payment,
} from '../../models';
import { Op, fn, col, literal, Sequelize } from 'sequelize';
import {
  SalesQueryDTO,
  SalesOverviewDTO,
  SalesTrendDTO,
  TopProductDTO,
  LocationPerformanceDTO,
  StaffPerformanceDTO,
  PaymentMethodStatsDTO,
  RevenueBreakdownDTO,
  ProfitAnalysisDTO,
  SalesDetailDTO,
  CustomerInsightsDTO,
  DashboardDTO,
} from './sales.dto';
import { getJobSheetPayments } from 'modules/jobsheet/jobsheet.controller';

export class SalesService {
  /**
   * Get comprehensive dashboard data (aggregated from multiple endpoints)
   */
  async getDashboard(query: SalesQueryDTO): Promise<DashboardDTO> {
    const { startDate, endDate, locationId, period } = query;

    // Calculate date range based on period
    let start: Date;
    let end: Date = new Date();

    if (period) {
      const now = new Date();
      switch (period) {
        case 'today':
          start = new Date(now.setHours(0, 0, 0, 0));
          break;
        case 'yesterday':
          start = new Date(now.setDate(now.getDate() - 1));
          start.setHours(0, 0, 0, 0);
          end = new Date(start);
          end.setHours(23, 59, 59, 999);
          break;
        case 'week':
          start = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'month':
          start = new Date(now.setMonth(now.getMonth() - 1));
          break;
        case 'year':
          start = new Date(now.setFullYear(now.getFullYear() - 1));
          break;
        default:
          start = new Date(now.setDate(now.getDate() - 30));
      }
    } else {
      start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
      end = endDate ? new Date(endDate) : new Date();
    }

    // Build query object for sub-methods
    const queryWithDates: SalesQueryDTO = {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      locationId,
      limit: 10,
    };

    // Fetch all data in parallel
    const [
      overview,
      trends,
      topProducts,
      branches,
      staff,
      paymentMethods,
      recentSales,
      previousPeriodOverview,
    ] = await Promise.all([
      this.getSalesOverview(queryWithDates),
      this.getSalesTrends(queryWithDates),
      this.getTopProducts(queryWithDates),
      this.getLocationPerformance(queryWithDates),
      this.getStaffPerformance(queryWithDates),
      this.getPaymentMethodStats(queryWithDates),
      this.getRecentSales(queryWithDates),
      this.getPreviousPeriodOverview(start, end, locationId),
    ]);

    // Calculate growth metrics
    const salesGrowth = previousPeriodOverview.totalOrders > 0
      ? ((overview.totalOrders - previousPeriodOverview.totalOrders) / previousPeriodOverview.totalOrders) * 100
      : 0;

    const revenueGrowth = previousPeriodOverview.totalRevenue > 0
      ? ((overview.totalRevenue - previousPeriodOverview.totalRevenue) / previousPeriodOverview.totalRevenue) * 100
      : 0;

    const aovGrowth = previousPeriodOverview.averageOrderValue > 0
      ? ((overview.averageOrderValue - previousPeriodOverview.averageOrderValue) / previousPeriodOverview.averageOrderValue) * 100
      : 0;

    const profitGrowth = previousPeriodOverview.totalProfit > 0
      ? ((overview.totalProfit - previousPeriodOverview.totalProfit) / previousPeriodOverview.totalProfit) * 100
      : 0;

    // Calculate profit margin
    const profitMargin = overview.totalRevenue > 0
      ? (overview.totalProfit / overview.totalRevenue) * 100
      : 0;

    // Map trends data
    const mappedTrends = trends.map(t => ({
      date: t.date,
      salesCount: t.orders,
      revenue: t.revenue,
      avgOrderValue: t.orders > 0 ? t.revenue / t.orders : 0,
    }));

    // Map locations data
    const mappedLocations = branches.map((b, index) => ({
      locationId: b.locationId,
      locationName: b.locationName,
      salesCount: b.orders,
      revenue: b.revenue,
      growth: index === 0 ? revenueGrowth : 0, // Apply growth to top location
    }));

    // Map staff data
    const mappedStaff = staff.map(s => ({
      staffId: s.staffId,
      staffName: s.staffName,
      salesCount: s.ordersHandled,
      revenue: s.revenue,
      commission: s.revenue * 0.05, // 5% commission example
    }));

    // Map payment methods
    const mappedPaymentMethods = paymentMethods.map(pm => ({
      method: pm.paymentMethod,
      count: pm.count,
      amount: pm.totalAmount,
      percentage: pm.percentage,
    }));

    return {
      summary: {
        totalSales: overview.totalOrders,
        totalRevenue: overview.totalRevenue,
        totalPaid: overview.totalRevenue, // Assuming all completed sales are paid
        totalOutstanding: 0, // Can be calculated from pending payments if needed
        avgOrderValue: overview.averageOrderValue,
        profitMargin,
      },
      trends: mappedTrends,
      topLocations: mappedLocations,
      topStaff: mappedStaff,
      topProducts: topProducts,
      paymentMethodBreakdown: mappedPaymentMethods,
      recentSales: recentSales.map(sale => ({
        id: sale.jobSheetId,
        invoiceNumber: sale.jobNumber,
        customerName: sale.customerName,
        locationName: sale.locationName,
        totalAmount: sale.totalAmount,
        paymentStatus: sale.status,
        date: sale.createdAt.toISOString(),
      })),
      growth: {
        salesGrowth: salesGrowth,
        revenueGrowth: revenueGrowth,
        aovGrowth: aovGrowth,
        profitGrowth: profitGrowth,
      },
    };
  }

  /**
   * Get sales overview with key metrics
   */
  async getSalesOverview(query: SalesQueryDTO): Promise<SalesOverviewDTO> {
    const { startDate, endDate, locationId } = query;

    const whereClause: any = {
      createdAt: {
        [Op.between]: [new Date(startDate!), new Date(endDate!)],
      },
    };

    if (locationId) {
      whereClause.locationId = locationId;
    }

    const [salesData] = await Sale.findAll({
      attributes: [
        [fn('COUNT', col('Sale.id')), 'totalOrders'],
        [fn('SUM', col('Sale.total_amount')), 'totalRevenue'],
        [fn('AVG', col('Sale.total_amount')), 'averageOrderValue'],
      ],
      where: whereClause,
      raw: true,
    });

    // Get total refunds for the period to calculate net revenue
    const refundWhereClause: any = {
      refundDate: {
        [Op.between]: [new Date(startDate!), new Date(endDate!)],
      },
    };

    // If locationId is provided, join with Sale to filter by location
    let totalRefunds = 0;
    if (locationId) {
      const refunds = await SaleRefund.findAll({
        attributes: [[fn('SUM', col('SaleRefund.amount')), 'totalRefunds']],
        where: refundWhereClause,
        include: [{
          model: Sale,
          as: 'sale',
          attributes: [],
          where: { locationId },
          required: true,
        }],
        raw: true,
      });
     
      totalRefunds = parseFloat((refunds[0] as any)?.totalRefunds || 0);
    } else {
      totalRefunds = parseFloat(await SaleRefund.sum('amount', { where: refundWhereClause }) as any || 0);
    }

    

    const grossRevenue = parseFloat((salesData as any).totalRevenue) || 0;
    const netRevenue = grossRevenue - totalRefunds;

    return {
      totalOrders: parseInt((salesData as any).totalOrders) || 0,
      totalRevenue: netRevenue, // Net revenue after refunds
      grossRevenue: grossRevenue, // Gross revenue before refunds
      totalRefunds: totalRefunds, // Total refunds
      averageOrderValue: parseFloat((salesData as any).averageOrderValue) || 0,
      totalProfit: 0, // Profit calculation not available in current schema
      periodStart: new Date(startDate!),
      periodEnd: new Date(endDate!),
    };
  }

  /**
   * Get sales trends over time
   */
  async getSalesTrends(query: SalesQueryDTO): Promise<SalesTrendDTO[]> {
    const { startDate, endDate, locationId, period = 'month' } = query;

    let dateFormat: string;

    // PostgreSQL TO_CHAR date formats
    switch (period) {
      case 'today':
      case 'yesterday':
      case 'week':
        dateFormat = 'YYYY-MM-DD';
        break;
      case 'month':
        dateFormat = 'YYYY-MM';
        break;
      case 'year':
        dateFormat = 'YYYY';
        break;
      case 'custom':
        dateFormat = 'YYYY-MM-DD';
        break;
      default:
        dateFormat = 'YYYY-MM-DD';
    }

    const whereClause: any = {
      createdAt: {
        [Op.between]: [new Date(startDate!), new Date(endDate!)],
      },
    };

    if (locationId) {
      whereClause.locationId = locationId;
    }

    const trends = await Sale.findAll({
      attributes: [
        [fn('TO_CHAR', col('Sale.created_at'), dateFormat), 'date'],
        [fn('COUNT', col('Sale.id')), 'orders'],
        [fn('SUM', col('Sale.total_amount')), 'revenue'],
      ],
      where: whereClause,
      group: [fn('TO_CHAR', col('Sale.created_at'), dateFormat)],
      order: [[fn('TO_CHAR', col('Sale.created_at'), dateFormat), 'ASC']],
      raw: true,
    });

    return trends.map((trend: any) => ({
      date: trend.date,
      orders: parseInt(trend.orders),
      revenue: parseFloat(trend.revenue),
      profit: 0, // Profit calculation not available
    }));
  }

  /**
   * Get top selling products
   */
  async getTopProducts(query: SalesQueryDTO): Promise<TopProductDTO[]> {
    const { startDate, endDate, locationId, limit = 10 } = query;

    const whereClause: any = {
      createdAt: {
        [Op.between]: [new Date(startDate!), new Date(endDate!)],
      },
    };

    if (locationId) {
      whereClause.locationId = locationId;
    }

    const topProducts = await SaleItem.findAll({
      attributes: [
        'productId',
        [fn('SUM', col('SaleItem.quantity')), 'quantity'],
        [fn('SUM', col('SaleItem.subtotal')), 'revenue'],
        [fn('COUNT', col('SaleItem.id')), 'orderCount'],
      ],
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['name', 'sku', 'cost_price', 'unit_price'],
        },
        {
          model: Sale,
          as: 'sale',
          attributes: [],
          where: whereClause,
        },
      ],
      group: ['SaleItem.product_id', 'product.id', 'product.name', 'product.sku','product.cost_price','product.unit_price'],
      order: [[fn('SUM', col('SaleItem.subtotal')), 'DESC']],
      limit,
      raw: true,
    });

    const profitMargin = (costPrice: number, unitPrice: number): number => {
      if (!unitPrice || unitPrice === 0) {
        return 0; // Avoid division by zero
      }
      const estimatedCost = (unitPrice - costPrice) / unitPrice;
      console.log('Cost Price:', costPrice);
      console.log('Unit Price:', unitPrice);
      console.log('Estimated Cost:', estimatedCost);
      return estimatedCost;
    };

   

    return topProducts.map((product: any) => {
      const costPrice = parseFloat(product['product.cost_price']) || 0;
      const unitPrice = parseFloat(product['product.unit_price']) || 0;
      const revenue = parseFloat(product.revenue) || 0;
      return {
        productId: product.productId,
        productName: product['product.name'],
        quantitySold: parseInt(product.quantity) || 0,
        revenue: revenue,
        profit: revenue * profitMargin(costPrice, unitPrice), // Estimated profit calculation
      };
    });
  }

  /**
   * Get location performance metrics
   */
  async getLocationPerformance(query: SalesQueryDTO): Promise<LocationPerformanceDTO[]> {
    const { startDate, endDate, limit = 10 } = query;

    const locations = await Sale.findAll({
      attributes: [
        'locationId',
        [fn('COUNT', col('Sale.id')), 'orders'],
        [fn('SUM', col('Sale.total_amount')), 'revenue'],
        [fn('AVG', col('Sale.total_amount')), 'avgOrderValue'],
      ],
      include: [
        {
          model: Location,
          as: 'location',
          attributes: ['name'],
        },
      ],
      where: {
        createdAt: {
          [Op.between]: [new Date(startDate || new Date().toISOString()), new Date(endDate || new Date().toISOString())],
        },
      },
      group: ['Sale.location_id', 'location.id', 'location.name'],
      order: [[fn('SUM', col('Sale.total_amount')), 'DESC']],
      limit,
      raw: true,
    });

    return locations.map((location: any) => ({
      locationId: location.locationId,
      locationName: location['location.name'],
      revenue: parseFloat(location.revenue),
      orders: parseInt(location.orders),
      averageOrderValue: parseFloat(location.avgOrderValue),
    }));
  }

  /**
   * Get staff performance metrics
   */
  async getStaffPerformance(query: SalesQueryDTO): Promise<StaffPerformanceDTO[]> {
    const { startDate, endDate, locationId, limit = 10 } = query;

    const whereClause: any = {
      createdAt: {
        [Op.between]: [new Date(startDate || new Date().toISOString()), new Date(endDate || new Date().toISOString())],
      },
    };

    if (locationId) {
      whereClause.locationId = locationId;
    }

    const staff = await Sale.findAll({
      attributes: [
        'soldById',
        [fn('COUNT', col('Sale.id')), 'ordersHandled'],
        [fn('SUM', col('Sale.total_amount')), 'revenue'],
        [fn('AVG', col('Sale.total_amount')), 'avgOrderValue'],
      ],
      include: [
        {
          model: User,
          as: 'soldBy',
          attributes: ['name'],
        },
      ],
      where: whereClause,
      group: ['Sale.sold_by_id', 'soldBy.id', 'soldBy.name'],
      order: [[fn('SUM', col('Sale.total_amount')), 'DESC']],
      limit,
      raw: true,
    });

    return staff.map((s: any) => ({
      staffId: s.soldById,
      staffName: s['soldBy.name'] || 'Unknown',
      ordersHandled: parseInt(s.ordersHandled),
      revenue: parseFloat(s.revenue),
      averageOrderValue: parseFloat(s.avgOrderValue),
    }));
  }

  /**
   * Get payment method statistics
   */
  async getPaymentMethodStats(query: SalesQueryDTO): Promise<PaymentMethodStatsDTO[]> {
    const { startDate, endDate, locationId } = query;

    const whereClause: any = {
      createdAt: {
        [Op.between]: [new Date(startDate || new Date().toISOString()), new Date(endDate || new Date().toISOString())],
      },
    };

    if (locationId) {
      whereClause.locationId = locationId;
    }

    const paymentStats = await SalePayment.findAll({
      attributes: [
        'payment_method',
        [fn('COUNT', col('SalePayment.id')), 'transaction_count'],
        [fn('SUM', col('SalePayment.amount')), 'total_amount'],
      ],
      include: [
        {
          model: Sale,
          as: 'sale',
          attributes: [],
          where: whereClause,
        },
      ],
      group: ['SalePayment.payment_method'],
      order: [[fn('SUM', col('SalePayment.amount')), 'DESC']],
      raw: true,
    });

    const totalAmount = paymentStats.reduce((sum, stat: any) => sum + parseFloat(stat.totalAmount), 0);

    return paymentStats.map((stat: any) => ({
      paymentMethod: stat.paymentMethod,
      totalAmount: parseFloat(stat.totalAmount),
      count: parseInt(stat.transactionCount),
      percentage: totalAmount > 0 ? (parseFloat(stat.totalAmount) / totalAmount) * 100 : 0,
    }));
  }

  /**
   * Get revenue breakdown by categories
   */
  async getRevenueBreakdown(query: SalesQueryDTO): Promise<RevenueBreakdownDTO> {
    const { startDate, endDate, locationId } = query;

    const whereClause: any = {
      'Sale.created_at': {
        [Op.between]: [new Date(startDate || new Date().toISOString()), new Date(endDate || new Date().toISOString())],
      },
    };

    if (locationId) {
      whereClause['Sale.location_id'] = locationId;
    }

    // Get revenue by product categories
    const categoryRevenue = await SaleItem.findAll({
      attributes: [
        [col('product.category_id'), 'category_id'],
        [fn('SUM', col('SaleItem.subtotal')), 'revenue'],
      ],
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['category_id'],
        },
        {
          model: Sale,
          as: 'sale',
          attributes: [],
          where: whereClause,
        },
      ],
      group: ['product.category_id'],
      order: [[fn('SUM', col('SaleItem.subtotal')), 'DESC']],
      raw: true,
    });

    // Get revenue by location types
    const locationRevenue = await Sale.findAll({
      attributes: [
        [col('location.location_type'), 'location_type'],
        [fn('SUM', col('Sale.total_amount')), 'revenue'],
      ],
      include: [
        {
          model: Location,
          as: 'location',
          attributes: ['locationType'],
        },
      ],
      where: {
        createdAt: {
          [Op.between]: [new Date(startDate || new Date().toISOString()), new Date(endDate || new Date().toISOString())],
        },
        ...(locationId && { locationId }),
      },
      group: ['location.location_type'],
      raw: true,
    });

    // Calculate totals (simplified - would need more complex logic for labour/parts/products breakdown)
    const totalRevenue = categoryRevenue.reduce((sum, cat: any) => sum + parseFloat(cat.revenue), 0);

    return {
      labourRevenue: 0, // Would need separate logic to identify labour items
      partsRevenue: totalRevenue * 0.6, // Placeholder - would need proper categorization
      productsRevenue: totalRevenue * 0.4, // Placeholder - would need proper categorization
      totalRevenue,
    };
  }

  /**
   * Get profit analysis
   */
  async getProfitAnalysis(query: SalesQueryDTO): Promise<ProfitAnalysisDTO> {
    const { startDate, endDate, locationId } = query;

    const whereClause: any = {
      createdAt: {
        [Op.between]: [new Date(startDate || new Date().toISOString()), new Date(endDate || new Date().toISOString())],
      },
    };

    if (locationId) {
      whereClause.locationId = locationId;
    }

    const [profitData] = await SaleItem.findAll({
      attributes: [
        [fn('SUM', col('SaleItem.subtotal')), 'totalRevenue'],
        [literal('0'), 'totalCost'],  // cost_price column doesn't exist
      ],
      include: [
        {
          model: Sale,
          as: 'sale',
          attributes: [],
          where: whereClause,
        },
      ],
      raw: true,
    });

    const totalRevenue = parseFloat((profitData as any).totalRevenue) || 0;
    const totalCost = parseFloat((profitData as any).totalCost) || 0;
    const grossProfit = totalRevenue - totalCost;

    return {
      totalRevenue,
      totalCost,
      grossProfit,
      profitMargin: totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0,
    };
  }

  /**
   * Get detailed sales data
   */
  async getSalesDetails(query: SalesQueryDTO): Promise<SalesDetailDTO[]> {
    const { startDate, endDate, locationId, limit = 50, page = 1 } = query;

    // Set default date range if not provided (last 30 days)
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(end.getDate() - 30));

    const whereClause: any = {
      createdAt: {
        [Op.between]: [start, end],
      },
    };

    if (locationId) {
      whereClause.locationId = locationId;
    }

    // Calculate offset for pagination
    const offset = (page - 1) * limit;

    // Fetch POS Sales
    const posSales = await Sale.findAll({
      include: [
        {
          model: SaleItem,
          as: 'saleItems',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['name', 'sku'],
            },
          ],
        },
        {
          model: Customer,
          as: 'customer',
          attributes: ['name', 'phone'],
        },
        {
          model: Location,
          as: 'location',
          attributes: ['name'],
        },
        {
          model: User,
          as: 'soldBy',
          attributes: ['name'],
        },
        {
          model: SalePayment,
          as: 'salePayments',
          attributes: ['paymentMethod', 'amount'],
        },
      ],
      where: whereClause,
      order: [['createdAt', 'DESC']],
      limit: Math.ceil(limit / 2), // Split limit between POS and JobSheets
      offset: Math.floor(offset / 2),
    });

    // Fetch Job Sheets with payments
    const jobSheets = await JobSheet.findAll({
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['name', 'phone'],
        },
        {
          model: Location,
          as: 'location',
          attributes: ['name'],
        },
        {
          model: User,
          as: 'assignedTo',
          attributes: ['name'],
        },
        {
          model: Payment,
          as: 'payments',
          attributes: ['amount', 'paymentDate'],
        },
      ],
      where: whereClause,
      order: [['createdAt', 'DESC']],
      limit: Math.ceil(limit / 2), // Split limit between POS and JobSheets
      offset: Math.floor(offset / 2),
    });

    // Map POS sales
    const posSalesDetails: SalesDetailDTO[] = posSales.map((sale: any) => ({
      jobSheetId: sale.id,
      jobNumber: sale.saleNumber || sale.id.substring(0, 8),
      customerName: sale.customer?.name || sale.customerName || 'Walk-in Customer',
      locationName: sale.location?.name || 'Unknown Location',
      staffName: sale.soldBy?.name || 'Unknown',
      totalAmount: Number(sale.totalAmount),
      paidAmount: sale.salePayments?.reduce((sum: number, payment: any) => sum + Number(payment.amount), 0) || 0,
      status: sale.status,
      createdAt: sale.createdAt,
      completedAt: sale.updatedAt,
      type: 'POS' as const,
    }));

    // Map Job Sheets
    const jobSheetDetails: SalesDetailDTO[] = jobSheets.map((jobSheet: any) => ({
      jobSheetId: jobSheet.id,
      jobNumber: jobSheet.jobNumber,
      customerName: jobSheet.customer?.name || 'Unknown Customer',
      locationName: jobSheet.location?.name || 'Unknown Location',
      staffName: jobSheet.assignedTo?.name || 'Unassigned',
      totalAmount: Number(jobSheet.totalAmount),
      paidAmount: jobSheet.payments?.reduce((sum: number, payment: any) => sum + Number(payment.amount), 0) || 0,
      status: jobSheet.status,
      createdAt: jobSheet.createdAt,
      completedAt: jobSheet.completedAt,
      type: 'JobSheet' as const,
    }));

    // Combine and sort by date
    const allSales = [...posSalesDetails, ...jobSheetDetails];
    allSales.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return allSales.slice(0, limit);
  }

  /**
   * Get customer insights
   */
  async getCustomerInsights(query: SalesQueryDTO): Promise<CustomerInsightsDTO> {
    const { startDate, endDate, locationId } = query;

    const whereClause: any = {
      createdAt: {
        [Op.between]: [new Date(startDate || new Date().toISOString()), new Date(endDate || new Date().toISOString())],
      },
    };

    if (locationId) {
      whereClause.locationId = locationId;
    }

    // Top customers by revenue
    const topCustomers = await Sale.findAll({
      attributes: [
        'customerId',
        [fn('COUNT', col('Sale.id')), 'orderCount'],
        [fn('SUM', col('Sale.total_amount')), 'totalSpent'],
      ],
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['name'],
        },
      ],
      where: whereClause,
      group: ['Sale.customer_id', 'customer.id', 'customer.name'],
      order: [[fn('SUM', col('Sale.total_amount')), 'DESC']],
      limit: 10,
      raw: true,
    });

    // Get total customers count
    const totalCustomers = await Sale.count({
      where: whereClause,
      distinct: true,
      col: 'customer_id',
    });

    // Get new customers (first purchase in the period) - simplified
    const newCustomers = Math.floor(totalCustomers * 0.3); // Placeholder - would need more complex logic
    const returningCustomers = totalCustomers - newCustomers;

    // Calculate average lifetime value (simplified)
    const totalRevenue = await Sale.sum('totalAmount', { where: whereClause });
    const averageLifetimeValue = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;

    return {
      totalCustomers,
      newCustomers,
      returningCustomers,
      averageLifetimeValue,
      topCustomers: topCustomers.map((customer: any) => ({
        customerId: customer.customerId || '',
        customerName: customer['customer.name'] || 'Unknown Customer',
        totalSpent: parseFloat(customer.totalSpent),
        orderCount: parseInt(customer.orderCount),
      })),
    };
  }

  /**
   * Get enhanced branch dashboard (location-specific analytics)
   */
  async getBranchEnhancedDashboard(locationId: string, query: SalesQueryDTO): Promise<any> {
    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Query recent job sheet payments (today)
    const jobSheetPayments = await Payment.findAll({
      where: {
        paymentDate: {
          [Op.gte]: today,
          [Op.lt]: tomorrow,
        },
        jobSheetId: {
          [Op.ne]: null,
        },
      },
      include: [
        {
          model: JobSheet,
          as: 'jobSheet',
          required: true,
          where: locationId ? { locationId } : {},
          include: [
            {
              model: Customer,
              as: 'customer',
              attributes: ['id', 'name'],
            },
          ],
        },
      ],
      order: [['paymentDate', 'DESC']],
      limit: 10,
    });

    // Calculate today's job sheet sales
    const todayJobSheetSales = jobSheetPayments.reduce(
      (sum, payment) => sum + Number(payment.amount),
      0
    );

    // Query recent POS sales (today)
    const posSales = await Sale.findAll({
      where: {
        createdAt: {
          [Op.gte]: today,
          [Op.lt]: tomorrow,
        },
        ...(locationId && { locationId }),
      },
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'name'],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: 10,
    });

  //  Today Rfunds POS sales

  const todayRefunds = await SaleRefund.findAll({
    where: {
      refundDate: { [Op.gte]: today, [Op.lt]: tomorrow },
    },
    include: locationId ? [{ model: Sale, as: 'sale', where: { locationId } }] : [],
  });

    const totalRefunds = todayRefunds.reduce(
      (sum, refund) => sum + Number(refund.amount),
      0
    );

    // Calculate today's POS sales
    const todayPosSales = posSales.reduce(
      (sum, sale) => sum + Number(sale.totalAmount),
      0
    );

    // Get product count for location
    const productsCount = await ProductInventory.count({
      where: locationId ? { locationId } : {},
    });

    // Map recent job sheets with unique entries
    const uniqueJobSheets = new Map();
    jobSheetPayments.forEach((payment) => {
      const jobSheet = payment.jobSheet;
      if (jobSheet && !uniqueJobSheets.has(jobSheet.id)) {
        uniqueJobSheets.set(jobSheet.id, {
          id: jobSheet.id,
          jobNumber: jobSheet.jobNumber,
          customerName: jobSheet.customer?.name || 'Walk-in Customer',
          amount: Number(payment.amount),
          status: jobSheet.status,
          createdAt: payment.paymentDate.toISOString(),
        });
      }
    });

    // Map recent POS sales
    const recentPosSalesData = posSales.slice(0, 5).map((sale) => ({
      id: sale.id,
      invoiceNumber: sale.saleNumber,
      customerName: sale.customer?.name || sale.customerName || 'Walk-in Customer',
      totalAmount: Number(sale.totalAmount),
      paymentStatus: sale.paymentStatus,
      createdAt: sale.createdAt.toISOString(),
    }));

    return {
      todaySales: {
        jobsheetSales: todayJobSheetSales,
        posSales: todayPosSales - totalRefunds,
        totalSales: todayJobSheetSales + todayPosSales - totalRefunds,
        jobsheetCount: uniqueJobSheets.size,
        posCount: posSales.length,
      },
      productsCount,
      recentJobsheets: Array.from(uniqueJobSheets.values()).slice(0, 5),
      recentPosSales: recentPosSalesData,
    };
  }

  /**
   * Calculate products cost for profit analysis
   */
  async calculateProductsCost(saleItems: any[]): Promise<number> {
    let totalCost = 0;

    for (const item of saleItems) {
      const inventory = await ProductInventory.findOne({
        where: { productId: item.productId },
        order: [['created_at', 'DESC']],
      });

      if (inventory) {
        totalCost += (inventory as any).costPrice * item.quantity;
      }
    }

    return totalCost;
  }

  /**
   * Get sale by ID with full transaction details
   */
  async getSaleById(saleId: string): Promise<any> {
    // Try to find as POS Sale first
    const posSale = await Sale.findByPk(saleId, {
      include: [
        {
          model: SaleItem,
          as: 'saleItems',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'name', 'sku', 'brand', 'model'],
            },
          ],
        },
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'name', 'phone', 'email'],
        },
        {
          model: Location,
          as: 'location',
          attributes: ['id', 'name', 'locationCode'],
        },
        {
          model: User,
          as: 'soldBy',
          attributes: ['id', 'name', 'email'],
        },
        {
          model: SalePayment,
          as: 'salePayments',
          attributes: ['id', 'paymentMethod', 'amount', 'referenceNumber', 'createdAt'],
        },
      ],
    });

    if (posSale) {
      return {
        id: posSale.id,
        type: 'POS',
        invoiceNumber: posSale.saleNumber || posSale.id.substring(0, 8),
        customer: {
          id: posSale.customer?.id || null,
          name: posSale.customer?.name || posSale.customerName || 'Walk-in Customer',
          phone: posSale.customer?.phone || null,
          email: posSale.customer?.email || null,
        },
        location: {
          id: posSale.location?.id || null,
          name: posSale.location?.name || 'Unknown Location',
          locationCode: posSale.location?.locationCode || null,
        },
        soldBy: {
          id: posSale.soldBy?.id || null,
          name: posSale.soldBy?.name || 'Unknown',
          email: posSale.soldBy?.email || null,
        },
        items: posSale.saleItems?.map((item: any) => ({
          id: item.id,
          product: {
            id: item.product?.id || null,
            name: item.product?.name || 'Unknown Product',
            sku: item.product?.sku || null,
            brand: item.product?.brand || null,
            model: item.product?.model || null,
          },
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
          subtotal: Number(item.subtotal),
          discount: Number(item.discount) || 0,
        })) || [],
        transactions: posSale.salePayments?.map((payment: any) => ({
          id: payment.id,
          paymentMethod: payment.paymentMethod,
          amount: Number(payment.amount),
          transactionId: payment.referenceNumber || null,
          date: payment.createdAt,
        })) || [],
        subtotal: Number(posSale.subtotal) || 0,
        discount: Number(posSale.discount) || 0,
        tax: Number(posSale.tax) || 0,
        totalAmount: Number(posSale.totalAmount),
        paidAmount: posSale.salePayments?.reduce((sum: number, p: any) => sum + Number(p.amount), 0) || 0,
        status: posSale.status,
        paymentStatus: posSale.paymentStatus,
        createdAt: posSale.createdAt,
        updatedAt: posSale.updatedAt,
      };
    }

    // Try to find as JobSheet
    const jobSheet = await JobSheet.findByPk(saleId, {
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'name', 'phone', 'email'],
        },
        {
          model: Location,
          as: 'location',
          attributes: ['id', 'name', 'locationCode'],
        },
        {
          model: User,
          as: 'assignedTo',
          attributes: ['id', 'name', 'email'],
        },
        {
          model: Payment,
          as: 'payments',
          attributes: ['id', 'paymentMethod', 'amount', 'referenceNumber', 'paymentDate', 'createdAt'],
        },
      ],
    });

    if (jobSheet) {
      return {
        id: jobSheet.id,
        type: 'JobSheet',
        invoiceNumber: jobSheet.jobNumber,
        customer: {
          id: jobSheet.customer?.id || null,
          name: jobSheet.customer?.name || 'Unknown Customer',
          phone: jobSheet.customer?.phone || null,
          email: jobSheet.customer?.email || null,
        },
        location: {
          id: jobSheet.location?.id || null,
          name: jobSheet.location?.name || 'Unknown Location',
          locationCode: jobSheet.location?.locationCode || null,
        },
        assignedTo: {
          id: jobSheet.assignedTo?.id || null,
          name: jobSheet.assignedTo?.name || 'Unassigned',
          email: jobSheet.assignedTo?.email || null,
        },
        transactions: jobSheet.payments?.map((payment: any) => ({
          id: payment.id,
          paymentMethod: payment.paymentMethod,
          amount: Number(payment.amount),
          referenceNumber: payment.referenceNumber || null,
          paymentDate: payment.paymentDate,
          date: payment.createdAt,
        })) || [],
        issueDescription: jobSheet.issueDescription,
        diagnosisNotes: this.parseDiagnosisNotes(jobSheet.technicianRemarks),
        repairNotes: this.parseRepairNotes(jobSheet.technicianRemarks),
        estimatedCost: Number(jobSheet.estimatedCost) || 0,
        totalAmount: Number(jobSheet.totalAmount) || 0,
        paidAmount: jobSheet.payments?.reduce((sum: number, p: any) => sum + Number(p.amount), 0) || 0,
        status: jobSheet.status,
        priority: jobSheet.priority,
        createdAt: jobSheet.createdAt,
        completedDate: jobSheet.completedDate,
        updatedAt: jobSheet.updatedAt,
      };
    }

    throw new AppError(404, 'Sale not found');
  }

  // Helper methods

  private async getRecentSales(query: SalesQueryDTO): Promise<SalesDetailDTO[]> {
    const recentQuery = { ...query, limit: 5 };
    return this.getSalesDetails(recentQuery);
  }

  private async getPreviousPeriodOverview(start: Date, end: Date, locationId?: string): Promise<SalesOverviewDTO> {
    const periodLength = end.getTime() - start.getTime();
    const previousStart = new Date(start.getTime() - periodLength);
    const previousEnd = new Date(start.getTime());

    const query: SalesQueryDTO = {
      startDate: previousStart.toISOString(),
      endDate: previousEnd.toISOString(),
      locationId,
    };

    return this.getSalesOverview(query);
  }

  private parseDiagnosisNotes(technicianRemarks: string | null | undefined): string | null {
    if (!technicianRemarks) return null;
    const parts = technicianRemarks.split('\n\n');
    for (const part of parts) {
      if (part.startsWith('DIAGNOSIS:\n')) {
        return part.replace('DIAGNOSIS:\n', '');
      }
    }
    return null;
  }

  private parseRepairNotes(technicianRemarks: string | null | undefined): string | null {
    if (!technicianRemarks) return null;
    const parts = technicianRemarks.split('\n\n');
    for (const part of parts) {
      if (part.startsWith('REPAIR NOTES:\n')) {
        return part.replace('REPAIR NOTES:\n', '');
      }
    }
    return null;
  }
}

