// import sequelize from '../../shared/config/database';
// import { AppError } from '../../shared/utils/app-error';
// import {
//   SalesQueryDTO,
//   SalesOverviewDTO,
//   SalesTrendDTO,
//   TopProductDTO,
//   LocationPerformanceDTO,
//   StaffPerformanceDTO,
//   PaymentMethodStatsDTO,
//   RevenueBreakdownDTO,
//   ProfitAnalysisDTO,
//   SalesDetailDTO,
//   CustomerInsightsDTO,
//   DashboardDTO,
// } from './sales.dto';

// export class SalesService {
//   /**
//    * Get comprehensive dashboard data (aggregated from multiple endpoints)
//    */
//   async getDashboard(query: SalesQueryDTO): Promise<DashboardDTO> {
//     const { startDate, endDate, locationId, period } = query;
    
//     // Calculate date range based on period
//     let start: Date;
//     let end: Date = new Date();
    
//     if (period) {
//       const now = new Date();
//       switch (period) {
//         case 'today':
//           start = new Date(now.setHours(0, 0, 0, 0));
//           break;
//         case 'yesterday':
//           start = new Date(now.setDate(now.getDate() - 1));
//           start.setHours(0, 0, 0, 0);
//           end = new Date(start);
//           end.setHours(23, 59, 59, 999);
//           break;
//         case 'week':
//           start = new Date(now.setDate(now.getDate() - 7));
//           break;
//         case 'month':
//           start = new Date(now.setMonth(now.getMonth() - 1));
//           break;
//         case 'year':
//           start = new Date(now.setFullYear(now.getFullYear() - 1));
//           break;
//         default:
//           start = new Date(now.setDate(now.getDate() - 30));
//       }
//     } else {
//       start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
//       end = endDate ? new Date(endDate) : new Date();
//     }

//     // Build query object for sub-methods
//     const queryWithDates: SalesQueryDTO = {
//       startDate: start.toISOString(),
//       endDate: end.toISOString(),
//       locationId,
//       limit: 10,
//     };

//     // Fetch all data in parallel
//     const [
//       overview,
//       trends,
//       topProducts,
//       branches,
//       staff,
//       paymentMethods,
//       recentSales,
//       previousPeriodOverview,
//     ] = await Promise.all([
//       this.getSalesOverview(queryWithDates),
//       this.getSalesTrends(queryWithDates),
//       this.getTopProducts(queryWithDates),
//       this.getLocationPerformance(queryWithDates),
//       this.getStaffPerformance(queryWithDates),
//       this.getPaymentMethodStats(queryWithDates),
//       this.getRecentSales(queryWithDates),
//       this.getPreviousPeriodOverview(start, end, locationId),
//     ]);

//     // Calculate growth metrics
//     const salesGrowth = previousPeriodOverview.totalOrders > 0
//       ? ((overview.totalOrders - previousPeriodOverview.totalOrders) / previousPeriodOverview.totalOrders) * 100
//       : 0;
    
//     const revenueGrowth = previousPeriodOverview.totalRevenue > 0
//       ? ((overview.totalRevenue - previousPeriodOverview.totalRevenue) / previousPeriodOverview.totalRevenue) * 100
//       : 0;
    
//     const aovGrowth = previousPeriodOverview.averageOrderValue > 0
//       ? ((overview.averageOrderValue - previousPeriodOverview.averageOrderValue) / previousPeriodOverview.averageOrderValue) * 100
//       : 0;
    
//     const profitGrowth = previousPeriodOverview.totalProfit > 0
//       ? ((overview.totalProfit - previousPeriodOverview.totalProfit) / previousPeriodOverview.totalProfit) * 100
//       : 0;

//     // Calculate profit margin
//     const profitMargin = overview.totalRevenue > 0
//       ? (overview.totalProfit / overview.totalRevenue) * 100
//       : 0;

//     // Map trends data
//     const mappedTrends = trends.map(t => ({
//       date: t.date,
//       salesCount: t.orders,
//       revenue: t.revenue,
//       avgOrderValue: t.orders > 0 ? t.revenue / t.orders : 0,
//     }));

//     // Map locations data
//     const mappedLocations = branches.map((b, index) => ({
//       locationId: b.locationId,
//       locationName: b.locationName,
//       salesCount: b.orders,
//       revenue: b.revenue,
//       growth: index === 0 ? revenueGrowth : 0, // Apply growth to top location
//     }));

//     // Map staff data
//     const mappedStaff = staff.map(s => ({
//       staffId: s.staffId,
//       staffName: s.staffName,
//       salesCount: s.ordersHandled,
//       revenue: s.revenue,
//       commission: s.revenue * 0.05, // 5% commission example
//     }));

//     // Map payment methods
//     const mappedPaymentMethods = paymentMethods.map(pm => ({
//       method: pm.paymentMethod,
//       count: pm.count,
//       amount: pm.totalAmount,
//       percentage: pm.percentage,
//     }));

//     return {
//       summary: {
//         totalSales: overview.totalOrders,
//         totalRevenue: overview.totalRevenue,
//         totalPaid: overview.totalRevenue, // Assuming all completed sales are paid
//         totalOutstanding: 0, // Can be calculated from pending payments if needed
//         avgOrderValue: overview.averageOrderValue,
//         profitMargin,
//       },
//       trends: mappedTrends,
//       topLocations: mappedLocations,
//       topStaff: mappedStaff,
//       topProducts,
//       paymentMethodBreakdown: mappedPaymentMethods,
//       recentSales,
//       growth: {
//         salesGrowth,
//         revenueGrowth,
//         aovGrowth,
//         profitGrowth,
//       },
//     };
//   }

//   /**
//    * Get previous period overview for growth calculations
//    */
//   private async getPreviousPeriodOverview(
//     currentStart: Date,
//     currentEnd: Date,
//     locationId?: string
//   ): Promise<SalesOverviewDTO> {
//     const periodLength = currentEnd.getTime() - currentStart.getTime();
//     const previousStart = new Date(currentStart.getTime() - periodLength);
//     const previousEnd = new Date(currentStart.getTime() - 1);

//     return this.getSalesOverview({
//       startDate: previousStart.toISOString(),
//       endDate: previousEnd.toISOString(),
//       locationId,
//     });
//   }

//   /**
//    * Get recent sales for dashboard
//    */
//   private async getRecentSales(query: SalesQueryDTO): Promise<Array<{
//     id: string;
//     invoiceNumber: string;
//     customerName: string;
//     locationName: string;
//     totalAmount: number;
//     paymentStatus: string;
//     date: string;
//   }>> {
//     const { startDate, endDate, locationId, limit = 10 } = query;
//     const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
//     const end = endDate ? new Date(endDate) : new Date();

//     const jobSheetWhereClause: any = {
//       createdAt: { gte: start, lte: end },
//       status: { in: ['COMPLETED', 'DELIVERED'] },
//     };

//     const posWhereClause: any = {
//       createdAt: { gte: start, lte: end },
//       status: 'COMPLETED',
//     };

//     if (locationId) {
//       jobSheetWhereClause.locationId = locationId;
//       posWhereClause.locationId = locationId;
//     }

//     // Get JobSheet sales
//     const jobSheetSales = await prisma.jobSheet.findMany({
//       where: jobSheetWhereClause,
//       select: {
//         id: true,
//         jobNumber: true,
//         customer: {
//           select: {
//             name: true,
//           },
//         },
//         location: {
//           select: {
//             name: true,
//           },
//         },
//         totalAmount: true,
//         paidAmount: true,
//         createdAt: true,
//       },
//       orderBy: {
//         createdAt: 'desc',
//       },
//       take: limit,
//     });

//     // Get POS sales
//     const posSales = await prisma.sale.findMany({
//       where: posWhereClause,
//       select: {
//         id: true,
//         saleNumber: true,
//         customer: {
//           select: {
//             name: true,
//           },
//         },
//         customerName: true,
//         location: {
//           select: {
//             name: true,
//           },
//         },
//         totalAmount: true,
//         paidAmount: true,
//         paymentStatus: true,
//         createdAt: true,
//       },
//       orderBy: {
//         createdAt: 'desc',
//       },
//       take: limit,
//     });

//     // Combine and format sales
//     const combinedSales: Array<{
//       id: string;
//       invoiceNumber: string;
//       customerName: string;
//       locationName: string;
//       totalAmount: number;
//       paymentStatus: string;
//       date: string;
//       createdAt: Date;
//     }> = [
//       ...jobSheetSales.map(sale => ({
//         id: sale.id,
//         invoiceNumber: sale.jobNumber,
//         customerName: sale.customer?.name || 'Walk-in Customer',
//         locationName: sale.location?.name || 'Unknown',
//         totalAmount: Number(sale.totalAmount),
//         paymentStatus: Number(sale.paidAmount) >= Number(sale.totalAmount) ? 'PAID' : 'PENDING',
//         date: sale.createdAt.toISOString(),
//         createdAt: sale.createdAt,
//       })),
//       ...posSales.map(sale => ({
//         id: sale.id,
//         invoiceNumber: sale.saleNumber,
//         customerName: sale.customer?.name || sale.customerName || 'Walk-in Customer',
//         locationName: sale.location?.name || 'Unknown',
//         totalAmount: Number(sale.totalAmount),
//         paymentStatus: sale.paymentStatus === 'COMPLETED' ? 'PAID' : 'PENDING',
//         date: sale.createdAt.toISOString(),
//         createdAt: sale.createdAt,
//       })),
//     ];

//     // Sort by date and limit
//     return combinedSales
//       .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
//       .slice(0, limit)
//       .map(({ createdAt, ...rest }) => rest);
//   }
//   /**
//    * Get sales overview statistics
//    */
//   async getSalesOverview(query: SalesQueryDTO): Promise<SalesOverviewDTO> {
//     const { startDate, endDate, locationId } = query;
//     const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
//     const end = endDate ? new Date(endDate) : new Date();

//     const whereClause: any = {
//       createdAt: { gte: start, lte: end },
//       status: { in: ['COMPLETED', 'DELIVERED'] },
//     };

//     if (locationId) {
//       whereClause.locationId = locationId;
//     }

//     // Get JobSheet sales data
//     const jobSheetData = await prisma.jobSheet.aggregate({
//       where: whereClause,
//       _sum: {
//         totalAmount: true,
//         labourCost: true,
//         partsCost: true,
//       },
//       _count: true,
//     });

//     // Get POS sales data
//     const posWhereClause: any = {
//       createdAt: { gte: start, lte: end },
//       status: 'COMPLETED',
//     };

//     if (locationId) {
//       posWhereClause.locationId = locationId;
//     }

//     const posSalesData = await prisma.sale.aggregate({
//       where: posWhereClause,
//       _sum: {
//         totalAmount: true,
//         subtotal: true,
//       },
//       _count: true,
//     });

//     // Get POS items cost
//     const posItemsCost = await prisma.saleItem.aggregate({
//       where: {
//         sale: posWhereClause,
//       },
//       _sum: {
//         costPrice: true,
//       },
//     });

//     // Calculate products revenue from JobSheet
//     const productsRevenue = await prisma.jobSheetProduct.aggregate({
//       where: {
//         jobSheet: whereClause,
//       },
//       _sum: {
//         totalPrice: true,
//       },
//     });

//     // Combine JobSheet and POS data
//     const jobSheetRevenue = Number(jobSheetData._sum.totalAmount || 0);
//     const posRevenue = Number(posSalesData._sum.totalAmount || 0);
//     const totalRevenue = jobSheetRevenue + posRevenue;
    
//     const jobSheetOrders = jobSheetData._count;
//     const posOrders = posSalesData._count;
//     const totalOrders = jobSheetOrders + posOrders;
    
//     const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

//     // Calculate cost for profit (parts cost + product cost + POS cost)
//     const partsCost = Number(jobSheetData._sum.partsCost || 0);
//     const productsCost = await this.calculateProductsCost(whereClause);
//     const posCost = Number(posItemsCost._sum.costPrice || 0);
//     const totalCost = partsCost + productsCost + posCost;
//     const totalProfit = totalRevenue - totalCost;

//     return {
//       totalRevenue,
//       totalProfit,
//       totalOrders,
//       averageOrderValue,
//       periodStart: start,
//       periodEnd: end,
//     };
//   }

//   /**
//    * Get sales trends over time (daily/weekly/monthly)
//    */
//   async getSalesTrends(query: SalesQueryDTO): Promise<SalesTrendDTO[]> {
//     const { startDate, endDate, locationId } = query;
//     const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
//     const end = endDate ? new Date(endDate) : new Date();

//     const jobSheetWhereClause: any = {
//       createdAt: { gte: start, lte: end },
//       status: { in: ['COMPLETED', 'DELIVERED'] },
//     };

//     if (locationId) {
//       jobSheetWhereClause.locationId = locationId;
//     }

//     // POS Sales where clause
//     const posWhereClause: any = {
//       createdAt: { gte: start, lte: end },
//       status: 'COMPLETED',
//     };

//     if (locationId) {
//       posWhereClause.locationId = locationId;
//     }

//     // Group JobSheet by date
//     const [jobSheetSalesByDate, posSalesByDate] = await Promise.all([
//       prisma.jobSheet.groupBy({
//         by: ['createdAt'],
//         where: jobSheetWhereClause,
//         _sum: {
//           totalAmount: true,
//           partsCost: true,
//         },
//         _count: true,
//       }),
//       prisma.sale.groupBy({
//         by: ['createdAt'],
//         where: posWhereClause,
//         _sum: {
//           totalAmount: true,
//           subtotal: true,
//         },
//         _count: true,
//       }),
//     ]);

//     // Get POS items cost grouped by date
//     const posItemsCostByDate = await prisma.saleItem.groupBy({
//       by: ['saleId'],
//       where: {
//         sale: posWhereClause,
//       },
//       _sum: {
//         costPrice: true,
//       },
//     });

//     // Map sale ID to cost
//     const posCostMap = new Map<string, number>();
//     for (const item of posItemsCostByDate) {
//       posCostMap.set(item.saleId, Number(item._sum.costPrice || 0));
//     }

//     // Format and aggregate by day
//     const trendsMap = new Map<string, { revenue: number; orders: number; cost: number }>();

//     // Add JobSheet data
//     for (const sale of jobSheetSalesByDate) {
//       const dateKey = sale.createdAt.toISOString().split('T')[0];
//       const existing = trendsMap.get(dateKey) || { revenue: 0, orders: 0, cost: 0 };
      
//       existing.revenue += Number(sale._sum.totalAmount || 0);
//       existing.orders += sale._count;
//       existing.cost += Number(sale._sum.partsCost || 0);
      
//       trendsMap.set(dateKey, existing);
//     }

//     // Add POS data
//     for (const sale of posSalesByDate) {
//       const dateKey = sale.createdAt.toISOString().split('T')[0];
//       const existing = trendsMap.get(dateKey) || { revenue: 0, orders: 0, cost: 0 };
      
//       existing.revenue += Number(sale._sum.totalAmount || 0);
//       existing.orders += sale._count;
//       // Cost needs to be retrieved from posItemsCostByDate
      
//       trendsMap.set(dateKey, existing);
//     }

//     const trends: SalesTrendDTO[] = Array.from(trendsMap.entries()).map(([date, data]) => ({
//       date,
//       revenue: data.revenue,
//       orders: data.orders,
//       profit: data.revenue - data.cost,
//     }));

//     return trends.sort((a, b) => a.date.localeCompare(b.date));
//   }

//   /**
//    * Get top selling products
//    */
//   async getTopProducts(query: SalesQueryDTO): Promise<TopProductDTO[]> {
//     const { startDate, endDate, locationId, limit = 10 } = query;
//     const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
//     const end = endDate ? new Date(endDate) : new Date();

//     const jobSheetWhereClause: any = {
//       jobSheet: {
//         createdAt: { gte: start, lte: end },
//         status: { in: ['COMPLETED', 'DELIVERED'] },
//       },
//     };

//     if (locationId) {
//       jobSheetWhereClause.jobSheet.locationId = locationId;
//     }

//     // POS where clause
//     const posWhereClause: any = {
//       sale: {
//         createdAt: { gte: start, lte: end },
//         status: 'COMPLETED',
//       },
//     };

//     if (locationId) {
//       posWhereClause.sale.locationId = locationId;
//     }

//     // Group by product from both JobSheet and POS
//     const [jobSheetProducts, posProducts] = await Promise.all([
//       prisma.jobSheetProduct.groupBy({
//         by: ['productId'],
//         where: jobSheetWhereClause,
//         _sum: {
//           quantity: true,
//           totalPrice: true,
//         },
//       }),
//       prisma.saleItem.groupBy({
//         by: ['productId'],
//         where: posWhereClause,
//         _sum: {
//           quantity: true,
//           subtotal: true,
//           costPrice: true,
//         },
//       }),
//     ]);

//     // Combine products from both sources
//     const productStatsMap = new Map<string, { quantity: number; revenue: number; cost: number }>();

//     // Add JobSheet products
//     for (const jp of jobSheetProducts) {
//       const existing = productStatsMap.get(jp.productId) || { quantity: 0, revenue: 0, cost: 0 };
//       existing.quantity += Number(jp._sum.quantity || 0);
//       existing.revenue += Number(jp._sum.totalPrice || 0);
//       productStatsMap.set(jp.productId, existing);
//     }

//     // Add POS products
//     for (const pp of posProducts) {
//       const existing = productStatsMap.get(pp.productId) || { quantity: 0, revenue: 0, cost: 0 };
//       existing.quantity += Number(pp._sum?.quantity || 0);
//       existing.revenue += Number(pp._sum?.subtotal || 0);
//       existing.cost += Number(pp._sum?.costPrice || 0);
//       productStatsMap.set(pp.productId, existing);
//     }

//     // Sort by revenue and take top N
//     const topProductEntries = Array.from(productStatsMap.entries())
//       .sort((a, b) => b[1].revenue - a[1].revenue)
//       .slice(0, limit);

//     // Fetch product details
//     const productIds = topProductEntries.map(([id]) => id);
//     const products = await prisma.product.findMany({
//       where: { id: { in: productIds } },
//       select: {
//         id: true,
//         name: true,
//         costPrice: true,
//       },
//     });

//     const productMap = new Map(products.map((p) => [p.id, p]));

//     return topProductEntries.map(([productId, stats]) => {
//       const product = productMap.get(productId);
//       const profit = stats.revenue - stats.cost;

//       return {
//         productId,
//         productName: product?.name || 'Unknown Product',
//         quantitySold: stats.quantity,
//         revenue: stats.revenue,
//         profit,
//       };
//     });
//   }

//   /**
//    * Get branch performance
//    */
//   async getLocationPerformance(query: SalesQueryDTO): Promise<LocationPerformanceDTO[]> {
//     const { startDate, endDate } = query;
//     const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
//     const end = endDate ? new Date(endDate) : new Date();

//     const jobSheetWhereClause: any = {
//       createdAt: { gte: start, lte: end },
//       status: { in: ['COMPLETED', 'DELIVERED'] },
//     };

//     const posWhereClause: any = {
//       createdAt: { gte: start, lte: end },
//       status: 'COMPLETED',
//     };

//     // Get JobSheet location sales
//     const jobSheetLocationSales = await prisma.jobSheet.groupBy({
//       by: ['locationId'],
//       where: jobSheetWhereClause,
//       _sum: {
//         totalAmount: true,
//       },
//       _count: true,
//     });

//     // Get POS location sales
//     const posLocationSales = await prisma.sale.groupBy({
//       by: ['locationId'],
//       where: posWhereClause,
//       _sum: {
//         totalAmount: true,
//       },
//       _count: true,
//     });

//     // Combine location data
//     const locationStatsMap = new Map<string, { revenue: number; orders: number }>();

//     // Add JobSheet data
//     for (const ls of jobSheetLocationSales) {
//       const existing = locationStatsMap.get(ls.locationId) || { revenue: 0, orders: 0 };
//       existing.revenue += Number(ls._sum.totalAmount || 0);
//       existing.orders += ls._count;
//       locationStatsMap.set(ls.locationId, existing);
//     }

//     // Add POS data
//     for (const ls of posLocationSales) {
//       const existing = locationStatsMap.get(ls.locationId) || { revenue: 0, orders: 0 };
//       existing.revenue += Number(ls._sum.totalAmount || 0);
//       existing.orders += ls._count;
//       locationStatsMap.set(ls.locationId, existing);
//     }

//     // Get location names
//     const locationIds = Array.from(locationStatsMap.keys());
//     const locations = await prisma.location.findMany({
//       where: { id: { in: locationIds } },
//       select: {
//         id: true,
//         name: true,
//       },
//     });

//     const locationMap = new Map(locations.map((l) => [l.id, l.name]));

//     return Array.from(locationStatsMap.entries()).map(([locationId, stats]) => ({
//       locationId,
//       locationName: locationMap.get(locationId) || 'Unknown Location',
//       revenue: stats.revenue,
//       orders: stats.orders,
//       averageOrderValue: stats.orders > 0 ? stats.revenue / stats.orders : 0,
//     })).sort((a, b) => b.revenue - a.revenue);
//   }

//   /**
//    * Get staff performance
//    */
//   async getStaffPerformance(query: SalesQueryDTO): Promise<StaffPerformanceDTO[]> {
//     const { startDate, endDate, locationId, limit = 10 } = query;
//     const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
//     const end = endDate ? new Date(endDate) : new Date();

//     const jobSheetWhereClause: any = {
//       createdAt: { gte: start, lte: end },
//       status: { in: ['COMPLETED', 'DELIVERED'] },
//     };

//     const posWhereClause: any = {
//       createdAt: { gte: start, lte: end },
//       status: 'COMPLETED',
//     };

//     if (locationId) {
//       jobSheetWhereClause.locationId = locationId;
//       posWhereClause.locationId = locationId;
//     }

//     // Get JobSheet staff sales
//     const jobSheetStaffSales = await prisma.jobSheet.groupBy({
//       by: ['createdById'],
//       where: jobSheetWhereClause,
//       _sum: {
//         totalAmount: true,
//       },
//       _count: true,
//     });

//     // Get POS staff sales
//     const posStaffSales = await prisma.sale.groupBy({
//       by: ['soldById'],
//       where: posWhereClause,
//       _sum: {
//         totalAmount: true,
//       },
//       _count: true,
//     });

//     // Combine staff data
//     const staffStatsMap = new Map<string, { revenue: number; orders: number }>();

//     // Add JobSheet data
//     for (const ss of jobSheetStaffSales) {
//       const existing = staffStatsMap.get(ss.createdById) || { revenue: 0, orders: 0 };
//       existing.revenue += Number(ss._sum.totalAmount || 0);
//       existing.orders += ss._count;
//       staffStatsMap.set(ss.createdById, existing);
//     }

//     // Add POS data
//     for (const ss of posStaffSales) {
//       const existing = staffStatsMap.get(ss.soldById) || { revenue: 0, orders: 0 };
//       existing.revenue += Number(ss._sum.totalAmount || 0);
//       existing.orders += ss._count;
//       staffStatsMap.set(ss.soldById, existing);
//     }

//     // Get staff names
//     const staffIds = Array.from(staffStatsMap.keys());
//     const users = await prisma.user.findMany({
//       where: { id: { in: staffIds } },
//       select: {
//         id: true,
//         name: true,
//       },
//     });

//     const staffMap = new Map(users.map((u) => [u.id, u.name]));

//     return Array.from(staffStatsMap.entries())
//       .map(([staffId, stats]) => ({
//         staffId,
//         staffName: staffMap.get(staffId) || 'Unknown Staff',
//         ordersHandled: stats.orders,
//         revenue: stats.revenue,
//         averageOrderValue: stats.orders > 0 ? stats.revenue / stats.orders : 0,
//       }))
//       .sort((a, b) => b.revenue - a.revenue)
//       .slice(0, limit);
//   }

//   /**
//    * Get payment method statistics
//    */
//   async getPaymentMethodStats(query: SalesQueryDTO): Promise<PaymentMethodStatsDTO[]> {
//     const { startDate, endDate, locationId } = query;
//     const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
//     const end = endDate ? new Date(endDate) : new Date();

//     const jobSheetPaymentWhereClause: any = {
//       paymentDate: { gte: start, lte: end },
//     };

//     const posPaymentWhereClause: any = {
//       paymentDate: { gte: start, lte: end },
//       status: 'COMPLETED',
//     };

//     if (locationId) {
//       jobSheetPaymentWhereClause.jobSheet = {
//         locationId,
//       };
//       posPaymentWhereClause.sale = {
//         locationId,
//       };
//     }

//     // Get JobSheet payments
//     const jobSheetPaymentStats = await prisma.payment.groupBy({
//       by: ['paymentMethod'],
//       where: jobSheetPaymentWhereClause,
//       _sum: {
//         amount: true,
//       },
//       _count: true,
//     });

//     // Get POS payments
//     const posPaymentStats = await prisma.salePayment.groupBy({
//       by: ['paymentMethod'],
//       where: posPaymentWhereClause,
//       _sum: {
//         amount: true,
//       },
//       _count: true,
//     });

//     // Combine payment method data
//     const paymentStatsMap = new Map<string, { amount: number; count: number }>();

//     // Add JobSheet payment data
//     for (const ps of jobSheetPaymentStats) {
//       const existing = paymentStatsMap.get(ps.paymentMethod) || { amount: 0, count: 0 };
//       existing.amount += Number(ps._sum.amount || 0);
//       existing.count += ps._count;
//       paymentStatsMap.set(ps.paymentMethod, existing);
//     }

//     // Add POS payment data
//     for (const ps of posPaymentStats) {
//       const existing = paymentStatsMap.get(ps.paymentMethod) || { amount: 0, count: 0 };
//       existing.amount += Number(ps._sum.amount || 0);
//       existing.count += ps._count;
//       paymentStatsMap.set(ps.paymentMethod, existing);
//     }

//     const totalAmount = Array.from(paymentStatsMap.values()).reduce(
//       (sum, stats) => sum + stats.amount,
//       0
//     );

//     return Array.from(paymentStatsMap.entries())
//       .map(([paymentMethod, stats]) => ({
//         paymentMethod,
//         totalAmount: stats.amount,
//         count: stats.count,
//         percentage: totalAmount > 0 ? (stats.amount / totalAmount) * 100 : 0,
//       }))
//       .sort((a, b) => b.totalAmount - a.totalAmount);
//   }

//   /**
//    * Get revenue breakdown by category
//    */
//   async getRevenueBreakdown(query: SalesQueryDTO): Promise<RevenueBreakdownDTO> {
//     const { startDate, endDate, locationId } = query;
//     const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
//     const end = endDate ? new Date(endDate) : new Date();

//     const whereClause: any = {
//       createdAt: { gte: start, lte: end },
//       status: { in: ['COMPLETED', 'DELIVERED'] },
//     };

//     if (locationId) {
//       whereClause.locationId = locationId;
//     }

//     const revenueData = await prisma.jobSheet.aggregate({
//       where: whereClause,
//       _sum: {
//         labourCost: true,
//         partsCost: true,
//       },
//     });

//     const productsRevenue = await prisma.jobSheetProduct.aggregate({
//       where: {
//         jobSheet: whereClause,
//       },
//       _sum: {
//         totalPrice: true,
//       },
//     });

//     const labourRevenue = Number(revenueData._sum.labourCost || 0);
//     const partsRevenue = Number(revenueData._sum.partsCost || 0);
//     const productsRev = Number(productsRevenue._sum.totalPrice || 0);
//     const totalRevenue = labourRevenue + partsRevenue + productsRev;

//     return {
//       labourRevenue,
//       partsRevenue,
//       productsRevenue: productsRev,
//       totalRevenue,
//     };
//   }

//   /**
//    * Get profit analysis
//    */
//   async getProfitAnalysis(query: SalesQueryDTO): Promise<ProfitAnalysisDTO> {
//     const { startDate, endDate, locationId } = query;
//     const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
//     const end = endDate ? new Date(endDate) : new Date();

//     const jobSheetWhereClause: any = {
//       createdAt: { gte: start, lte: end },
//       status: { in: ['COMPLETED', 'DELIVERED'] },
//     };

//     if (locationId) {
//       jobSheetWhereClause.locationId = locationId;
//     }

//     // POS Sales where clause
//     const posWhereClause: any = {
//       createdAt: { gte: start, lte: end },
//       status: 'COMPLETED',
//     };

//     if (locationId) {
//       posWhereClause.locationId = locationId;
//     }

//     // Get JobSheet revenue data
//     const jobSheetRevenueData = await prisma.jobSheet.aggregate({
//       where: jobSheetWhereClause,
//       _sum: {
//         totalAmount: true,
//         partsCost: true,
//       },
//     });

//     // Get POS revenue data
//     const posRevenueData = await prisma.sale.aggregate({
//       where: posWhereClause,
//       _sum: {
//         totalAmount: true,
//         subtotal: true,
//       },
//     });

//     // Get POS items cost
//     const posItemsCost = await prisma.saleItem.aggregate({
//       where: {
//         sale: posWhereClause,
//       },
//       _sum: {
//         costPrice: true,
//       },
//     });

//     const jobSheetRevenue = Number(jobSheetRevenueData._sum.totalAmount || 0);
//     const posRevenue = Number(posRevenueData._sum.totalAmount || 0);
//     const totalRevenue = jobSheetRevenue + posRevenue;
    
//     const partsCost = Number(jobSheetRevenueData._sum.partsCost || 0);
//     const productsCost = await this.calculateProductsCost(jobSheetWhereClause);
//     const posCost = Number(posItemsCost._sum.costPrice || 0);
//     const totalCost = partsCost + productsCost + posCost;
    
//     const grossProfit = totalRevenue - totalCost;
//     const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

//     return {
//       totalRevenue,
//       totalCost,
//       grossProfit,
//       profitMargin,
//     };
//   }

//   /**
//    * Get detailed sales list
//    */
//   async getSalesDetails(query: SalesQueryDTO): Promise<{ sales: SalesDetailDTO[]; total: number }> {
//     const { startDate, endDate, locationId, soldById, status, page = 1, limit = 10 } = query;
//     const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
//     const end = endDate ? new Date(endDate) : new Date();

//     const jobSheetWhereClause: any = {
//       createdAt: { gte: start, lte: end },
//     };

//     if (locationId) {
//       jobSheetWhereClause.locationId = locationId;
//     }

//     if (soldById) {
//       jobSheetWhereClause.createdById = soldById;
//     }

//     if (status) {
//       jobSheetWhereClause.status = status;
//     }

//     // POS Sales where clause
//     const posWhereClause: any = {
//       createdAt: { gte: start, lte: end },
//     };

//     if (locationId) {
//       posWhereClause.locationId = locationId;
//     }

//     if (soldById) {
//       posWhereClause.soldById = soldById;
//     }

//     if (status) {
//       posWhereClause.status = status;
//     }

//     // Fetch JobSheets and POS Sales in parallel
//     const [jobSheets, jobSheetTotal, posSales, posSaleTotal] = await Promise.all([
//       prisma.jobSheet.findMany({
//         where: jobSheetWhereClause,
//         include: {
//           customer: {
//             select: {
//               name: true,
//             },
//           },
//           location: {
//             select: {
//               name: true,
//             },
//           },
//           createdBy: {
//             select: {
//               name: true,
//             },
//           },
//           payments: {
//             select: {
//               amount: true,
//             },
//           },
//         },
//         orderBy: {
//           createdAt: 'desc',
//         },
//       }),
//       prisma.jobSheet.count({ where: jobSheetWhereClause }),
//       prisma.sale.findMany({
//         where: posWhereClause,
//         include: {
//           customer: {
//             select: {
//               name: true,
//             },
//           },
//           location: {
//             select: {
//               name: true,
//             },
//           },
//           soldBy: {
//             select: {
//               name: true,
//             },
//           },
//           payments: {
//             select: {
//               amount: true,
//             },
//           },
//         },
//         orderBy: {
//           createdAt: 'desc',
//         },
//       }),
//       prisma.sale.count({ where: posWhereClause }),
//     ]);

//     // Map JobSheet data
//     const jobSheetSales: SalesDetailDTO[] = jobSheets.map((js) => ({
//       jobSheetId: js.id,
//       jobNumber: js.jobNumber,
//       customerName: js.customer.name,
//       locationName: js.location.name,
//       staffName: js.createdBy.name,
//       totalAmount: Number(js.totalAmount),
//       paidAmount: js.payments.reduce((sum: number, p) => sum + Number(p.amount), 0),
//       status: js.status,
//       createdAt: js.createdAt,
//       completedAt: js.completedDate || undefined,
//       type: 'JobSheet',
//     }));

//     // Map POS Sale data
//     const posSalesData: SalesDetailDTO[] = posSales.map((sale) => ({
//       jobSheetId: sale.id,
//       jobNumber: sale.saleNumber,
//       customerName: sale.customer?.name || 'Walk-in Customer',
//       locationName: sale.location.name,
//       staffName: sale.soldBy.name,
//       totalAmount: Number(sale.totalAmount),
//       paidAmount: sale.payments.reduce((sum: number, p) => sum + Number(p.amount), 0),
//       status: sale.status,
//       createdAt: sale.createdAt,
//       completedAt: sale.completedAt || undefined,
//       type: 'POS',
//     }));

//     // Combine and sort all sales
//     const allSales = [...jobSheetSales, ...posSalesData].sort(
//       (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
//     );

//     // Apply pagination after combining
//     const sales = allSales.slice((page - 1) * limit, page * limit);
//     const total = jobSheetTotal + posSaleTotal;

//     return { sales, total };
//   }

//   /**
//    * Get customer insights
//    */
//   async getCustomerInsights(query: SalesQueryDTO): Promise<CustomerInsightsDTO> {
//     const { startDate, endDate, locationId } = query;
//     const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
//     const end = endDate ? new Date(endDate) : new Date();

//     // Total customers who made purchases in period
//     const whereClause: any = {
//       createdAt: { gte: start, lte: end },
//       status: { in: ['COMPLETED', 'DELIVERED'] },
//     };

//     if (locationId) {
//       whereClause.locationId = locationId;
//     }

//     const customerStats = await prisma.jobSheet.groupBy({
//       by: ['customerId'],
//       where: whereClause,
//       _sum: {
//         totalAmount: true,
//       },
//       _count: true,
//     });

//     const totalCustomers = customerStats.length;

//     // New vs returning customers
//     const customerIds = customerStats.map((cs) => cs.customerId);
//     const customerFirstOrders = await prisma.jobSheet.groupBy({
//       by: ['customerId'],
//       where: {
//         customerId: { in: customerIds },
//         status: { in: ['COMPLETED', 'DELIVERED'] },
//       },
//       _min: {
//         createdAt: true,
//       },
//     });

//     const newCustomers = customerFirstOrders.filter(
//       (cfo) => cfo._min.createdAt && cfo._min.createdAt >= start && cfo._min.createdAt <= end
//     ).length;
//     const returningCustomers = totalCustomers - newCustomers;

//     // Average lifetime value
//     const totalRevenue = customerStats.reduce((sum, cs) => sum + Number(cs._sum.totalAmount || 0), 0);
//     const averageLifetimeValue = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;

//     // Top customers
//     const topCustomerData = customerStats
//       .sort((a, b) => Number(b._sum.totalAmount || 0) - Number(a._sum.totalAmount || 0))
//       .slice(0, 5);

//     const topCustomerIds = topCustomerData.map((tc) => tc.customerId);
//     const customers = await prisma.customer.findMany({
//       where: { id: { in: topCustomerIds } },
//       select: {
//         id: true,
//         name: true,
//       },
//     });

//     const customerMap = new Map(customers.map((c) => [c.id, c.name]));

//     const topCustomers = topCustomerData.map((tc) => ({
//       customerId: tc.customerId,
//       customerName: customerMap.get(tc.customerId) || 'Unknown Customer',
//       totalSpent: Number(tc._sum.totalAmount || 0),
//       orderCount: tc._count,
//     }));

//     return {
//       totalCustomers,
//       newCustomers,
//       returningCustomers,
//       averageLifetimeValue,
//       topCustomers,
//     };
//   }

//   /**
//    * Get enhanced branch dashboard with jobsheet/POS breakdown and product counts
//    */
//   async getBranchEnhancedDashboard(locationId: string): Promise<{
//     todaySales: {
//       jobsheetSales: number;
//       posSales: number;
//       totalSales: number;
//       jobsheetCount: number;
//       posCount: number;
//     };
//     productsCount: number;
//     recentJobsheets: Array<{
//       id: string;
//       jobNumber: string;
//       customerName: string;
//       amount: number;
//       status: string;
//       createdAt: string;
//     }>;
//     recentPosSales: Array<{
//       id: string;
//       invoiceNumber: string;
//       customerName: string;
//       totalAmount: number;
//       paymentStatus: string;
//       createdAt: string;
//     }>;
//   }> {
//     const today = new Date();
//     const startOfDay = new Date(today.setHours(0, 0, 0, 0));
//     const endOfDay = new Date(today.setHours(23, 59, 59, 999));

//     // Get today's jobsheet payments
//     const jobsheetPayments = await prisma.payment.findMany({
//       where: {
//         createdAt: {
//           gte: startOfDay,
//           lte: endOfDay,
//         },
//         jobSheet: {
//           locationId: locationId,
//         },
//       },
//       include: {
//         jobSheet: {
//           select: {
//             id: true,
//             jobNumber: true,
//             customer: {
//               select: {
//                 name: true,
//               },
//             },
//             status: true,
//             createdAt: true,
//           },
//         },
//       },
//     });

//     const jobsheetSales = jobsheetPayments.reduce((sum: number, payment: any) => sum + Number(payment.amount), 0);
//     const jobsheetCount = jobsheetPayments.length;

//     // Get today's POS sales
//     const posSalesData = await prisma.sale.findMany({
//       where: {
//         createdAt: {
//           gte: startOfDay,
//           lte: endOfDay,
//         },
//         locationId: locationId,
//         status: 'COMPLETED',
//       },
//       include: {
//         customer: {
//           select: {
//             name: true,
//           },
//         },
//       },
//     });

//     const posSales = posSalesData.reduce((sum: number, sale: any) => sum + Number(sale.totalAmount), 0);
//     const posCount = posSalesData.length;

//     // Get products count for this branch
//     const productsCount = await prisma.inventory.count({
//       where: {
//         locationId: locationId,
//         quantity: {
//           gt: 0,
//         },
//       },
//     });

//     // Get recent jobsheets (last 5)
//     const recentJobsheets = await prisma.jobSheet.findMany({
//       where: {
//         locationId: locationId,
//       },
//       include: {
//         customer: {
//           select: {
//             name: true,
//           },
//         },
//       },
//       orderBy: {
//         createdAt: 'desc',
//       },
//       take: 5,
//     });

//     // Get recent POS sales (last 5)
//     const recentPosSales = await prisma.sale.findMany({
//       where: {
//         locationId: locationId,
//         status: 'COMPLETED',
//       },
//       include: {
//         customer: {
//           select: {
//             name: true,
//           },
//         },
//       },
//       orderBy: {
//         createdAt: 'desc',
//       },
//       take: 5,
//     });

//     return {
//       todaySales: {
//         jobsheetSales,
//         posSales,
//         totalSales: jobsheetSales + posSales,
//         jobsheetCount,
//         posCount,
//       },
//       productsCount,
//       recentJobsheets: recentJobsheets.map(js => ({
//         id: js.id,
//         jobNumber: js.jobNumber,
//         customerName: js.customer?.name || 'N/A',
//         amount: Number(js.totalAmount),
//         status: js.status,
//         createdAt: js.createdAt.toISOString(),
//       })),
//       recentPosSales: recentPosSales.map((sale: any) => ({
//         id: sale.id,
//         invoiceNumber: sale.saleNumber || `SALE-${sale.id.slice(-8)}`,
//         customerName: sale.customer?.name || 'N/A',
//         totalAmount: Number(sale.totalAmount),
//         paymentStatus: sale.paymentStatus,
//         createdAt: sale.createdAt.toISOString(),
//       })),
//     };
//   }

//   /**
//    * Helper: Calculate products cost
//    */
//   private async calculateProductsCost(whereClause: any): Promise<number> {
//     const jobSheetProducts = await prisma.jobSheetProduct.findMany({
//       where: {
//         jobSheet: whereClause,
//       },
//       include: {
//         product: {
//           select: {
//             costPrice: true,
//           },
//         },
//       },
//     });

//     return jobSheetProducts.reduce((sum, jsp) => {
//       const cost = Number(jsp.product.costPrice || 0) * jsp.quantity;
//       return sum + cost;
//     }, 0);
//   }
// }

