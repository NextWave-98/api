import { SaleType, SaleStatus, DiscountType, PaymentStatus, PaymentMethod } from '../../enums';

// ============================================
// CREATE SALE DTOs
// ============================================

export interface CreateSaleItemDTO {
  productId: string;
  quantity: number;
  unitPrice: number;
  costPrice: number;
  discount?: number;
  tax?: number;
  warrantyMonths?: number;
}

export interface CreateSalePaymentItemDTO {
  method: PaymentMethod | string;
  /**
   * For CASH payments: This should be the cash received amount (tendered amount),
   * not the net payment. Change will be calculated as: amount - totalAmount
   *
   * For other payment methods: This should be the exact payment amount
   *
   * Example: If bill is Rs 356,000 and customer gives Rs 360,000 cash:
   * - amount should be 360,000 (cash received)
   * - Change will be 4,000
   */
  amount: number;
  reference?: string;
}

export interface CreateSaleDTO {
  // Customer (optional for walk-in)
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;

  // Location & Staff
  locationId: string;
  soldById: string;

  // Sale Type
  saleType?: SaleType;
  saleChannel?: string;
  type?: string; // Alternative naming from frontend

  // Items
  items: CreateSaleItemDTO[];

  // Financial
  discount?: number;
  discountType?: DiscountType;
  discountReason?: string;
  taxRate?: number;

  // Payment (legacy single payment fields)
  paymentMethod?: PaymentMethod;
  paymentReference?: string;
  paidAmount?: number;

  // Payment (new array format from POS)
  payments?: CreateSalePaymentItemDTO[];

  // Metadata
  notes?: string;
}

// ============================================
// PAYMENT DTOs
// ============================================

export interface CreateSalePaymentDTO {
  saleId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  reference?: string;
  receivedById: string;
  notes?: string;
}

// ============================================
// REFUND DTOs
// ============================================

export interface RefundItemDTO {
  productId: string;
  quantity: number; // Quantity being returned
}

export interface CreateSaleRefundDTO {
  saleId: string;
  amount: number;
  reason: string;
  refundMethod: PaymentMethod;
  processedById: string;
  items?: RefundItemDTO[]; // Optional: Specific items being returned for stock restoration
}

// ============================================
// QUERY DTOs
// ============================================

export interface SalesQueryDTO {
  locationId?: string;
  customerId?: string;
  soldById?: string;
  status?: SaleStatus;
  paymentStatus?: PaymentStatus;
  saleType?: SaleType;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
  period?: 'today' | 'yesterday' | 'week' | 'month' | 'year' | 'custom';
}

// ============================================
// DASHBOARD/REPORTS DTOs (Keep existing)
// ============================================

export interface SalesOverviewDTO {
  totalRevenue: number;        // Net revenue (after refunds)
  grossRevenue?: number;       // Gross revenue (before refunds)
  totalRefunds?: number;       // Total refunds
  totalProfit: number;
  totalOrders: number;
  averageOrderValue: number;
  periodStart: Date;
  periodEnd: Date;
}

export interface SalesTrendDTO {
  date: string;
  revenue: number;
  orders: number;
  profit: number;
}

export interface TopProductDTO {
  productId: string;
  productName: string;
  quantitySold: number;
  revenue: number;
  profit: number;
}

export interface LocationPerformanceDTO {
  locationId: string;
  locationName: string;
  revenue: number;
  orders: number;
  averageOrderValue: number;
}

export interface StaffPerformanceDTO {
  staffId: string;
  staffName: string;
  ordersHandled: number;
  revenue: number;
  averageOrderValue: number;
}

export interface PaymentMethodStatsDTO {
  paymentMethod: string;
  totalAmount: number;
  count: number;
  percentage: number;
}

export interface RevenueBreakdownDTO {
  labourRevenue: number;
  partsRevenue: number;
  productsRevenue: number;
  totalRevenue: number;
}

export interface ProfitAnalysisDTO {
  totalRevenue: number;
  totalCost: number;
  grossProfit: number;
  profitMargin: number;
} 

export interface SalesDetailDTO {
  jobSheetId: string;
  jobNumber: string;
  customerName: string;
  locationName: string;
  staffName: string;
  totalAmount: number;
  paidAmount: number;
  status: string;
  createdAt: Date;
  completedAt?: Date;
  type?: 'JobSheet' | 'POS';
}

export interface CustomerInsightsDTO {
  totalCustomers: number;
  newCustomers: number;
  returningCustomers: number;
  averageLifetimeValue: number;
  topCustomers: Array<{
    customerId: string;
    customerName: string;
    totalSpent: number;
    orderCount: number;
  }>;
}

export interface DashboardDTO {
  summary: {
    totalSales: number;
    totalRevenue: number;
    totalPaid: number;
    totalOutstanding: number;
    avgOrderValue: number;
    profitMargin: number;
  };
  trends: Array<{
    date: string;
    salesCount: number;
    revenue: number;
    avgOrderValue: number;
  }>;
  topLocations: Array<{
    locationId: string;
    locationName: string;
    salesCount: number;
    revenue: number;
    growth: number;
  }>;
  topStaff: Array<{
    staffId: string;
    staffName: string;
    salesCount: number;
    revenue: number;
    commission: number;
  }>;
  topProducts: Array<{
    productId: string;
    productName: string;
    quantitySold: number;
    revenue: number;
    profit: number;
  }>;
  paymentMethodBreakdown: Array<{
    method: string;
    count: number;
    amount: number;
    percentage: number;
  }>;
  recentSales: Array<{
    id: string;
    invoiceNumber: string;
    customerName: string;
    locationName: string;
    totalAmount: number;
    paymentStatus: string;
    date: string;
  }>;
  growth: {
    salesGrowth: number;
    revenueGrowth: number;
    aovGrowth: number;
    profitGrowth: number;
  };
}

