import { z } from 'zod';

// Report Type Enum
export const ReportTypeSchema = z.enum([
  'sales',
  'profit_loss',
  'inventory',
  'staff_performance',
  'customer_analysis',
  'shop_performance',
  'jobsheet',
]);

// Report Period Enum
export const ReportPeriodSchema = z.enum([
  'today',
  'week',
  'month',
  'quarter',
  'year',
  'custom',
]);

// Report Format Enum
export const ReportFormatSchema = z.enum(['json', 'pdf', 'excel', 'csv']);

// Base Report Request Schema
export const GenerateReportSchema = z.object({
  reportType: ReportTypeSchema,
  period: ReportPeriodSchema,
  format: ReportFormatSchema.optional().default('json'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  locationId: z.string().uuid().optional(),
  branchId: z.string().uuid().optional(),
});

export type GenerateReportDto = z.infer<typeof GenerateReportSchema>;

// Download Report Schema
export const DownloadReportSchema = z.object({
  reportType: ReportTypeSchema,
  period: ReportPeriodSchema,
  format: ReportFormatSchema,
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  locationId: z.string().uuid().optional(),
  branchId: z.string().uuid().optional(),
});

export type DownloadReportDto = z.infer<typeof DownloadReportSchema>;

// Sales Report Response Interface
export interface SalesReportData {
  period: string;
  summary: {
    totalSales: number;
    totalRevenue: number;
    totalPaid: number;
    totalRefunded: number;
    netRevenue: number;
    totalProfit: number;
    profitMargin: number;
    averageOrderValue: number;
  };
  topProducts: Array<{
    productId: string;
    productName: string;
    sku: string;
    category: string;
    quantity: number;
    revenue: number;
    profit: number;
    profitMargin: number | string;
    sales: number;
  }>;
  topLocations: Array<{
    locationId: string;
    locationName: string;
    locationType: string;
    sales: number;
    revenue: number;
    profit: number;
    profitMargin: number | string;
  }>;
  salesByDay: Array<{
    date: string;
    sales: number;
    revenue: number;
    profit: number;
    averageOrderValue: number;
    uniqueCustomers: number;
  }>;
  paymentMethods: Array<{
    method: string;
    count: number;
    amount: number;
    salesCount: number;
    averageTransaction: number;
  }>;
  refundAnalysis: {
    totalRefunds: number;
    refundCount: number;
    refundRate: number | string;
    topRefundReasons: Array<{
      reason: string;
      count: number;
      amount: number;
    }>;
  };
  topCustomers: Array<{
    customerId: string;
    customerName: string;
    phone: string;
    email: string;
    purchases: number;
    totalSpent: number;
    averageOrderValue: number;
  }>;
}

// Profit & Loss Report Response Interface
export interface ProfitLossReportData {
  period: string;
  summary: {
    totalRevenue: number;
    costOfGoodsSold: number;
    grossProfit: number;
    grossProfitMargin: number;
    operatingExpenses: number;
    netProfit: number;
    netProfitMargin: number;
  };
  incomeBreakdown: {
    posSales: {
      revenue: number;
      cost: number;
      profit: number;
      count: number;
    };
    jobsheets: {
      revenue: number;
      cost: number;
      profit: number;
      count: number;
    };
    otherSales: {
      revenue: number;
      cost: number;
      profit: number;
      count: number;
    };
  };
  operatingExpenses: {
    supplierPayments: number;
    saleRefunds: number;
    salaries: number;
    rent: number;
    utilities: number;
    marketing: number;
    other: number;
    total: number;
  };
  breakdown: Array<{
    date: string;
    revenue: number;
    costs: number;
    profit: number;
    profitMargin: number;
    salesCount: number;
    jobsheetCount: number;
  }>;
  paymentMethods: Array<{
    method: string;
    amount: number;
    percentage: number;
  }>;
  supplierPayments: {
    total: number;
    count: number;
    details: Array<{
      paymentNumber: string;
      supplierName: string;
      amount: number;
      paymentMethod: string;
      paymentDate: Date;
      purchaseOrderNumber: string;
      status: string;
    }>;
  };
  jobsheets: {
    total: number;
    count: number;
    topJobsheets: Array<{
      jobNumber: string;
      customerName: string;
      totalCost: number;
      status: string;
      assignedTo: string;
      location: string;
      createdAt: Date;
    }>;
  };
  refunds: {
    total: number;
    count: number;
  };
}

// Inventory Report Response Interface
export interface InventoryReportData {
  summary: {
    totalItems: number;
    totalValue: number;
    totalRetailValue: number;
    potentialProfit: number;
    totalQuantity: number;
    lowStockItems: number;
    outOfStockItems: number;
    excessStockItems: number;
    optimalStockItems: number;
    inventoryTurnover: number;
    stockHealthScore: string;
  };
  categoryWise: any;
  fastMovingItems: Array<{
    productId: string;
    productName: string;
    sku: string;
    quantitySold: number;
    turnoverRate: number;
    revenue: number;
  }>;
  slowMovingItems: Array<{
    productId: string;
    productName: string;
    sku: string;
    quantity: number;
    daysInStock: number;
    value: number;
    location: string;
  }>;
  lowStockAlerts: Array<{
    productId: string;
    productName: string;
    sku: string;
    currentStock: number;
    minStockLevel: number;
    reorderQuantity: number;
    location: string;
    suppliers: string;
  }>;
  outOfStockList: Array<{
    productId: string;
    productName: string;
    sku: string;
    minStockLevel: number;
    reorderQuantity: number;
    location: string;
    suppliers: string;
  }>;
  locationWise: Array<{
    locationId: string;
    locationName: string;
    locationType: string;
    totalItems: number;
    totalQuantity: number;
    totalValue: number;
    lowStockCount: number;
    outOfStockCount: number;
    stockHealth: string;
  }>;
  stockAging: {
    fresh: number;
    moderate: number;
    old: number;
  };
}

// Staff Performance Report Response Interface
export interface StaffPerformanceReportData {
  period: string;
  summary: {
    totalStaff: number;
    activeStaff: number;
    inactiveStaff: number;
    totalRevenue: number;
    totalSales: number;
    totalJobs: number;
    averageSalesPerStaff: number;
  };
  topPerformers: Array<{
    staffId: string;
    staffName: string;
    email: string;
    phone: string;
    position: string;
    totalSales: number;
    salesRevenue: number;
    salesProfit: number;
    completedJobs: number;
    jobRevenue: number;
    totalRevenue: number;
    totalProfit: number;
    uniqueCustomers: number;
    locationsServed: number;
    averageOrderValue: number;
    averageRating: number;
  }>;
  departmentWise: Array<{
    department: string;
    totalStaff: number;
    totalSales: number;
    totalRevenue: number;
    totalJobs: number;
    averageRevenuePerStaff: number;
  }>;
  performanceTrends: Array<{
    date: string;
    sales: number;
    jobs: number;
    revenue: number;
    activeStaff: number;
    averageRevenuePerStaff: number;
  }>;
  underperformingStaff: Array<{
    staffId: string;
    staffName: string;
    nicNumber: string;
    email: string;
  }>;
}

// Customer Analysis Report Response Interface
export interface CustomerAnalysisReportData {
  period: string;
  summary: {
    totalCustomers: number;
    newCustomers: number;
    returningCustomers: number;
    activeCustomers: number;
    customerRetentionRate: number;
    averageCustomerValue: number;
    customerLifetimeValue: number;
    totalRevenue: number;
  };
  segmentation: {
    highValue: number;
    mediumValue: number;
    lowValue: number;
  };
  topCustomers: Array<{
    customerId: string;
    customerName: string;
    phone: string;
    email: string;
    customerType: string;
    location: string;
    totalPurchases: number;
    totalJobsheets: number;
    totalSpent: number;
    averageOrderValue: number;
    itemsPurchased: number;
    preferredPaymentMethods: string;
    lastPurchase: string;
    firstPurchase: string;
    daysSinceLastPurchase: number;
  }>;
  atRiskCustomers: Array<{
    customerId: string;
    customerName: string;
    phone: string;
    totalSpent: number;
    lastPurchase: string;
    daysSinceLastPurchase: number;
  }>;
  customersByType: Array<{
    type: string;
    count: number;
    revenue: number;
    averageSpent: number;
    percentage: string;
  }>;
  customersByLocation: Array<{
    locationId: string;
    locationName: string;
    customerCount: number;
    revenue: number;
    averageRevenuePerCustomer: number;
  }>;
}

// Shop Performance Report Response Interface
export interface ShopPerformanceReportData {
  period: string;
  summary: {
    totalLocations: number;
    activeLocations: number;
    totalRevenue: number;
    totalProfit: number;
    totalProfitMargin: number;
    averageRevenuePerLocation: number;
    totalSales: number;
    totalJobsheets: number;
  };
  topPerformingLocations: Array<{
    locationId: string;
    locationName: string;
    locationType: string;
    address: string;
    totalSales: number;
    salesRevenue: number;
    jobsheets: number;
    jobRevenue: number;
    totalRevenue: number;
    profit: number;
    profitMargin: number;
    customersServed: number;
    staffCount: number;
    revenuePerStaff: number;
    inventoryValue: number;
    lowStockItems: number;
    outOfStockItems: number;
    averageOrderValue: number;
  }>;
  locationComparison: Array<{
    locationId: string;
    locationName: string;
    currentRevenue: number;
    previousRevenue: number;
    growth: number;
    growthTrend: string;
  }>;
  performanceByType: Array<{
    type: string;
    locations: number;
    revenue: number;
    profit: number;
    sales: number;
    averageRevenuePerLocation: number;
  }>;
  performanceTrends: Array<{
    date: string;
    revenue: number;
    sales: number;
    activeLocations: number;
    averageRevenuePerLocation: number;
  }>;
}

// Jobsheet Report Response Interface
export interface JobsheetReportData {
  period: string;
  summary: {
    totalJobsheets: number;
    completedJobs: number;
    pendingJobs: number;
    inProgressJobs: number;
    completionRate: string;
    totalRevenue: number;
    avgJobValue: number;
    uniqueCustomers: number;
    activeTechnicians: number;
  };
  statusSummary: Array<{
    status: string;
    count: number;
    revenue: number;
    avgCompletionTime: number;
    percentage: string;
  }>;
  prioritySummary: Array<{
    priority: string;
    count: number;
    completed: number;
    completionRate: string;
    revenue: number;
    percentage: string;
  }>;
  deviceTypeSummary: Array<{
    deviceType: string;
    count: number;
    revenue: number;
    avgRevenue: number;
    percentage: string;
  }>;
  topTechnicians: Array<{
    technicianId: string;
    technicianName: string;
    email: string;
    totalJobs: number;
    completedJobs: number;
    completionRate: string;
    revenue: number;
    avgCompletionTime: number;
    uniqueCustomers: number;
  }>;
  topCustomers: Array<{
    customerId: string;
    customerName: string;
    phone: string;
    email: string;
    totalJobs: number;
    completedJobs: number;
    totalSpent: number;
    averageJobValue: number;
    lastJobDate: string;
  }>;
  topJobsheets: Array<{
    jobNumber: string;
    customerName: string;
    customerPhone: string;
    technicianName: string;
    totalCost: number;
    status: string;
    priority: string;
    deviceType: string;
    location: string;
    createdAt: Date;
    completedAt: Date | null;
    completionTime: number | null;
  }>;
  locationSummary: Array<{
    locationId: string;
    locationName: string;
    locationType: string;
    totalJobs: number;
    completedJobs: number;
    completionRate: string;
    revenue: number;
    techniciansCount: number;
    avgRevenuePerJob: number;
  }>;
  trendsByDay: Array<{
    date: string;
    created: number;
    completed: number;
    revenue: number;
    completionRate: string;
    activeTechnicians: number;
  }>;
}

// Generic Report Response
export interface ReportResponse<T> {
  success: boolean;
  reportType: string;
  period: string;
  generatedAt: string;
  data: T;
}

