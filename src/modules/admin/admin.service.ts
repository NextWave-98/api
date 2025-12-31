import sequelize from '../../shared/config/database';
import { Op } from 'sequelize';
import { User } from '../../models/user.model';
import { Role } from '../../models/role.model';
import { Permission } from '../../models/permission.model';
import { Location } from '../../models/location.model';
import { Staff } from '../../models/staff.model';
import { ProductInventory } from '../../models/product-inventory.model';
import { SalePayment } from '../../models/sale-payment.model';
import { Payment } from '../../models/payment.model';
import { SaleRefund } from '../../models/sale-refund.model';
import { JobSheet } from '../../models/jobsheet.model';
import { Sale } from '../../models/sale.model';
import { SaleItem } from '../../models/sale-item.model';
import { Product } from '../../models/product.model';
import { Customer } from '../../models/customer.model';
import { Device } from '../../models/device.model';

export class AdminService {
  async getDashboardStats() {
    const [totalUsers, totalRoles, totalPermissions, activeUsers, recentUsers] =
      await Promise.all([
        User.count(),
        Role.count(),
        Permission.count(),
        User.count({ where: { isActive: true } }),
        User.findAll({
          limit: 5,
          order: [['created_at', 'DESC']],
          attributes: ['id', 'email', 'name', 'created_at'],
          include: [
            {
              model: Role,
              as: 'role',
              attributes: ['name'],
            },
          ],
        }),
      ]);

    // User statistics by role
    const roles = await Role.findAll({
      attributes: ['id', 'name'],
      include: [
        {
          model: User,
          as: 'users',
          attributes: [],
        },
      ],
    });

    const usersByRole = await Promise.all(
      roles.map(async (role) => ({
        name: role.name,
        userCount: await User.count({ where: { roleId: role.id } }),
      }))
    );

    return {
      stats: {
        totalUsers,
        totalRoles,
        totalPermissions,
        activeUsers,
        inactiveUsers: totalUsers - activeUsers,
      },
      usersByRole: usersByRole.map((role) => ({
        roleName: role.name,
        userCount: role.userCount,
      })),
      recentUsers,
    };
  }

  async getSuperAdminDashboard() {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);

    // Get revenue data (includes both POS sales, jobsheet payments, minus refunds)
    const todayRevenueData = await this.getRevenueForPeriod(startOfToday, now);
    const yesterdayRevenueData = await this.getRevenueForPeriod(startOfYesterday, startOfToday);
    const weekRevenueData = await this.getRevenueForPeriod(startOfWeek, now);
    const monthRevenueData = await this.getRevenueForPeriod(startOfMonth, now);

    // Parallel fetch all dashboard data
    const [
      // Shops
      totalShops,
      activeShops,
      
      // Staff
      totalStaff,
      activeUsers,
      
      // Stock & Inventory
      totalStockItems,
      inventoryStats,
      
      // Job Sheets
      jobSheetStats,
      overdueJobSheets,
      
      // Recent Activity
      recentPaymentActivity,
      recentJobSheetActivity,
      
      // Top Performing Branches
      topBranches,
    ] = await Promise.all([
      // Shops
      Location.count(),
      Location.count({ where: { isActive: true } }),
      
      // Staff - counting via User model with locationId (staff users)
      Staff.count(),
      User.count({ where: { isActive: true, locationId: { [Op.ne]: null } } }),
      
      // Stock & Inventory
      ProductInventory.count({
        distinct: true,
        col: 'product_id'
      }),
      this.getInventoryStats(),
      
      // Job Sheets
      this.getJobSheetStats(),
      JobSheet.count({
        where: {
          expectedDate: { [Op.lt]: now },
          status: { [Op.notIn]: ['COMPLETED', 'DELIVERED', 'CANCELLED'] }
        }
      }),
      
      // Recent Activity - Sale Payments
      SalePayment.findAll({
        limit: 10,
        order: [[sequelize.col('payment_date'), 'DESC']],
        include: [
          {
            model: Sale,
            as: 'sale',
            include: [
              {
                model: Location,
                as: 'location',
                attributes: ['id', 'name'],
              }
            ]
          }
        ]
      }),
      
      // Recent Activity - Job Sheets
      JobSheet.findAll({
        limit: 10,
        order: [['updated_at', 'DESC']],
        include: [
          {
            model: Location,
            as: 'location',
            attributes: ['id', 'name'],
          },
          {
            model: Customer,
            as: 'customer',
            attributes: ['id', 'name'],
          },
          {
            model: Device,
            as: 'device',
            attributes: ['device_type', 'brand', 'model'],
          }
        ]
      }),
      
      // Top Performing Branches (based on sales)
      this.getTopPerformingBranches(startOfMonth),
    ]);

    // Calculate sales growth (based on revenue)
    const salesGrowth = yesterdayRevenueData.netRevenue > 0 
      ? ((todayRevenueData.netRevenue - yesterdayRevenueData.netRevenue) / yesterdayRevenueData.netRevenue) * 100 
      : todayRevenueData.netRevenue > 0 ? 100 : 0;

    // Calculate profit (assuming 25% margin on net revenue)
    const totalRevenue = monthRevenueData.netRevenue;
    const estimatedProfit = totalRevenue * 0.25;
    const profitMargin = 25;

    // Calculate critical alerts
    const criticalAlerts = 
      overdueJobSheets + 
      inventoryStats.outOfStockItems + 
      (inventoryStats.lowStockItems > 10 ? 1 : 0);

    // Format recent activities
    const recentActivities = this.formatRecentActivities(
      recentPaymentActivity,
      recentJobSheetActivity,
      inventoryStats
    );

    // Calculate staff metrics
    const inactiveStaff = totalStaff - activeUsers;

    return {
      // Shops
      totalShops,
      activeShops,
      inactiveShops: totalShops - activeShops,

      // Staff
      totalStaff,
      activeStaff: activeUsers,
      onLeaveStaff: inactiveStaff,

      // Stock & Inventory
      totalStockItems,
      lowStockItems: inventoryStats.lowStockItems,
      outOfStockItems: inventoryStats.outOfStockItems,
      totalInventoryValue: inventoryStats.totalInventoryValue,

      // Sales & Revenue (POS + Jobsheet - Refunds)
      todaySales: todayRevenueData.totalTransactions,
      todayRevenue: todayRevenueData.netRevenue,
      todaySalesAmount: todayRevenueData.salesRevenue,
      todayJobsheetAmount: todayRevenueData.jobsheetRevenue,
      todayRefunds: todayRevenueData.refunds,
      
      weekSales: weekRevenueData.totalTransactions,
      weekRevenue: weekRevenueData.netRevenue,
      weekSalesAmount: weekRevenueData.salesRevenue,
      weekJobsheetAmount: weekRevenueData.jobsheetRevenue,
      weekRefunds: weekRevenueData.refunds,
      
      monthSales: monthRevenueData.totalTransactions,
      monthRevenue: totalRevenue,
      monthSalesAmount: monthRevenueData.salesRevenue,
      monthJobsheetAmount: monthRevenueData.jobsheetRevenue,
      monthRefunds: monthRevenueData.refunds,
      
      salesGrowth: Number(salesGrowth.toFixed(2)),

      // Job Sheets
      totalJobSheets: jobSheetStats.total,
      pendingJobSheets: jobSheetStats.pending,
      inProgressJobSheets: jobSheetStats.inProgress,
      completedJobSheets: jobSheetStats.completed,
      overdueJobSheets,

      // Financial Overview
      totalRevenue,
      totalProfit: estimatedProfit,
      profitMargin,

      // Recent Activity
      recentSales: recentPaymentActivity,
      recentJobSheets: jobSheetStats.inProgress + jobSheetStats.pending,
      criticalAlerts,

      // Detailed data
      recentActivities,
      topPerformers: topBranches,
    };
  }

  /**
   * Get comprehensive revenue data for a period
   * Includes: POS Sales + Jobsheet Payments - Refunds
   */
  private async getRevenueForPeriod(startDate: Date, endDate: Date) {
    const [
      // POS Sale Payments
      salesPaymentSum,
      salesPaymentCount,
      
      // Jobsheet Payments
      jobsheetPaymentSum,
      jobsheetPaymentCount,
      
      // Sale Refunds (to subtract)
      refundSum,
      refundCount,
    ] = await Promise.all([
      // Sum of completed sale payments
      SalePayment.sum('amount', {
        where: {
          paymentDate: { [Op.gte]: startDate, [Op.lt]: endDate },
          status: 'COMPLETED'
        }
      }),
      SalePayment.count({
        where: {
          paymentDate: { [Op.gte]: startDate, [Op.lt]: endDate },
          status: 'COMPLETED'
        }
      }),
      
      // Sum of jobsheet payments
      Payment.sum('amount', {
        where: {
          paymentDate: { [Op.gte]: startDate, [Op.lt]: endDate }
        }
      }),
      Payment.count({
        where: {
          paymentDate: { [Op.gte]: startDate, [Op.lt]: endDate }
        }
      }),
      
      // Sum of refunds (to subtract from revenue)
      SaleRefund.sum('amount', {
        where: {
          refundDate: { [Op.gte]: startDate, [Op.lt]: endDate }
        }
      }),
      SaleRefund.count({
        where: {
          refundDate: { [Op.gte]: startDate, [Op.lt]: endDate }
        }
      }),
    ]);

    const salesRevenue = Number(salesPaymentSum || 0);
    const jobsheetRevenue = Number(jobsheetPaymentSum || 0);
    const refunds = Number(refundSum || 0);
    const grossRevenue = salesRevenue + jobsheetRevenue;
    const netRevenue = grossRevenue - refunds;
    
    return {
      salesRevenue,           // POS sales only
      jobsheetRevenue,        // Jobsheet payments only
      grossRevenue,           // Total before refunds
      refunds,                // Total refunds
      netRevenue,             // Actual revenue (gross - refunds)
      totalTransactions: (salesPaymentCount || 0) + (jobsheetPaymentCount || 0),
      salesTransactions: salesPaymentCount || 0,
      jobsheetTransactions: jobsheetPaymentCount || 0,
      refundTransactions: refundCount || 0,
    };
  }

  private async getInventoryStats() {
    // Get all inventory items with their products
    const inventoryItems = await ProductInventory.findAll({
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['unit_price']
        }
      ]
    });

    // Calculate stats
    let lowStockItems = 0;
    let outOfStockItems = 0;
    let totalInventoryValue = 0;

    inventoryItems.forEach((item: any) => {
      // Count out of stock
      if (item.quantity === 0) {
        outOfStockItems++;
      }
      
      // Count low stock (below minimum stock level)
      if (item.minStockLevel && item.quantity <= item.minStockLevel && item.quantity > 0) {
        lowStockItems++;
      }

      // Calculate total inventory value
      const itemValue = item.quantity * Number(item.product.unitPrice);
      totalInventoryValue += itemValue;
    });

    return {
      lowStockItems,
      outOfStockItems,
      totalInventoryValue,
    };
  }

  private async getJobSheetStats() {
    const [total, pending, inProgress, completed] = await Promise.all([
      JobSheet.count(),
      JobSheet.count({ where: { status: 'PENDING' } }),
      JobSheet.count({ where: { status: 'IN_PROGRESS' } }),
      JobSheet.count({ where: { status: { [Op.in]: ['COMPLETED', 'DELIVERED'] } } }),
    ]);

    return { total, pending, inProgress, completed };
  }

  private async getTopPerformingBranches(startDate: Date) {
    // Get sales by branch with their total amounts
    const branchPerformance = await Sale.findAll({
      where: {
        createdAt: { [Op.gte]: startDate },
        status: 'COMPLETED'
      },
      attributes: [
        'location_id',
        [sequelize.fn('SUM', sequelize.cast(sequelize.col('Sale.total_amount'), 'DECIMAL')), 'totalAmount'],
        [sequelize.fn('COUNT', sequelize.col('Sale.id')), 'count']
      ],
      group: ['Sale.location_id'],
      order: [[sequelize.literal('SUM("Sale"."total_amount")'), 'DESC']],
      limit: 5,
      raw: true
    });

    const branchesWithDetails = await Promise.all(
      branchPerformance.map(async (perf: any) => {
        const branch = await Location.findByPk(perf.location_id, {
          attributes: ['id', 'name']
        });

        // Get previous month performance for comparison
        const prevMonthStart = new Date(startDate.getTime() - 30 * 24 * 60 * 60 * 1000);
        const prevMonthSales = await Sale.sum('totalAmount', {
          where: {
            locationId: perf.location_id,
            createdAt: { [Op.gte]: prevMonthStart, [Op.lt]: startDate },
            status: 'COMPLETED'
          }
        });

        const currentValue = Number(perf.totalAmount || 0);
        const previousValue = Number(prevMonthSales || 0);
        const change = previousValue > 0 
          ? ((currentValue - previousValue) / previousValue) * 100 
          : currentValue > 0 ? 100 : 0;

        return {
          id: perf.location_id,
          name: branch?.name || 'Unknown Branch',
          value: currentValue,
          change: Number(change.toFixed(2)),
          type: 'shop' as const,
        };
      })
    );

    return branchesWithDetails.sort((a: { value: number }, b: { value: number }) => b.value - a.value);
  }

  private formatRecentActivities(
    recentSalePayments: any[],
    recentJobSheets: any[],
    inventoryStats: any
  ) {
    const activities: any[] = [];

    // Add recent sale payments (representing sales)
    recentSalePayments.slice(0, 2).forEach((payment) => {
      const saleNumber = payment.sale?.saleNumber || 'N/A';
      const branchName = payment.sale?.location?.name || 'Branch';
      activities.push({
        id: `payment-${payment.id}`,
        type: 'sale',
        title: 'Payment Received',
        description: `LKR ${Number(payment.amount).toFixed(2)} for Sale #${saleNumber} at ${branchName}`,
        timestamp: this.getTimeAgo(payment.paymentDate),
        status: 'success',
      });
    });

    // Add recent job sheets
    recentJobSheets.slice(0, 2).forEach((job) => {
      const customerName = job.customer.name;
      const deviceInfo = `${job.device.brand} ${job.device.model}`;
      activities.push({
        id: `job-${job.id}`,
        type: 'jobsheet',
        title: job.status === 'COMPLETED' ? 'Repair Job Completed' : 'Job Sheet Updated',
        description: `${deviceInfo} for ${customerName}`,
        timestamp: this.getTimeAgo(job.updatedAt),
        status: job.status === 'COMPLETED' ? 'success' : 'info',
      });
    });

    // Add stock alerts if any
    if (inventoryStats.lowStockItems > 0) {
      activities.push({
        id: 'stock-alert-1',
        type: 'stock',
        title: 'Low Stock Alert',
        description: `${inventoryStats.lowStockItems} items running low`,
        timestamp: '1 hour ago',
        status: 'warning',
      });
    }

    return activities.slice(0, 4);
  }

  private getTimeAgo(date: Date): string {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} mins ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  }

  async getSystemLogs(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    // Get recent login activities
    const recentLogins = await User.findAll({
      where: {
        lastLogin: {
          [Op.ne]: null,
        },
      },
      offset: skip,
      limit: limit,
      order: [['last_login', 'DESC']],
      attributes: ['id', 'email', 'name', 'last_login'],
      include: [
        {
          model: Role,
          as: 'role',
          attributes: ['name']
        }
      ]
    });

    const total = await User.count({
      where: {
        lastLogin: {
          [Op.ne]: null,
        },
      },
    });

    return {
      logs: recentLogins,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

