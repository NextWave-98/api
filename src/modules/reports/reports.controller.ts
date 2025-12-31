import { Request, Response } from 'express';
import { z } from 'zod';
import reportsService from './reports.service';
import { GenerateReportSchema, DownloadReportSchema } from './reports.dto';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

export class ReportsController {
  /**
   * Round number to 2 decimal places
   */
  private roundNumber(num: number | string | null | undefined): number {
    if (num === null || num === undefined || num === '') return 0;
    const value = typeof num === 'string' ? parseFloat(num) : num;
    if (isNaN(value)) return 0;
    return Math.round(value * 100) / 100;
  }

  /**
   * Format number with 2 decimal places
   */
  private formatNumber(num: number | string | null | undefined): string {
    return this.roundNumber(num).toFixed(2);
  }
  /**
   * Generate Report
   * POST /api/reports/generate
   */
  async generateReport(req: Request, res: Response) {
    try {
      const validatedData = GenerateReportSchema.parse(req.body);

      let reportData: any;

      switch (validatedData.reportType) {
        case 'sales':
          reportData = await reportsService.generateSalesReport(validatedData);
          break;
        case 'profit_loss':
          reportData = await reportsService.generateProfitLossReport(validatedData);
          break;
        case 'inventory':
          reportData = await reportsService.generateInventoryReport(validatedData);
          break;
        case 'staff_performance':
          reportData = await reportsService.generateStaffPerformanceReport(validatedData);
          break;
        case 'customer_analysis':
          reportData = await reportsService.generateCustomerAnalysisReport(validatedData);
          break;
        case 'shop_performance':
          reportData = await reportsService.generateShopPerformanceReport(validatedData);
          break;
        case 'jobsheet':
          reportData = await reportsService.generateJobsheetReport(validatedData);
          break;
        default:
          return res.status(400).json({
            success: false,
            message: 'Invalid report type',
          });
      }

      return res.status(200).json({
        success: true,
        reportType: validatedData.reportType,
        period: validatedData.period,
        generatedAt: new Date().toISOString(),
        data: reportData,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.issues,
        });
      }
      console.error('Generate report error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to generate report',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Download Report as Excel
   * POST /api/reports/download
   */
  async downloadReport(req: Request, res: Response) {
    try {
      const validatedData = DownloadReportSchema.parse(req.body);

      // Generate report data
      let reportData: any;
      let reportTitle: string;

      switch (validatedData.reportType) {
        case 'sales':
          reportData = await reportsService.generateSalesReport(validatedData);
          reportTitle = 'Sales Report';
          break;
        case 'profit_loss':
          reportData = await reportsService.generateProfitLossReport(validatedData);
          reportTitle = 'Profit & Loss Report';
          break;
        case 'inventory':
          reportData = await reportsService.generateInventoryReport(validatedData);
          reportTitle = 'Inventory Report';
          break;
        case 'staff_performance':
          reportData = await reportsService.generateStaffPerformanceReport(validatedData);
          reportTitle = 'Staff Performance Report';
          break;
        case 'customer_analysis':
          reportData = await reportsService.generateCustomerAnalysisReport(validatedData);
          reportTitle = 'Customer Analysis Report';
          break;
        case 'shop_performance':
          reportData = await reportsService.generateShopPerformanceReport(validatedData);
          reportTitle = 'Shop Performance Report';
          break;
        case 'jobsheet':
          reportData = await reportsService.generateJobsheetReport(validatedData);
          reportTitle = 'Jobsheet Report';
          break;
        default:
          return res.status(400).json({
            success: false,
            message: 'Invalid report type',
          });
      }

      // Format based on requested format
      if (validatedData.format === 'json') {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="${reportTitle.replace(/\s+/g, '_')}_${Date.now()}.json"`);
        return res.status(200).json({
          success: true,
          reportType: validatedData.reportType,
          period: validatedData.period,
          generatedAt: new Date().toISOString(),
          data: reportData,
        });
      } else if (validatedData.format === 'excel') {
        const workbook = await this.generateExcelReport(reportTitle, validatedData.reportType, reportData, validatedData.period);

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${reportTitle.replace(/\s+/g, '_')}_${Date.now()}.xlsx"`);

        await workbook.xlsx.write(res);
        return res.end();
      } else if (validatedData.format === 'pdf') {
        const pdfBuffer = await this.generatePDFReport(reportTitle, validatedData.reportType, reportData, validatedData.period);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${reportTitle.replace(/\s+/g, '_')}_${Date.now()}.pdf"`);

        return res.status(200).send(pdfBuffer);
      } else if (validatedData.format === 'csv') {
        const csv = this.generateCSVReport(validatedData.reportType, reportData);

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${reportTitle.replace(/\s+/g, '_')}_${Date.now()}.csv"`);

        return res.status(200).send(csv);
      }

      return res.status(400).json({
        success: false,
        message: 'Invalid format',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.issues,
        });
      }
      console.error('Download report error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to download report',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Generate Excel Report
   */
  private async generateExcelReport(title: string, reportType: string, data: any, period: string): Promise<ExcelJS.Workbook> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(title);

    // Add title
    worksheet.mergeCells('A1:E1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = title;
    titleCell.font = { size: 16, bold: true };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // Add metadata
    worksheet.getCell('A2').value = `Period: ${period}`;
    worksheet.getCell('A3').value = `Generated: ${new Date().toLocaleString()}`;

    worksheet.addRow([]);

    // Add data based on report type
    switch (reportType) {
      case 'sales':
        this.addSalesDataToExcel(worksheet, data);
        break;
      case 'profit_loss':
        this.addProfitLossDataToExcel(worksheet, data);
        break;
      case 'inventory':
        this.addInventoryDataToExcel(worksheet, data);
        break;
      case 'staff_performance':
        this.addStaffPerformanceDataToExcel(worksheet, data);
        break;
      case 'customer_analysis':
        this.addCustomerAnalysisDataToExcel(worksheet, data);
        break;
      case 'shop_performance':
        this.addShopPerformanceDataToExcel(worksheet, data);
        break;
      case 'jobsheet':
        this.addJobsheetDataToExcel(worksheet, data);
        break;
    }

    return workbook;
  }

  /**
   * Add Sales Data to Excel
   */
  private addSalesDataToExcel(worksheet: ExcelJS.Worksheet, data: any) {
    const summary = data.summary || {};
    worksheet.addRow(['Summary']);
    worksheet.addRow(['Total Sales', summary.totalSales || 0]);
    worksheet.addRow(['Total Revenue', `Rs. ${this.formatNumber(summary.totalRevenue)}`]);
    worksheet.addRow(['Total Paid', `Rs. ${this.formatNumber(summary.totalPaid)}`]);
    worksheet.addRow(['Total Refunded', `Rs. ${this.formatNumber(summary.totalRefunded)}`]);
    worksheet.addRow(['Net Revenue', `Rs. ${this.formatNumber(summary.netRevenue)}`]);
    worksheet.addRow(['Total Profit', `Rs. ${this.formatNumber(summary.totalProfit)}`]);
    worksheet.addRow(['Profit Margin', `${this.formatNumber(summary.profitMargin)}%`]);
    worksheet.addRow(['Average Order Value', `Rs. ${this.formatNumber(summary.averageOrderValue)}`]);
    worksheet.addRow([]);

    if (data.topProducts && data.topProducts.length > 0) {
      worksheet.addRow(['Top Products']);
      worksheet.addRow(['Product Name', 'SKU', 'Category', 'Quantity', 'Revenue', 'Profit', 'Profit Margin %']);
      (data.topProducts || []).forEach((product: any) => {
        worksheet.addRow([
          product.productName || 'N/A',
          product.sku || 'N/A',
          product.category || 'N/A',
          product.quantity || 0,
          this.roundNumber(product.revenue),
          this.roundNumber(product.profit),
          this.roundNumber(product.profitMargin)
        ]);
      });
      worksheet.addRow([]);
    }

    if (data.topLocations && data.topLocations.length > 0) {
      worksheet.addRow(['Top Locations']);
      worksheet.addRow(['Location Name', 'Type', 'Sales', 'Revenue', 'Profit', 'Profit Margin %']);
      (data.topLocations || []).forEach((location: any) => {
        worksheet.addRow([
          location.locationName || 'N/A',
          location.locationType || 'N/A',
          location.sales || 0,
          this.roundNumber(location.revenue),
          this.roundNumber(location.profit),
          this.roundNumber(location.profitMargin)
        ]);
      });
      worksheet.addRow([]);
    }

    if (data.salesByDay && data.salesByDay.length > 0) {
      worksheet.addRow(['Sales by Day']);
      worksheet.addRow(['Date', 'Sales', 'Revenue', 'Profit', 'Avg Order Value', 'Unique Customers']);
      (data.salesByDay || []).forEach((day: any) => {
        worksheet.addRow([
          day.date || 'N/A',
          day.sales || 0,
          this.roundNumber(day.revenue),
          this.roundNumber(day.profit),
          this.roundNumber(day.averageOrderValue),
          day.uniqueCustomers || 0
        ]);
      });
      worksheet.addRow([]);
    }

    if (data.paymentMethods && data.paymentMethods.length > 0) {
      worksheet.addRow(['Payment Methods']);
      worksheet.addRow(['Method', 'Count', 'Amount', 'Sales Count', 'Avg Transaction']);
      (data.paymentMethods || []).forEach((pm: any) => {
        worksheet.addRow([
          pm.method || 'N/A',
          pm.count || 0,
          this.roundNumber(pm.amount),
          pm.salesCount || 0,
          this.roundNumber(pm.averageTransaction)
        ]);
      });
      worksheet.addRow([]);
    }

    if (data.refundAnalysis) {
      worksheet.addRow(['Refund Analysis']);
      worksheet.addRow(['Total Refunds', `Rs. ${this.formatNumber(data.refundAnalysis.totalRefunds)}`]);
      worksheet.addRow(['Refund Count', data.refundAnalysis.refundCount || 0]);
      worksheet.addRow(['Refund Rate', `${this.formatNumber(data.refundAnalysis.refundRate)}%`]);
      if (data.refundAnalysis.topRefundReasons && data.refundAnalysis.topRefundReasons.length > 0) {
        worksheet.addRow([]);
        worksheet.addRow(['Top Refund Reasons']);
        worksheet.addRow(['Reason', 'Count', 'Amount']);
        (data.refundAnalysis.topRefundReasons || []).forEach((r: any) => {
          worksheet.addRow([
            r.reason || 'N/A',
            r.count || 0,
            this.roundNumber(r.amount)
          ]);
        });
      }
      worksheet.addRow([]);
    }

    if (data.topCustomers && data.topCustomers.length > 0) {
      worksheet.addRow(['Top Customers']);
      worksheet.addRow(['Customer Name', 'Phone', 'Purchases', 'Total Spent', 'Avg Order Value']);
      (data.topCustomers || []).forEach((customer: any) => {
        worksheet.addRow([
          customer.customerName || 'N/A',
          customer.phone || 'N/A',
          customer.purchases || 0,
          this.roundNumber(customer.totalSpent),
          this.roundNumber(customer.averageOrderValue)
        ]);
      });
    }
  }

  /**
   * Add Profit & Loss Data to Excel
   */
  private addProfitLossDataToExcel(worksheet: ExcelJS.Worksheet, data: any) {
    const summary = data.summary || {};
    worksheet.addRow(['Financial Summary']);
    worksheet.addRow(['Total Revenue', `Rs. ${this.formatNumber(summary.totalRevenue)}`]);
    worksheet.addRow(['Cost of Goods Sold', `Rs. ${this.formatNumber(summary.costOfGoodsSold)}`]);
    worksheet.addRow(['Gross Profit', `Rs. ${this.formatNumber(summary.grossProfit)}`]);
    worksheet.addRow(['Gross Profit Margin', `${this.formatNumber(summary.grossProfitMargin)}%`]);
    worksheet.addRow(['Operating Expenses', `Rs. ${this.formatNumber(summary.operatingExpenses)}`]);
    worksheet.addRow(['Net Profit', `Rs. ${this.formatNumber(summary.netProfit)}`]);
    worksheet.addRow(['Net Profit Margin', `${this.formatNumber(summary.netProfitMargin)}%`]);
    worksheet.addRow([]);

    if (data.incomeBreakdown) {
      worksheet.addRow(['Income Breakdown']);
      worksheet.addRow(['Source', 'Revenue', 'Cost', 'Profit', 'Count']);
      worksheet.addRow(['POS Sales', this.roundNumber(data.incomeBreakdown.posSales?.revenue), this.roundNumber(data.incomeBreakdown.posSales?.cost), this.roundNumber(data.incomeBreakdown.posSales?.profit), data.incomeBreakdown.posSales?.count || 0]);
      worksheet.addRow(['Jobsheets', this.roundNumber(data.incomeBreakdown.jobsheets?.revenue), this.roundNumber(data.incomeBreakdown.jobsheets?.cost), this.roundNumber(data.incomeBreakdown.jobsheets?.profit), data.incomeBreakdown.jobsheets?.count || 0]);
      worksheet.addRow(['Other Sales', this.roundNumber(data.incomeBreakdown.otherSales?.revenue), this.roundNumber(data.incomeBreakdown.otherSales?.cost), this.roundNumber(data.incomeBreakdown.otherSales?.profit), data.incomeBreakdown.otherSales?.count || 0]);
      worksheet.addRow([]);
    }

    if (data.operatingExpenses) {
      worksheet.addRow(['Operating Expenses']);
      worksheet.addRow(['Expense Type', 'Amount']);
      worksheet.addRow(['Supplier Payments', this.roundNumber(data.operatingExpenses.supplierPayments)]);
      worksheet.addRow(['Sale Refunds', this.roundNumber(data.operatingExpenses.saleRefunds)]);
      worksheet.addRow(['Salaries', this.roundNumber(data.operatingExpenses.salaries)]);
      worksheet.addRow(['Rent', this.roundNumber(data.operatingExpenses.rent)]);
      worksheet.addRow(['Utilities', this.roundNumber(data.operatingExpenses.utilities)]);
      worksheet.addRow(['Marketing', this.roundNumber(data.operatingExpenses.marketing)]);
      worksheet.addRow(['Other', this.roundNumber(data.operatingExpenses.other)]);
      worksheet.addRow(['Total', this.roundNumber(data.operatingExpenses.total)]);
      worksheet.addRow([]);
    }

    if (data.breakdown && data.breakdown.length > 0) {
      worksheet.addRow(['Daily Breakdown']);
      worksheet.addRow(['Date', 'Revenue', 'Costs', 'Profit', 'Profit Margin %', 'Sales Count', 'Jobsheet Count']);
      (data.breakdown || []).forEach((day: any) => {
        worksheet.addRow([
          day.date || 'N/A',
          this.roundNumber(day.revenue),
          this.roundNumber(day.costs),
          this.roundNumber(day.profit),
          this.roundNumber(day.profitMargin),
          day.salesCount || 0,
          day.jobsheetCount || 0
        ]);
      });
      worksheet.addRow([]);
    }

    if (data.paymentMethods && data.paymentMethods.length > 0) {
      worksheet.addRow(['Payment Methods']);
      worksheet.addRow(['Method', 'Amount', 'Percentage']);
      (data.paymentMethods || []).forEach((pm: any) => {
        worksheet.addRow([
          pm.method || 'N/A',
          this.roundNumber(pm.amount),
          this.roundNumber(pm.percentage)
        ]);
      });
      worksheet.addRow([]);
    }

    if (data.supplierPayments && data.supplierPayments.details && data.supplierPayments.details.length > 0) {
      worksheet.addRow(['Supplier Payments']);
      worksheet.addRow(['Total', `Rs. ${this.formatNumber(data.supplierPayments.total)}`]);
      worksheet.addRow(['Count', data.supplierPayments.count || 0]);
      worksheet.addRow([]);
      worksheet.addRow(['Payment #', 'Supplier', 'Amount', 'Method', 'Date', 'PO #']);
      (data.supplierPayments.details || []).forEach((sp: any) => {
        worksheet.addRow([
          sp.paymentNumber || 'N/A',
          sp.supplierName || 'N/A',
          this.roundNumber(sp.amount),
          sp.paymentMethod || 'N/A',
          sp.paymentDate ? new Date(sp.paymentDate).toLocaleDateString() : 'N/A',
          sp.purchaseOrderNumber || 'N/A'
        ]);
      });
      worksheet.addRow([]);
    }

    if (data.jobsheets && data.jobsheets.topJobsheets && data.jobsheets.topJobsheets.length > 0) {
      worksheet.addRow(['Top Jobsheets']);
      worksheet.addRow(['Total', `Rs. ${this.formatNumber(data.jobsheets.total)}`]);
      worksheet.addRow(['Count', data.jobsheets.count || 0]);
      worksheet.addRow([]);
      worksheet.addRow(['Job #', 'Customer', 'Amount', 'Status', 'Assigned To', 'Location']);
      (data.jobsheets.topJobsheets || []).forEach((job: any) => {
        worksheet.addRow([
          job.jobNumber || 'N/A',
          job.customerName || 'N/A',
          this.roundNumber(job.totalCost),
          job.status || 'N/A',
          job.assignedTo || 'N/A',
          job.location || 'N/A'
        ]);
      });
    }
  }

  /**
   * Add Inventory Data to Excel
   */
  private addInventoryDataToExcel(worksheet: ExcelJS.Worksheet, data: any) {
    const summary = data.summary || {};
    worksheet.addRow(['Inventory Summary']);
    worksheet.addRow(['Total Items', summary.totalItems || 0]);
    worksheet.addRow(['Total Value', `Rs. ${this.formatNumber(summary.totalValue)}`]);
    worksheet.addRow(['Total Retail Value', `Rs. ${this.formatNumber(summary.totalRetailValue)}`]);
    worksheet.addRow(['Potential Profit', `Rs. ${this.formatNumber(summary.potentialProfit)}`]);
    worksheet.addRow(['Total Quantity', summary.totalQuantity || 0]);
    worksheet.addRow(['Low Stock Items', summary.lowStockItems || 0]);
    worksheet.addRow(['Out of Stock Items', summary.outOfStockItems || 0]);
    worksheet.addRow(['Excess Stock Items', summary.excessStockItems || 0]);
    worksheet.addRow(['Optimal Stock Items', summary.optimalStockItems || 0]);
    worksheet.addRow(['Inventory Turnover', this.formatNumber(summary.inventoryTurnover)]);
    worksheet.addRow(['Stock Health Score', summary.stockHealthScore || '0%']);
    worksheet.addRow([]);

    if (data.categoryWise && data.categoryWise.length > 0) {
      worksheet.addRow(['Category Wise Breakdown']);
      worksheet.addRow(['Category Name', 'Items', 'Quantity', 'Value', 'Retail Value', 'Potential Profit', 'Profit Margin %']);
      (data.categoryWise || []).forEach((category: any) => {
        worksheet.addRow([
          category.categoryName || 'N/A',
          category.items || 0,
          category.quantity || 0,
          this.roundNumber(category.value),
          this.roundNumber(category.retailValue),
          this.roundNumber(category.potentialProfit),
          this.roundNumber(category.profitMargin)
        ]);
      });
      worksheet.addRow([]);
    }

    if (data.fastMovingItems && data.fastMovingItems.length > 0) {
      worksheet.addRow(['Fast Moving Items']);
      worksheet.addRow(['Product Name', 'SKU', 'Category', 'Quantity Sold', 'Current Stock', 'Turnover Rate', 'Revenue', 'Location']);
      (data.fastMovingItems || []).forEach((item: any) => {
        worksheet.addRow([
          item.productName || 'N/A',
          item.sku || 'N/A',
          item.category || 'N/A',
          item.quantitySold || 0,
          item.currentStock || 0,
          this.roundNumber(item.turnoverRate),
          this.roundNumber(item.revenue),
          item.location || 'N/A'
        ]);
      });
      worksheet.addRow([]);
    }

    if (data.slowMovingItems && data.slowMovingItems.length > 0) {
      worksheet.addRow(['Slow Moving Items']);
      worksheet.addRow(['Product Name', 'SKU', 'Category', 'Quantity', 'Days in Stock', 'Value', 'Location']);
      (data.slowMovingItems || []).forEach((item: any) => {
        worksheet.addRow([
          item.productName || 'N/A',
          item.sku || 'N/A',
          item.category || 'N/A',
          item.quantity || 0,
          item.daysInStock || 0,
          this.roundNumber(item.value),
          item.location || 'N/A'
        ]);
      });
      worksheet.addRow([]);
    }

    if (data.lowStockAlerts && data.lowStockAlerts.length > 0) {
      worksheet.addRow(['Low Stock Alerts']);
      worksheet.addRow(['Product Name', 'SKU', 'Current Stock', 'Min Stock', 'Reorder Qty', 'Location', 'Suppliers']);
      (data.lowStockAlerts || []).forEach((alert: any) => {
        worksheet.addRow([
          alert.productName || 'N/A',
          alert.sku || 'N/A',
          alert.currentStock || 0,
          alert.minStockLevel || 0,
          alert.reorderQuantity || 0,
          alert.location || 'N/A',
          alert.suppliers || 'N/A'
        ]);
      });
      worksheet.addRow([]);
    }

    if (data.outOfStockList && data.outOfStockList.length > 0) {
      worksheet.addRow(['Out of Stock Items']);
      worksheet.addRow(['Product Name', 'SKU', 'Min Stock', 'Reorder Qty', 'Location', 'Suppliers']);
      (data.outOfStockList || []).forEach((item: any) => {
        worksheet.addRow([
          item.productName || 'N/A',
          item.sku || 'N/A',
          item.minStockLevel || 0,
          item.reorderQuantity || 0,
          item.location || 'N/A',
          item.suppliers || 'N/A'
        ]);
      });
      worksheet.addRow([]);
    }

    if (data.locationWise && data.locationWise.length > 0) {
      worksheet.addRow(['Location Wise Inventory']);
      worksheet.addRow(['Location Name', 'Type', 'Total Items', 'Total Qty', 'Total Value', 'Low Stock', 'Out Stock', 'Stock Health']);
      (data.locationWise || []).forEach((location: any) => {
        worksheet.addRow([
          location.locationName || 'N/A',
          location.locationType || 'N/A',
          location.totalItems || 0,
          location.totalQuantity || 0,
          this.roundNumber(location.totalValue),
          location.lowStockCount || 0,
          location.outOfStockCount || 0,
          location.stockHealth || '0%'
        ]);
      });
      worksheet.addRow([]);
    }

    if (data.stockAging) {
      worksheet.addRow(['Stock Aging Analysis']);
      worksheet.addRow(['Category', 'Count']);
      worksheet.addRow(['Fresh (≤30 days)', data.stockAging.fresh || 0]);
      worksheet.addRow(['Moderate (31-90 days)', data.stockAging.moderate || 0]);
      worksheet.addRow(['Old (>90 days)', data.stockAging.old || 0]);
    }
  }

  /**
   * Add Staff Performance Data to Excel
   */
  private addStaffPerformanceDataToExcel(worksheet: ExcelJS.Worksheet, data: any) {
    const summary = data.summary || {};
    worksheet.addRow(['Staff Summary']);
    worksheet.addRow(['Total Staff', summary.totalStaff || 0]);
    worksheet.addRow(['Active Staff', summary.activeStaff || 0]);
    worksheet.addRow(['Inactive Staff', summary.inactiveStaff || 0]);
    worksheet.addRow(['Total Revenue', `Rs. ${this.formatNumber(summary.totalRevenue)}`]);
    worksheet.addRow(['Total Sales', summary.totalSales || 0]);
    worksheet.addRow(['Total Jobs', summary.totalJobs || 0]);
    worksheet.addRow(['Average Sales per Staff', `Rs. ${this.formatNumber(summary.averageSalesPerStaff)}`]);
    worksheet.addRow([]);

    if (data.topPerformers && data.topPerformers.length > 0) {
      worksheet.addRow(['Top Performers']);
      worksheet.addRow(['Staff Name', 'Position', 'Total Sales', 'Sales Revenue', 'Completed Jobs', 'Job Revenue', 'Total Revenue', 'Total Profit', 'Unique Customers', 'Average Rating']);
      (data.topPerformers || []).forEach((staff: any) => {
        worksheet.addRow([
          staff.staffName || 'N/A',
          staff.position || 'N/A',
          staff.totalSales || 0,
          this.roundNumber(staff.salesRevenue),
          staff.completedJobs || 0,
          this.roundNumber(staff.jobRevenue),
          this.roundNumber(staff.totalRevenue),
          this.roundNumber(staff.totalProfit),
          staff.uniqueCustomers || 0,
          this.roundNumber(staff.averageRating)
        ]);
      });
      worksheet.addRow([]);
    }

    if (data.departmentWise && data.departmentWise.length > 0) {
      worksheet.addRow(['Department Wise Performance']);
      worksheet.addRow(['Department', 'Total Staff', 'Total Sales', 'Total Revenue', 'Total Jobs', 'Avg Revenue Per Staff']);
      (data.departmentWise || []).forEach((dept: any) => {
        worksheet.addRow([
          dept.department || 'N/A',
          dept.totalStaff || 0,
          dept.totalSales || 0,
          this.roundNumber(dept.totalRevenue),
          dept.totalJobs || 0,
          this.roundNumber(dept.averageRevenuePerStaff)
        ]);
      });
      worksheet.addRow([]);
    }

    if (data.performanceTrends && data.performanceTrends.length > 0) {
      worksheet.addRow(['Performance Trends']);
      worksheet.addRow(['Date', 'Sales', 'Jobs', 'Revenue', 'Active Staff', 'Avg Revenue Per Staff']);
      (data.performanceTrends || []).forEach((trend: any) => {
        worksheet.addRow([
          trend.date || 'N/A',
          trend.sales || 0,
          trend.jobs || 0,
          this.roundNumber(trend.revenue),
          trend.activeStaff || 0,
          this.roundNumber(trend.averageRevenuePerStaff)
        ]);
      });
      worksheet.addRow([]);
    }

    if (data.underperformingStaff && data.underperformingStaff.length > 0) {
      worksheet.addRow(['Underperforming Staff']);
      worksheet.addRow(['Staff Name', 'NIC Number', 'Email']);
      (data.underperformingStaff || []).forEach((staff: any) => {
        worksheet.addRow([
          staff.staffName || 'N/A',
          staff.nicNumber || 'N/A',
          staff.email || 'N/A'
        ]);
      });
    }
  }

  /**
   * Add Customer Analysis Data to Excel
   */
  private addCustomerAnalysisDataToExcel(worksheet: ExcelJS.Worksheet, data: any) {
    const summary = data.summary || {};
    worksheet.addRow(['Customer Summary']);
    worksheet.addRow(['Total Customers', summary.totalCustomers || 0]);
    worksheet.addRow(['New Customers', summary.newCustomers || 0]);
    worksheet.addRow(['Returning Customers', summary.returningCustomers || 0]);
    worksheet.addRow(['Active Customers', summary.activeCustomers || 0]);
    worksheet.addRow(['Customer Retention Rate', `${this.formatNumber(summary.customerRetentionRate)}%`]);
    worksheet.addRow(['Average Customer Value', `Rs. ${this.formatNumber(summary.averageCustomerValue)}`]);
    worksheet.addRow(['Customer Lifetime Value', `Rs. ${this.formatNumber(summary.customerLifetimeValue)}`]);
    worksheet.addRow(['Total Revenue', `Rs. ${this.formatNumber(summary.totalRevenue)}`]);
    worksheet.addRow([]);

    if (data.segmentation) {
      worksheet.addRow(['Customer Segmentation']);
      worksheet.addRow(['Segment', 'Count']);
      worksheet.addRow(['High Value', data.segmentation.highValue || 0]);
      worksheet.addRow(['Medium Value', data.segmentation.mediumValue || 0]);
      worksheet.addRow(['Low Value', data.segmentation.lowValue || 0]);
      worksheet.addRow([]);
    }

    if (data.topCustomers && data.topCustomers.length > 0) {
      worksheet.addRow(['Top Customers']);
      worksheet.addRow(['Customer Name', 'Phone', 'Type', 'Purchases', 'Jobsheets', 'Total Spent', 'Avg Order Value', 'Items Purchased', 'Last Purchase']);
      (data.topCustomers || []).forEach((customer: any) => {
        worksheet.addRow([
          customer.customerName || 'N/A',
          customer.phone || 'N/A',
          customer.customerType || 'N/A',
          customer.totalPurchases || 0,
          customer.totalJobsheets || 0,
          this.roundNumber(customer.totalSpent),
          this.roundNumber(customer.averageOrderValue),
          customer.itemsPurchased || 0,
          customer.lastPurchase ? new Date(customer.lastPurchase).toLocaleDateString() : 'N/A'
        ]);
      });
      worksheet.addRow([]);
    }

    if (data.atRiskCustomers && data.atRiskCustomers.length > 0) {
      worksheet.addRow(['At Risk Customers']);
      worksheet.addRow(['Customer Name', 'Phone', 'Total Spent', 'Last Purchase', 'Days Since Last Purchase']);
      (data.atRiskCustomers || []).forEach((customer: any) => {
        worksheet.addRow([
          customer.customerName || 'N/A',
          customer.phone || 'N/A',
          this.roundNumber(customer.totalSpent),
          customer.lastPurchase ? new Date(customer.lastPurchase).toLocaleDateString() : 'N/A',
          customer.daysSinceLastPurchase || 0
        ]);
      });
      worksheet.addRow([]);
    }

    if (data.customersByType && data.customersByType.length > 0) {
      worksheet.addRow(['Customers by Type']);
      worksheet.addRow(['Type', 'Count', 'Revenue', 'Avg Spent', 'Percentage']);
      (data.customersByType || []).forEach((ct: any) => {
        worksheet.addRow([
          ct.type || 'N/A',
          ct.count || 0,
          this.roundNumber(ct.revenue),
          this.roundNumber(ct.averageSpent),
          ct.percentage || '0%'
        ]);
      });
      worksheet.addRow([]);
    }

    if (data.customersByLocation && data.customersByLocation.length > 0) {
      worksheet.addRow(['Customers by Location']);
      worksheet.addRow(['Location', 'Customer Count', 'Revenue', 'Avg Revenue Per Customer']);
      (data.customersByLocation || []).forEach((cl: any) => {
        worksheet.addRow([
          cl.locationName || 'N/A',
          cl.customerCount || 0,
          this.roundNumber(cl.revenue),
          this.roundNumber(cl.averageRevenuePerCustomer)
        ]);
      });
    }
  }

  /**
   * Add Shop Performance Data to Excel
   */
  private addShopPerformanceDataToExcel(worksheet: ExcelJS.Worksheet, data: any) {
    const summary = data.summary || {};
    worksheet.addRow(['Shop Summary']);
    worksheet.addRow(['Total Locations', summary.totalLocations || 0]);
    worksheet.addRow(['Active Locations', summary.activeLocations || 0]);
    worksheet.addRow(['Total Revenue', `Rs. ${this.formatNumber(summary.totalRevenue)}`]);
    worksheet.addRow(['Total Profit', `Rs. ${this.formatNumber(summary.totalProfit)}`]);
    worksheet.addRow(['Total Profit Margin', `${this.formatNumber(summary.totalProfitMargin)}%`]);
    worksheet.addRow(['Average Revenue per Location', `Rs. ${this.formatNumber(summary.averageRevenuePerLocation)}`]);
    worksheet.addRow(['Total Sales', summary.totalSales || 0]);
    worksheet.addRow(['Total Jobsheets', summary.totalJobsheets || 0]);
    worksheet.addRow([]);

    if (data.topPerformingLocations && data.topPerformingLocations.length > 0) {
      worksheet.addRow(['Top Performing Locations']);
      worksheet.addRow(['Location Name', 'Type', 'Total Sales', 'Sales Revenue', 'Jobsheets', 'Job Revenue', 'Total Revenue', 'Profit', 'Profit Margin %', 'Customers Served', 'Staff Count', 'Inventory Value']);
      (data.topPerformingLocations || []).forEach((location: any) => {
        worksheet.addRow([
          location.locationName || 'N/A',
          location.locationType || 'N/A',
          location.totalSales || 0,
          this.roundNumber(location.salesRevenue),
          location.jobsheets || 0,
          this.roundNumber(location.jobRevenue),
          this.roundNumber(location.totalRevenue),
          this.roundNumber(location.profit),
          this.roundNumber(location.profitMargin),
          location.customersServed || 0,
          location.staffCount || 0,
          this.roundNumber(location.inventoryValue)
        ]);
      });
      worksheet.addRow([]);
    }

    if (data.locationComparison && data.locationComparison.length > 0) {
      worksheet.addRow(['Location Comparison']);
      worksheet.addRow(['Location', 'Current Revenue', 'Previous Revenue', 'Growth %', 'Trend']);
      (data.locationComparison || []).forEach((loc: any) => {
        worksheet.addRow([
          loc.locationName || 'N/A',
          this.roundNumber(loc.currentRevenue),
          this.roundNumber(loc.previousRevenue),
          this.roundNumber(loc.growth),
          loc.growthTrend || 'STABLE'
        ]);
      });
      worksheet.addRow([]);
    }

    if (data.performanceByType && data.performanceByType.length > 0) {
      worksheet.addRow(['Performance by Location Type']);
      worksheet.addRow(['Type', 'Locations', 'Revenue', 'Profit', 'Sales', 'Avg Revenue Per Location']);
      (data.performanceByType || []).forEach((pt: any) => {
        worksheet.addRow([
          pt.type || 'N/A',
          pt.locations || 0,
          this.roundNumber(pt.revenue),
          this.roundNumber(pt.profit),
          pt.sales || 0,
          this.roundNumber(pt.averageRevenuePerLocation)
        ]);
      });
      worksheet.addRow([]);
    }

    if (data.performanceTrends && data.performanceTrends.length > 0) {
      worksheet.addRow(['Performance Trends']);
      worksheet.addRow(['Date', 'Revenue', 'Sales', 'Active Locations', 'Avg Revenue Per Location']);
      (data.performanceTrends || []).forEach((trend: any) => {
        worksheet.addRow([
          trend.date || 'N/A',
          this.roundNumber(trend.revenue),
          trend.sales || 0,
          trend.activeLocations || 0,
          this.roundNumber(trend.averageRevenuePerLocation)
        ]);
      });
    }
  }

  /**
   * Add Jobsheet Data to Excel
   */
  private addJobsheetDataToExcel(worksheet: ExcelJS.Worksheet, data: any) {
    const summary = data.summary || {};
    worksheet.addRow(['Jobsheet Summary']);
    worksheet.addRow(['Total Jobsheets', summary.totalJobsheets || 0]);
    worksheet.addRow(['Completed Jobs', summary.completedJobs || 0]);
    worksheet.addRow(['Pending Jobs', summary.pendingJobs || 0]);
    worksheet.addRow(['In Progress Jobs', summary.inProgressJobs || 0]);
    worksheet.addRow(['Completion Rate', summary.completionRate || '0%']);
    worksheet.addRow(['Total Revenue', `Rs. ${this.formatNumber(summary.totalRevenue)}`]);
    worksheet.addRow(['Avg Job Value', `Rs. ${this.formatNumber(summary.avgJobValue)}`]);
    worksheet.addRow(['Unique Customers', summary.uniqueCustomers || 0]);
    worksheet.addRow(['Active Technicians', summary.activeTechnicians || 0]);
    worksheet.addRow([]);

    if (data.statusSummary && data.statusSummary.length > 0) {
      worksheet.addRow(['Status Summary']);
      worksheet.addRow(['Status', 'Count', 'Revenue', 'Avg Completion Time (hrs)', 'Percentage']);
      data.statusSummary.forEach((status: any) => {
        worksheet.addRow([
          status.status || 'N/A',
          status.count || 0,
          this.roundNumber(status.revenue),
          this.roundNumber(status.avgCompletionTime),
          status.percentage || '0%'
        ]);
      });
      worksheet.addRow([]);
    }

    if (data.prioritySummary && data.prioritySummary.length > 0) {
      worksheet.addRow(['Priority Summary']);
      worksheet.addRow(['Priority', 'Count', 'Completed', 'Completion Rate', 'Revenue', 'Percentage']);
      data.prioritySummary.forEach((p: any) => {
        worksheet.addRow([
          p.priority || 'N/A',
          p.count || 0,
          p.completed || 0,
          p.completionRate || '0%',
          this.roundNumber(p.revenue),
          p.percentage || '0%'
        ]);
      });
      worksheet.addRow([]);
    }

    if (data.deviceTypeSummary && data.deviceTypeSummary.length > 0) {
      worksheet.addRow(['Device Type Summary']);
      worksheet.addRow(['Device Type', 'Count', 'Revenue', 'Avg Revenue', 'Percentage']);
      data.deviceTypeSummary.forEach((dt: any) => {
        worksheet.addRow([
          dt.deviceType || 'N/A',
          dt.count || 0,
          this.roundNumber(dt.revenue),
          this.roundNumber(dt.avgRevenue),
          dt.percentage || '0%'
        ]);
      });
      worksheet.addRow([]);
    }

    if (data.topTechnicians && data.topTechnicians.length > 0) {
      worksheet.addRow(['Top Technicians']);
      worksheet.addRow(['Technician Name', 'Email', 'Total Jobs', 'Completed Jobs', 'Completion Rate', 'Revenue', 'Avg Completion Time', 'Unique Customers']);
      data.topTechnicians.forEach((tech: any) => {
        worksheet.addRow([
          tech.technicianName || 'N/A',
          tech.email || 'N/A',
          tech.totalJobs || 0,
          tech.completedJobs || 0,
          tech.completionRate || '0%',
          this.roundNumber(tech.revenue),
          this.roundNumber(tech.avgCompletionTime),
          tech.uniqueCustomers || 0
        ]);
      });
      worksheet.addRow([]);
    }

    if (data.topCustomers && data.topCustomers.length > 0) {
      worksheet.addRow(['Top Customers']);
      worksheet.addRow(['Customer Name', 'Phone', 'Email', 'Total Jobs', 'Completed Jobs', 'Total Spent', 'Avg Job Value', 'Last Job Date']);
      data.topCustomers.forEach((customer: any) => {
        worksheet.addRow([
          customer.customerName || 'N/A',
          customer.phone || 'N/A',
          customer.email || 'N/A',
          customer.totalJobs || 0,
          customer.completedJobs || 0,
          this.roundNumber(customer.totalSpent),
          this.roundNumber(customer.averageJobValue),
          customer.lastJobDate ? new Date(customer.lastJobDate).toLocaleDateString() : 'N/A'
        ]);
      });
      worksheet.addRow([]);
    }

    if (data.topJobsheets && data.topJobsheets.length > 0) {
      worksheet.addRow(['Top Jobsheets']);
      worksheet.addRow(['Job Number', 'Customer Name', 'Customer Phone', 'Technician', 'Total Cost', 'Status', 'Priority', 'Device Type', 'Location', 'Created Date', 'Completed Date']);
      data.topJobsheets.forEach((job: any) => {
        worksheet.addRow([
          job.jobNumber || 'N/A',
          job.customerName || 'N/A',
          job.customerPhone || 'N/A',
          job.technicianName || 'N/A',
          this.roundNumber(job.totalCost),
          job.status || 'N/A',
          job.priority || 'N/A',
          job.deviceType || 'N/A',
          job.location || 'N/A',
          job.createdAt ? new Date(job.createdAt).toLocaleDateString() : 'N/A',
          job.completedAt ? new Date(job.completedAt).toLocaleDateString() : 'N/A'
        ]);
      });
      worksheet.addRow([]);
    }

    if (data.locationSummary && data.locationSummary.length > 0) {
      worksheet.addRow(['Location Summary']);
      worksheet.addRow(['Location Name', 'Type', 'Total Jobs', 'Completed Jobs', 'Completion Rate', 'Revenue', 'Technicians Count', 'Avg Revenue Per Job']);
      data.locationSummary.forEach((loc: any) => {
        worksheet.addRow([
          loc.locationName || 'N/A',
          loc.locationType || 'N/A',
          loc.totalJobs || 0,
          loc.completedJobs || 0,
          loc.completionRate || '0%',
          this.roundNumber(loc.revenue),
          loc.techniciansCount || 0,
          this.roundNumber(loc.avgRevenuePerJob)
        ]);
      });
      worksheet.addRow([]);
    }

    if (data.trendsByDay && data.trendsByDay.length > 0) {
      worksheet.addRow(['Daily Trends']);
      worksheet.addRow(['Date', 'Created', 'Completed', 'Revenue', 'Completion Rate', 'Active Technicians']);
      data.trendsByDay.forEach((trend: any) => {
        worksheet.addRow([
          trend.date || 'N/A',
          trend.created || 0,
          trend.completed || 0,
          this.roundNumber(trend.revenue),
          trend.completionRate || '0%',
          trend.activeTechnicians || 0
        ]);
      });
    }
  }

  /**
   * Generate PDF Report
   */
  private async generatePDFReport(title: string, reportType: string, data: any, period: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const chunks: Buffer[] = [];

        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));

        // Add title
        doc.fontSize(20).text(title, { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Period: ${period}`, { align: 'center' });
        doc.text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
        doc.moveDown(2);

        // Add data based on report type
        switch (reportType) {
          case 'sales':
            this.addSalesDataToPDF(doc, data);
            break;
          case 'profit_loss':
            this.addProfitLossDataToPDF(doc, data);
            break;
          case 'inventory':
            this.addInventoryDataToPDF(doc, data);
            break;
          case 'staff_performance':
            this.addStaffPerformanceDataToPDF(doc, data);
            break;
          case 'customer_analysis':
            this.addCustomerAnalysisDataToPDF(doc, data);
            break;
          case 'shop_performance':
            this.addShopPerformanceDataToPDF(doc, data);
            break;
          case 'jobsheet':
            this.addJobsheetDataToPDF(doc, data);
            break;
        }

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Draw a table in PDF with flexible column widths
   */
  private drawTable(doc: PDFKit.PDFDocument, headers: string[], rows: string[][], startY: number): number {
    const margin = 50;
    const pageWidth = doc.page.width - margin * 2; // usable width
    const minColWidth = 60;
    const maxColWidth = 120;

    // Calculate optimal column widths based on content
    const colWidths: number[] = [];
    for (let i = 0; i < headers.length; i++) {
      let maxWidth = doc.widthOfString(headers[i]) + 20; // header width + padding

      // Check content width in rows
      rows.forEach((row) => {
        if (row[i]) {
          const contentWidth = doc.widthOfString(row[i]) + 20;
          maxWidth = Math.max(maxWidth, contentWidth);
        }
      });

      colWidths[i] = Math.max(minColWidth, Math.min(maxWidth, maxColWidth));
    }

    // If total width exceeds page width, scale down proportionally
    const totalWidth = colWidths.reduce((sum, w) => sum + w, 0);
    if (totalWidth > pageWidth) {
      const scale = pageWidth / totalWidth;
      colWidths.forEach((_, i) => (colWidths[i] *= scale));
    }

    let y = startY;
    const rowHeight = 15;
    const headerHeight = 20;
    const bottomLimit = () => doc.page.height - margin;

    const renderHeaders = () => {
      doc.fontSize(8).font('Helvetica-Bold');
      let x = margin;
      headers.forEach((header, i) => {
        doc.text(header, x, y, { width: colWidths[i], align: 'left' });
        x += colWidths[i];
      });
      y += headerHeight - 5;
      doc.moveTo(margin, y).lineTo(margin + totalWidth, y).stroke();
      y += 5;
    };

    // Ensure headers are on current page; add page if needed before first header
    if (y + headerHeight > bottomLimit()) {
      doc.addPage();
      y = margin;
    }
    renderHeaders();

    // Draw rows with auto page-break and repeat headers
    doc.fontSize(7).font('Helvetica');
    rows.forEach((row) => {
      if (y + rowHeight > bottomLimit()) {
        doc.addPage();
        y = margin;
        renderHeaders();
      }

      let x = margin;
      row.forEach((cell, i) => {
        doc.text(cell || '', x, y, { width: colWidths[i], align: 'left' });
        x += colWidths[i];
      });
      y += 12;

      // Draw row line if not last row
      if (rows.indexOf(row) < rows.length - 1) {
        doc.moveTo(margin, y).lineTo(margin + totalWidth, y).stroke();
        y += 3;
      }
    });

    return y + 10;
  }

  /**
   * Add Sales Data to PDF
   */
  private addSalesDataToPDF(doc: PDFKit.PDFDocument, data: any) {
    const summary = data.summary || {};

    // Summary section
    doc.fontSize(14).text('Summary', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10);
    doc.text(`Total Sales: ${summary.totalSales || 0}`);
    doc.text(`Total Revenue: Rs. ${this.formatNumber(summary.totalRevenue)}`);
    doc.text(`Total Paid: Rs. ${this.formatNumber(summary.totalPaid)}`);
    doc.text(`Total Refunded: Rs. ${this.formatNumber(summary.totalRefunded)}`);
    doc.text(`Net Revenue: Rs. ${this.formatNumber(summary.netRevenue)}`);
    doc.text(`Total Profit: Rs. ${this.formatNumber(summary.totalProfit)}`);
    doc.text(`Profit Margin: ${this.formatNumber(summary.profitMargin)}%`);
    doc.text(`Average Order Value: Rs. ${this.formatNumber(summary.averageOrderValue)}`);
    doc.moveDown();

    // Top Products table
    if (data.topProducts && data.topProducts.length > 0) {
      doc.fontSize(12).text('Top Products', { underline: true });
      doc.moveDown(0.5);
      const productHeaders = ['Product Name', 'SKU', 'Category', 'Quantity', 'Revenue', 'Profit', 'Margin %'];
      const productRows = (data.topProducts || []).map((product: any) => [
        product.productName || 'N/A',
        product.sku || 'N/A',
        product.category || 'N/A',
        (product.quantity || 0).toString(),
        `Rs. ${this.formatNumber(product.revenue)}`,
        `Rs. ${this.formatNumber(product.profit)}`,
        `${this.formatNumber(product.profitMargin)}%`
      ]);
      let y = this.drawTable(doc, productHeaders, productRows, doc.y);
      doc.y = y + 10;
    }

    // Top Locations table
    if (data.topLocations && data.topLocations.length > 0) {
      doc.fontSize(12).text('Top Locations', { underline: true });
      doc.moveDown(0.5);
      const locationHeaders = ['Location Name', 'Type', 'Sales', 'Revenue', 'Profit', 'Margin %'];
      const locationRows = data.topLocations.map((location: any) => [
        location.locationName || 'N/A',
        location.locationType || 'N/A',
        (location.sales || 0).toString(),
        `Rs. ${this.formatNumber(location.revenue)}`,
        `Rs. ${this.formatNumber(location.profit)}`,
        `${this.formatNumber(location.profitMargin)}%`
      ]);
      let y = this.drawTable(doc, locationHeaders, locationRows, doc.y);
      doc.y = y + 10;
    }

    // Sales by Day table
    if (data.salesByDay && data.salesByDay.length > 0) {
      doc.fontSize(12).text('Sales by Day', { underline: true });
      doc.moveDown(0.5);
      const dayHeaders = ['Date', 'Sales', 'Revenue', 'Profit', 'Avg Order', 'Customers'];
      const dayRows = data.salesByDay.map((day: any) => [
        day.date || 'N/A',
        (day.sales || 0).toString(),
        `Rs. ${this.formatNumber(day.revenue)}`,
        `Rs. ${this.formatNumber(day.profit)}`,
        `Rs. ${this.formatNumber(day.averageOrderValue)}`,
        (day.uniqueCustomers || 0).toString()
      ]);
      let y = this.drawTable(doc, dayHeaders, dayRows, doc.y);
      doc.y = y + 10;
    }

    // Payment Methods table
    if (data.paymentMethods && data.paymentMethods.length > 0) {
      doc.fontSize(12).text('Payment Methods', { underline: true });
      doc.moveDown(0.5);
      const paymentHeaders = ['Method', 'Count', 'Amount', 'Sales Count', 'Avg Transaction'];
      const paymentRows = data.paymentMethods.map((pm: any) => [
        pm.method || 'N/A',
        (pm.count || 0).toString(),
        `Rs. ${this.formatNumber(pm.amount)}`,
        (pm.salesCount || 0).toString(),
        `Rs. ${this.formatNumber(pm.averageTransaction)}`
      ]);
      let y = this.drawTable(doc, paymentHeaders, paymentRows, doc.y);
      doc.y = y + 10;
    }

    // Refund Analysis table
    if (data.refundAnalysis) {
      doc.fontSize(12).text('Refund Analysis', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10);
      doc.text(`Total Refunds: Rs. ${this.formatNumber(data.refundAnalysis.totalRefunds)}`);
      doc.text(`Refund Count: ${data.refundAnalysis.refundCount || 0}`);
      doc.text(`Refund Rate: ${this.formatNumber(data.refundAnalysis.refundRate)}%`);
      doc.moveDown(0.5);
      
      if (data.refundAnalysis.topRefundReasons && data.refundAnalysis.topRefundReasons.length > 0) {
        const refundHeaders = ['Reason', 'Count', 'Amount'];
        const refundRows = data.refundAnalysis.topRefundReasons.map((r: any) => [
          r.reason || 'N/A',
          (r.count || 0).toString(),
          `Rs. ${this.formatNumber(r.amount)}`
        ]);
        let y = this.drawTable(doc, refundHeaders, refundRows, doc.y);
        doc.y = y + 10;
      }
    }

    // Top Customers table
    if (data.topCustomers && data.topCustomers.length > 0) {
      doc.fontSize(12).text('Top Customers', { underline: true });
      doc.moveDown(0.5);
      const customerHeaders = ['Customer Name', 'Phone', 'Purchases', 'Total Spent', 'Avg Order'];
      const customerRows = data.topCustomers.map((customer: any) => [
        customer.customerName || 'N/A',
        customer.phone || 'N/A',
        (customer.purchases || 0).toString(),
        `Rs. ${this.formatNumber(customer.totalSpent)}`,
        `Rs. ${this.formatNumber(customer.averageOrderValue)}`
      ]);
      this.drawTable(doc, customerHeaders, customerRows, doc.y);
    }
  }

  /**
   * Add Profit & Loss Data to PDF
   */
  private addProfitLossDataToPDF(doc: PDFKit.PDFDocument, data: any) {
    const summary = data.summary || {};

    // Financial Summary
    doc.fontSize(14).text('Financial Summary', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10);
    doc.text(`Total Revenue: Rs. ${this.formatNumber(summary.totalRevenue)}`);
    doc.text(`Cost of Goods Sold: Rs. ${this.formatNumber(summary.costOfGoodsSold)}`);
    doc.text(`Gross Profit: Rs. ${this.formatNumber(summary.grossProfit)}`);
    doc.text(`Gross Profit Margin: ${this.formatNumber(summary.grossProfitMargin)}%`);
    doc.text(`Operating Expenses: Rs. ${this.formatNumber(summary.operatingExpenses)}`);
    doc.text(`Net Profit: Rs. ${this.formatNumber(summary.netProfit)}`);
    doc.text(`Net Profit Margin: ${this.formatNumber(summary.netProfitMargin)}%`);
    doc.moveDown();

    // Income Breakdown table
    if (data.incomeBreakdown) {
      doc.fontSize(12).text('Income Breakdown', { underline: true });
      doc.moveDown(0.5);
      const incomeHeaders = ['Source', 'Revenue', 'Cost', 'Profit', 'Count'];
      const incomeRows = [
        ['POS Sales', this.formatNumber(data.incomeBreakdown.posSales?.revenue), this.formatNumber(data.incomeBreakdown.posSales?.cost), this.formatNumber(data.incomeBreakdown.posSales?.profit), (data.incomeBreakdown.posSales?.count || 0).toString()],
        ['Jobsheets', this.formatNumber(data.incomeBreakdown.jobsheets?.revenue), this.formatNumber(data.incomeBreakdown.jobsheets?.cost), this.formatNumber(data.incomeBreakdown.jobsheets?.profit), (data.incomeBreakdown.jobsheets?.count || 0).toString()],
        ['Other Sales', this.formatNumber(data.incomeBreakdown.otherSales?.revenue), this.formatNumber(data.incomeBreakdown.otherSales?.cost), this.formatNumber(data.incomeBreakdown.otherSales?.profit), (data.incomeBreakdown.otherSales?.count || 0).toString()]
      ];
      let y = this.drawTable(doc, incomeHeaders, incomeRows.map(row => [
        row[0],
        `Rs. ${row[1]}`,
        `Rs. ${row[2]}`,
        `Rs. ${row[3]}`,
        row[4]
      ]), doc.y);
      doc.y = y + 10;
    }

    // Operating Expenses table
    if (data.operatingExpenses) {
      doc.fontSize(12).text('Operating Expenses', { underline: true });
      doc.moveDown(0.5);
      const expenseHeaders = ['Expense Type', 'Amount'];
      const expenseRows = [
        ['Supplier Payments', `Rs. ${this.formatNumber(data.operatingExpenses.supplierPayments)}`],
        ['Sale Refunds', `Rs. ${this.formatNumber(data.operatingExpenses.saleRefunds)}`],
        ['Salaries', `Rs. ${this.formatNumber(data.operatingExpenses.salaries)}`],
        ['Rent', `Rs. ${this.formatNumber(data.operatingExpenses.rent)}`],
        ['Utilities', `Rs. ${this.formatNumber(data.operatingExpenses.utilities)}`],
        ['Marketing', `Rs. ${this.formatNumber(data.operatingExpenses.marketing)}`],
        ['Other', `Rs. ${this.formatNumber(data.operatingExpenses.other)}`],
        ['Total', `Rs. ${this.formatNumber(data.operatingExpenses.total)}`]
      ];
      let y = this.drawTable(doc, expenseHeaders, expenseRows, doc.y);
      doc.y = y + 10;
    }

    // Daily Breakdown table
    if (data.breakdown && data.breakdown.length > 0) {
      doc.fontSize(12).text('Daily Breakdown', { underline: true });
      doc.moveDown(0.5);
      const breakdownHeaders = ['Date', 'Revenue', 'Costs', 'Profit', 'Margin %', 'Sales', 'Jobs'];
      const breakdownRows = data.breakdown.map((day: any) => [
        day.date || 'N/A',
        `Rs. ${this.formatNumber(day.revenue)}`,
        `Rs. ${this.formatNumber(day.costs)}`,
        `Rs. ${this.formatNumber(day.profit)}`,
        `${this.formatNumber(day.profitMargin)}%`,
        (day.salesCount || 0).toString(),
        (day.jobsheetCount || 0).toString()
      ]);
      let y = this.drawTable(doc, breakdownHeaders, breakdownRows, doc.y);
      doc.y = y + 10;
    }

    // Payment Methods table
    if (data.paymentMethods && data.paymentMethods.length > 0) {
      doc.fontSize(12).text('Payment Methods', { underline: true });
      doc.moveDown(0.5);
      const paymentHeaders = ['Method', 'Amount', 'Percentage'];
      const paymentRows = data.paymentMethods.map((pm: any) => [
        pm.method || 'N/A',
        `Rs. ${this.formatNumber(pm.amount)}`,
        `${this.formatNumber(pm.percentage)}%`
      ]);
      let y = this.drawTable(doc, paymentHeaders, paymentRows, doc.y);
      doc.y = y + 10;
    }

    // Supplier Payments table
    if (data.supplierPayments && data.supplierPayments.details && data.supplierPayments.details.length > 0) {
      doc.fontSize(12).text('Supplier Payments', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10);
      doc.text(`Total: Rs. ${this.formatNumber(data.supplierPayments.total)} | Count: ${data.supplierPayments.count || 0}`);
      doc.moveDown(0.5);
      const supplierHeaders = ['Payment #', 'Supplier', 'Amount', 'Method', 'Date', 'PO #'];
      const supplierRows = data.supplierPayments.details.map((sp: any) => [
        sp.paymentNumber || 'N/A',
        sp.supplierName || 'N/A',
        `Rs. ${this.formatNumber(sp.amount)}`,
        sp.paymentMethod || 'N/A',
        new Date(sp.paymentDate).toLocaleDateString(),
        sp.purchaseOrderNumber || 'N/A'
      ]);
      let y = this.drawTable(doc, supplierHeaders, supplierRows, doc.y);
      doc.y = y + 10;
    }

    // Top Jobsheets table
    if (data.jobsheets && data.jobsheets.topJobsheets && data.jobsheets.topJobsheets.length > 0) {
      doc.fontSize(12).text('Top Jobsheets', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10);
      doc.text(`Total: Rs. ${this.formatNumber(data.jobsheets.total)} | Count: ${data.jobsheets.count || 0}`);
      doc.moveDown(0.5);
      const jobHeaders = ['Job #', 'Customer', 'Amount', 'Status', 'Assigned To', 'Location'];
      const jobRows = data.jobsheets.topJobsheets.map((job: any) => [
        job.jobNumber || 'N/A',
        job.customerName || 'N/A',
        `Rs. ${this.formatNumber(job.totalCost)}`,
        job.status || 'N/A',
        job.assignedTo || 'N/A',
        job.location || 'N/A'
      ]);
      this.drawTable(doc, jobHeaders, jobRows, doc.y);
    }
  }

  /**
   * Add Inventory Data to PDF
   */
  private addInventoryDataToPDF(doc: PDFKit.PDFDocument, data: any) {
    const summary = data.summary || {};

    // Inventory Summary
    doc.fontSize(14).text('Inventory Summary', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10);
    doc.text(`Total Items: ${summary.totalItems || 0}`);
    doc.text(`Total Value: Rs. ${this.formatNumber(summary.totalValue)}`);
    doc.text(`Total Retail Value: Rs. ${this.formatNumber(summary.totalRetailValue)}`);
    doc.text(`Potential Profit: Rs. ${this.formatNumber(summary.potentialProfit)}`);
    doc.text(`Total Quantity: ${summary.totalQuantity || 0}`);
    doc.text(`Low Stock Items: ${summary.lowStockItems || 0}`);
    doc.text(`Out of Stock Items: ${summary.outOfStockItems || 0}`);
    doc.text(`Excess Stock Items: ${summary.excessStockItems || 0}`);
    doc.text(`Optimal Stock Items: ${summary.optimalStockItems || 0}`);
    doc.text(`Inventory Turnover: ${this.formatNumber(summary.inventoryTurnover)}`);
    doc.text(`Stock Health Score: ${summary.stockHealthScore || '0%'}`);
    doc.moveDown();

    // Category Wise Breakdown
    if (data.categoryWise && data.categoryWise.length > 0) {
      doc.fontSize(12).text('Category Wise Breakdown', { underline: true, align: 'left' });
      doc.moveDown(0.5);
      const categoryHeaders = ['Category Name', 'Items', 'Quantity', 'Value', 'Retail Value', 'Potential Profit', 'Profit Margin'];
      const categoryRows = data.categoryWise.map((category: any) => [
        category.categoryName || 'N/A',
        (category.items || 0).toString(),
        (category.quantity || 0).toString(),
        `Rs. ${this.formatNumber(category.value)}`,
        `Rs. ${this.formatNumber(category.retailValue)}`,
        `Rs. ${this.formatNumber(category.potentialProfit)}`,
        `${this.formatNumber(category.profitMargin)}%`
      ]);
      let y = this.drawTable(doc, categoryHeaders, categoryRows, doc.y);
      doc.y = y + 10;
    }

    // Fast Moving Items table
    if (data.fastMovingItems && data.fastMovingItems.length > 0) {
      doc.fontSize(12).text('Fast Moving Items', { underline: true });
      doc.moveDown(0.5);
      const fastHeaders = ['Product Name', 'SKU', 'Category', 'Qty Sold', 'Turnover Rate', 'Revenue', 'Location'];
      const fastRows = data.fastMovingItems.map((item: any) => [
        item.productName || 'N/A',
        item.sku || 'N/A',
        item.category || 'N/A',
        (item.quantitySold || 0).toString(),
        this.formatNumber(item.turnoverRate),
        `Rs. ${this.formatNumber(item.revenue)}`,
        item.location || 'N/A'
      ]);
      let y = this.drawTable(doc, fastHeaders, fastRows, doc.y);
      doc.y = y + 10;
    }

    // Slow Moving Items table
    if (data.slowMovingItems && data.slowMovingItems.length > 0) {
      doc.fontSize(12).text('Slow Moving Items', { underline: true, align: 'left' });
      doc.moveDown(0.5);
      const slowHeaders = ['Product Name', 'SKU', 'Category', 'Quantity', 'Value'];
      const slowRows = data.slowMovingItems.map((item: any) => [
        item.productName || 'N/A',
        item.sku || 'N/A',
        item.category || 'N/A',
        (item.quantity || 0).toString(),
        `Rs. ${this.formatNumber(item.value)}`
      ]);
      let y = this.drawTable(doc, slowHeaders, slowRows, doc.y);
      doc.y = y + 10;
    }

    // Low Stock Alerts
    if (data.lowStockAlerts && data.lowStockAlerts.length > 0) {
      doc.fontSize(12).text('Low Stock Alerts', { underline: true });
      doc.moveDown(0.5);
      const lowStockHeaders = ['Product Name', 'SKU', 'Current Stock', 'Min Stock', 'Reorder Qty', 'Location', 'Suppliers'];
      const lowStockRows = data.lowStockAlerts.map((alert: any) => [
        alert.productName,
        alert.sku,
        alert.currentStock.toString(),
        alert.minStockLevel.toString(),
        alert.reorderQuantity.toString(),
        alert.location,
        alert.suppliers
      ]);
      let y = this.drawTable(doc, lowStockHeaders, lowStockRows, doc.y);
      doc.y = y + 10;
    }

    // Out of Stock List
    if (data.outOfStockList && data.outOfStockList.length > 0) {
      doc.fontSize(12).text('Out of Stock Items', { underline: true });
      doc.moveDown(0.5);
      const outOfStockHeaders = ['Product Name', 'SKU', 'Min Stock', 'Reorder Qty', 'Location', 'Suppliers'];
      const outOfStockRows = data.outOfStockList.map((item: any) => [
        item.productName,
        item.sku,
        item.minStockLevel.toString(),
        item.reorderQuantity.toString(),
        item.location,
        item.suppliers
      ]);
      let y = this.drawTable(doc, outOfStockHeaders, outOfStockRows, doc.y);
      doc.y = y + 10;
    }

    // Location Wise Inventory
    if (data.locationWise && data.locationWise.length > 0) {
      doc.fontSize(12).text('Location Wise Inventory', { underline: true });
      doc.moveDown(0.5);
      const locationHeaders = ['Location Name', 'Type', 'Total Items', 'Total Qty', 'Total Value', 'Low Stock', 'Out Stock', 'Stock Health'];
      const locationRows = data.locationWise.map((location: any) => [
        location.locationName,
        location.locationType,
        location.totalItems.toString(),
        location.totalQuantity.toString(),
        `Rs. ${this.formatNumber(location.totalValue)}`,
        location.lowStockCount.toString(),
        location.outOfStockCount.toString(),
        location.stockHealth
      ]);
      let y = this.drawTable(doc, locationHeaders, locationRows, doc.y);
      doc.y = y + 10;
    }

    // Stock Aging Analysis
    if (data.stockAging) {
      doc.fontSize(12).text('Stock Aging Analysis', { underline: true });
      doc.moveDown(0.5);
      const agingHeaders = ['Category', 'Count'];
      const agingRows = [
        ['Fresh (≤30 days)', data.stockAging.fresh.toString()],
        ['Moderate (31-90 days)', data.stockAging.moderate.toString()],
        ['Old (>90 days)', data.stockAging.old.toString()]
      ];
      this.drawTable(doc, agingHeaders, agingRows, doc.y);
    }
  }

  /**
   * Add Staff Performance Data to PDF
   */
  private addStaffPerformanceDataToPDF(doc: PDFKit.PDFDocument, data: any) {
    const summary = data.summary || {};

    // Staff Summary
    doc.fontSize(14).text('Staff Performance Summary', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10);
    doc.text(`Total Staff: ${summary.totalStaff || 0}`);
    doc.text(`Active Staff: ${summary.activeStaff || 0}`);
    doc.text(`Inactive Staff: ${summary.inactiveStaff || 0}`);
    doc.text(`Total Revenue: Rs. ${this.formatNumber(summary.totalRevenue)}`);
    doc.text(`Total Sales: ${summary.totalSales || 0}`);
    doc.text(`Total Jobs: ${summary.totalJobs || 0}`);
    doc.text(`Average Sales per Staff: Rs. ${this.formatNumber(summary.averageSalesPerStaff)}`);
    doc.moveDown();

    // Top Performers table
    if (data.topPerformers && data.topPerformers.length > 0) {
      doc.fontSize(12).text('Top Performers', { underline: true });
      doc.moveDown(0.5);
      const performerHeaders = ['Staff Name', 'Position', 'Sales', 'Sales Rev', 'Jobs', 'Job Rev', 'Total Rev', 'Profit', 'Customers', 'Rating'];
      const performerRows = data.topPerformers.map((staff: any) => [
        staff.staffName || 'N/A',
        staff.position || 'N/A',
        (staff.totalSales || 0).toString(),
        `Rs. ${this.formatNumber(staff.salesRevenue)}`,
        (staff.completedJobs || 0).toString(),
        `Rs. ${this.formatNumber(staff.jobRevenue)}`,
        `Rs. ${this.formatNumber(staff.totalRevenue)}`,
        `Rs. ${this.formatNumber(staff.totalProfit)}`,
        (staff.uniqueCustomers || 0).toString(),
        this.formatNumber(staff.averageRating)
      ]);
      let y = this.drawTable(doc, performerHeaders, performerRows, doc.y);
      doc.y = y + 10;
    }

    // Department Wise Performance table
    if (data.departmentWise && data.departmentWise.length > 0) {
      doc.fontSize(12).text('Department Wise Performance', { underline: true });
      doc.moveDown(0.5);
      const deptHeaders = ['Department', 'Staff', 'Sales', 'Revenue', 'Jobs', 'Avg Rev/Staff'];
      const deptRows = data.departmentWise.map((dept: any) => [
        dept.department || 'N/A',
        (dept.totalStaff || 0).toString(),
        (dept.totalSales || 0).toString(),
        `Rs. ${this.formatNumber(dept.totalRevenue)}`,
        (dept.totalJobs || 0).toString(),
        `Rs. ${this.formatNumber(dept.averageRevenuePerStaff)}`
      ]);
      let y = this.drawTable(doc, deptHeaders, deptRows, doc.y);
      doc.y = y + 10;
    }

    // Performance Trends table
    if (data.performanceTrends && data.performanceTrends.length > 0) {
      doc.fontSize(12).text('Performance Trends', { underline: true });
      doc.moveDown(0.5);
      const trendHeaders = ['Date', 'Sales', 'Jobs', 'Revenue', 'Active Staff', 'Avg Rev/Staff'];
      const trendRows = data.performanceTrends.map((trend: any) => [
        trend.date || 'N/A',
        (trend.sales || 0).toString(),
        (trend.jobs || 0).toString(),
        `Rs. ${this.formatNumber(trend.revenue)}`,
        (trend.activeStaff || 0).toString(),
        `Rs. ${this.formatNumber(trend.averageRevenuePerStaff)}`
      ]);
      let y = this.drawTable(doc, trendHeaders, trendRows, doc.y);
      doc.y = y + 10;
    }

    // Underperforming Staff table
    if (data.underperformingStaff && data.underperformingStaff.length > 0) {
      doc.fontSize(12).text('Underperforming Staff', { underline: true });
      doc.moveDown(0.5);
      const underHeaders = ['Staff Name', 'NIC', 'Email'];
      const underRows = data.underperformingStaff.map((staff: any) => [
        staff.staffName || 'N/A',
        staff.nicNumber || 'N/A',
        staff.email || 'N/A'
      ]);
      this.drawTable(doc, underHeaders, underRows, doc.y);
    }
  }

  /**
   * Add Customer Analysis Data to PDF
   */
  private addCustomerAnalysisDataToPDF(doc: PDFKit.PDFDocument, data: any) {
    const summary = data.summary || {};

    // Customer Summary
    doc.fontSize(14).text('Customer Analysis Summary', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10);
    doc.text(`Total Customers: ${summary.totalCustomers || 0}`);
    doc.text(`New Customers: ${summary.newCustomers || 0}`);
    doc.text(`Returning Customers: ${summary.returningCustomers || 0}`);
    doc.text(`Active Customers: ${summary.activeCustomers || 0}`);
    doc.text(`Customer Retention Rate: ${this.formatNumber(summary.customerRetentionRate)}%`);
    doc.text(`Average Customer Value: Rs. ${this.formatNumber(summary.averageCustomerValue)}`);
    doc.text(`Customer Lifetime Value: Rs. ${this.formatNumber(summary.customerLifetimeValue)}`);
    doc.text(`Total Revenue: Rs. ${this.formatNumber(summary.totalRevenue)}`);
    doc.moveDown();

    // Segmentation
    if (data.segmentation) {
      doc.fontSize(12).text('Customer Segmentation', { underline: true });
      doc.moveDown(0.5);
      const segHeaders = ['Segment', 'Count'];
      const segRows = [
        ['High Value', (data.segmentation.highValue || 0).toString()],
        ['Medium Value', (data.segmentation.mediumValue || 0).toString()],
        ['Low Value', (data.segmentation.lowValue || 0).toString()]
      ];
      let y = this.drawTable(doc, segHeaders, segRows, doc.y);
      doc.y = y + 10;
    }

    // Top Customers table
    if (data.topCustomers && data.topCustomers.length > 0) {
      doc.fontSize(12).text('Top Customers', { underline: true });
      doc.moveDown(0.5);
      const customerHeaders = ['Customer Name', 'Phone', 'Type', 'Purchases', 'Jobsheets', 'Total Spent', 'Avg Order', 'Items', 'Last Purchase'];
      const customerRows = data.topCustomers.map((customer: any) => [
        customer.customerName || 'N/A',
        customer.phone || 'N/A',
        customer.customerType || 'N/A',
        (customer.totalPurchases || 0).toString(),
        (customer.totalJobsheets || 0).toString(),
        `Rs. ${this.formatNumber(customer.totalSpent)}`,
        `Rs. ${this.formatNumber(customer.averageOrderValue)}`,
        (customer.itemsPurchased || 0).toString(),
        customer.lastPurchase ? new Date(customer.lastPurchase).toLocaleDateString() : 'N/A'
      ]);
      let y = this.drawTable(doc, customerHeaders, customerRows, doc.y);
      doc.y = y + 10;
    }

    // At Risk Customers table
    if (data.atRiskCustomers && data.atRiskCustomers.length > 0) {
      doc.fontSize(12).text('At Risk Customers', { underline: true });
      doc.moveDown(0.5);
      const riskHeaders = ['Customer Name', 'Phone', 'Total Spent', 'Last Purchase', 'Days Since'];
      const riskRows = data.atRiskCustomers.map((customer: any) => [
        customer.customerName || 'N/A',
        customer.phone || 'N/A',
        `Rs. ${this.formatNumber(customer.totalSpent)}`,
        customer.lastPurchase ? new Date(customer.lastPurchase).toLocaleDateString() : 'N/A',
        (customer.daysSinceLastPurchase || 0).toString()
      ]);
      let y = this.drawTable(doc, riskHeaders, riskRows, doc.y);
      doc.y = y + 10;
    }

    // Customers by Type table
    if (data.customersByType && data.customersByType.length > 0) {
      doc.fontSize(12).text('Customers by Type', { underline: true });
      doc.moveDown(0.5);
      const typeHeaders = ['Type', 'Count', 'Revenue', 'Avg Spent', 'Percentage'];
      const typeRows = data.customersByType.map((ct: any) => [
        ct.type || 'N/A',
        (ct.count || 0).toString(),
        `Rs. ${this.formatNumber(ct.revenue)}`,
        `Rs. ${this.formatNumber(ct.averageSpent)}`,
        ct.percentage || '0%'
      ]);
      let y = this.drawTable(doc, typeHeaders, typeRows, doc.y);
      doc.y = y + 10;
    }

    // Customers by Location table
    if (data.customersByLocation && data.customersByLocation.length > 0) {
      doc.fontSize(12).text('Customers by Location', { underline: true });
      doc.moveDown(0.5);
      const locHeaders = ['Location', 'Customers', 'Revenue', 'Avg Rev/Customer'];
      const locRows = data.customersByLocation.map((cl: any) => [
        cl.locationName || 'N/A',
        (cl.customerCount || 0).toString(),
        `Rs. ${this.formatNumber(cl.revenue)}`,
        `Rs. ${this.formatNumber(cl.averageRevenuePerCustomer)}`
      ]);
      this.drawTable(doc, locHeaders, locRows, doc.y);
    }
  }

  /**
   * Add Shop Performance Data to PDF
   */
  private addShopPerformanceDataToPDF(doc: PDFKit.PDFDocument, data: any) {
    const summary = data.summary || {};

    // Shop Summary
    doc.fontSize(14).text('Shop Performance Summary', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10);
    doc.text(`Total Locations: ${summary.totalLocations || 0}`);
    doc.text(`Active Locations: ${summary.activeLocations || 0}`);
    doc.text(`Total Revenue: Rs. ${this.formatNumber(summary.totalRevenue)}`);
    doc.text(`Total Profit: Rs. ${this.formatNumber(summary.totalProfit)}`);
    doc.text(`Total Profit Margin: ${this.formatNumber(summary.totalProfitMargin)}%`);
    doc.text(`Average Revenue per Location: Rs. ${this.formatNumber(summary.averageRevenuePerLocation)}`);
    doc.text(`Total Sales: ${summary.totalSales || 0}`);
    doc.text(`Total Jobsheets: ${summary.totalJobsheets || 0}`);
    doc.moveDown();

    // Top Performing Locations table
    if (data.topPerformingLocations && data.topPerformingLocations.length > 0) {
      doc.fontSize(12).text('Top Performing Locations', { underline: true });
      doc.moveDown(0.5);
      const locationHeaders = ['Location Name', 'Type', 'Sales', 'Sales Rev', 'Jobs', 'Job Rev', 'Total Rev', 'Profit', 'Margin %', 'Customers', 'Staff', 'Inv Value'];
      const locationRows = data.topPerformingLocations.map((location: any) => [
        location.locationName || 'N/A',
        location.locationType || 'N/A',
        (location.totalSales || 0).toString(),
        `Rs. ${this.formatNumber(location.salesRevenue)}`,
        (location.jobsheets || 0).toString(),
        `Rs. ${this.formatNumber(location.jobRevenue)}`,
        `Rs. ${this.formatNumber(location.totalRevenue)}`,
        `Rs. ${this.formatNumber(location.profit)}`,
        `${this.formatNumber(location.profitMargin)}%`,
        (location.customersServed || 0).toString(),
        (location.staffCount || 0).toString(),
        `Rs. ${this.formatNumber(location.inventoryValue)}`
      ]);
      let y = this.drawTable(doc, locationHeaders, locationRows, doc.y);
      doc.y = y + 10;
    }

    // Location Comparison table
    if (data.locationComparison && data.locationComparison.length > 0) {
      doc.fontSize(12).text('Location Comparison', { underline: true });
      doc.moveDown(0.5);
      const compHeaders = ['Location', 'Current Rev', 'Previous Rev', 'Growth %', 'Trend'];
      const compRows = data.locationComparison.map((loc: any) => [
        loc.locationName || 'N/A',
        `Rs. ${this.formatNumber(loc.currentRevenue)}`,
        `Rs. ${this.formatNumber(loc.previousRevenue)}`,
        `${this.formatNumber(loc.growth)}%`,
        loc.growthTrend || 'STABLE'
      ]);
      let y = this.drawTable(doc, compHeaders, compRows, doc.y);
      doc.y = y + 10;
    }

    // Performance by Type table
    if (data.performanceByType && data.performanceByType.length > 0) {
      doc.fontSize(12).text('Performance by Location Type', { underline: true });
      doc.moveDown(0.5);
      const typeHeaders = ['Type', 'Locations', 'Revenue', 'Profit', 'Sales', 'Avg Rev/Location'];
      const typeRows = data.performanceByType.map((pt: any) => [
        pt.type || 'N/A',
        (pt.locations || 0).toString(),
        `Rs. ${this.formatNumber(pt.revenue)}`,
        `Rs. ${this.formatNumber(pt.profit)}`,
        (pt.sales || 0).toString(),
        `Rs. ${this.formatNumber(pt.averageRevenuePerLocation)}`
      ]);
      let y = this.drawTable(doc, typeHeaders, typeRows, doc.y);
      doc.y = y + 10;
    }

    // Performance Trends table
    if (data.performanceTrends && data.performanceTrends.length > 0) {
      doc.fontSize(12).text('Performance Trends', { underline: true });
      doc.moveDown(0.5);
      const trendHeaders = ['Date', 'Revenue', 'Sales', 'Active Locations', 'Avg Rev/Location'];
      const trendRows = data.performanceTrends.map((trend: any) => [
        trend.date || 'N/A',
        `Rs. ${this.formatNumber(trend.revenue)}`,
        (trend.sales || 0).toString(),
        (trend.activeLocations || 0).toString(),
        `Rs. ${this.formatNumber(trend.averageRevenuePerLocation)}`
      ]);
      this.drawTable(doc, trendHeaders, trendRows, doc.y);
    }
  }

  /**
   * Add Jobsheet Data to PDF
   */
  private addJobsheetDataToPDF(doc: PDFKit.PDFDocument, data: any) {
    const summary = data.summary || {};

    // Jobsheet Summary
    doc.fontSize(14).text('Jobsheet Summary', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10);
    doc.text(`Total Jobsheets: ${summary.totalJobsheets || 0}`);
    doc.text(`Completed Jobs: ${summary.completedJobs || 0}`);
    doc.text(`Pending Jobs: ${summary.pendingJobs || 0}`);
    doc.text(`In Progress Jobs: ${summary.inProgressJobs || 0}`);
    doc.text(`Completion Rate: ${summary.completionRate || '0%'}`);
    doc.text(`Total Revenue: Rs. ${this.formatNumber(summary.totalRevenue)}`);
    doc.text(`Avg Job Value: Rs. ${this.formatNumber(summary.avgJobValue)}`);
    doc.text(`Unique Customers: ${summary.uniqueCustomers || 0}`);
    doc.text(`Active Technicians: ${summary.activeTechnicians || 0}`);
    doc.moveDown();

    // Status Summary table
    if (data.statusSummary && data.statusSummary.length > 0) {
      doc.fontSize(12).text('Status Summary', { underline: true });
      doc.moveDown(0.5);
      const statusHeaders = ['Status', 'Count', 'Revenue', 'Avg Time (hrs)', 'Percentage'];
      const statusRows = data.statusSummary.map((status: any) => [
        status.status || 'N/A',
        (status.count || 0).toString(),
        `Rs. ${this.formatNumber(status.revenue)}`,
        this.formatNumber(status.avgCompletionTime),
        status.percentage || '0%'
      ]);
      let y = this.drawTable(doc, statusHeaders, statusRows, doc.y);
      doc.y = y + 10;
    }

    // Priority Summary table
    if (data.prioritySummary && data.prioritySummary.length > 0) {
      doc.fontSize(12).text('Priority Summary', { underline: true });
      doc.moveDown(0.5);
      const priorityHeaders = ['Priority', 'Count', 'Completed', 'Completion Rate', 'Revenue', 'Percentage'];
      const priorityRows = data.prioritySummary.map((p: any) => [
        p.priority || 'N/A',
        (p.count || 0).toString(),
        (p.completed || 0).toString(),
        p.completionRate || '0%',
        `Rs. ${this.formatNumber(p.revenue)}`,
        p.percentage || '0%'
      ]);
      let y = this.drawTable(doc, priorityHeaders, priorityRows, doc.y);
      doc.y = y + 10;
    }

    // Device Type Summary table
    if (data.deviceTypeSummary && data.deviceTypeSummary.length > 0) {
      doc.fontSize(12).text('Device Type Summary', { underline: true });
      doc.moveDown(0.5);
      const deviceHeaders = ['Device Type', 'Count', 'Revenue', 'Avg Revenue', 'Percentage'];
      const deviceRows = data.deviceTypeSummary.map((dt: any) => [
        dt.deviceType || 'N/A',
        (dt.count || 0).toString(),
        `Rs. ${this.formatNumber(dt.revenue)}`,
        `Rs. ${this.formatNumber(dt.avgRevenue)}`,
        dt.percentage || '0%'
      ]);
      let y = this.drawTable(doc, deviceHeaders, deviceRows, doc.y);
      doc.y = y + 10;
    }

    // Top Technicians table
    if (data.topTechnicians && data.topTechnicians.length > 0) {
      doc.fontSize(12).text('Top Technicians', { underline: true });
      doc.moveDown(0.5);
      const techHeaders = ['Technician', 'Email', 'Total Jobs', 'Completed', 'Completion Rate', 'Revenue', 'Avg Time', 'Customers'];
      const techRows = data.topTechnicians.map((tech: any) => [
        tech.technicianName || 'N/A',
        tech.email || 'N/A',
        (tech.totalJobs || 0).toString(),
        (tech.completedJobs || 0).toString(),
        tech.completionRate || '0%',
        `Rs. ${this.formatNumber(tech.revenue)}`,
        this.formatNumber(tech.avgCompletionTime),
        (tech.uniqueCustomers || 0).toString()
      ]);
      let y = this.drawTable(doc, techHeaders, techRows, doc.y);
      doc.y = y + 10;
    }

    // Top Customers table
    if (data.topCustomers && data.topCustomers.length > 0) {
      doc.fontSize(12).text('Top Customers', { underline: true });
      doc.moveDown(0.5);
      const customerHeaders = ['Customer Name', 'Phone', 'Email', 'Total Jobs', 'Completed', 'Total Spent', 'Avg Job Value', 'Last Job'];
      const customerRows = data.topCustomers.map((customer: any) => [
        customer.customerName || 'N/A',
        customer.phone || 'N/A',
        customer.email || 'N/A',
        (customer.totalJobs || 0).toString(),
        (customer.completedJobs || 0).toString(),
        `Rs. ${this.formatNumber(customer.totalSpent)}`,
        `Rs. ${this.formatNumber(customer.averageJobValue)}`,
        customer.lastJobDate ? new Date(customer.lastJobDate).toLocaleDateString() : 'N/A'
      ]);
      let y = this.drawTable(doc, customerHeaders, customerRows, doc.y);
      doc.y = y + 10;
    }

    // Top Jobsheets table
    if (data.topJobsheets && data.topJobsheets.length > 0) {
      doc.fontSize(12).text('Top Jobsheets', { underline: true });
      doc.moveDown(0.5);
      const jobHeaders = ['Job #', 'Customer', 'Phone', 'Technician', 'Amount', 'Status', 'Priority', 'Device', 'Location', 'Created', 'Completed'];
      const jobRows = data.topJobsheets.map((job: any) => [
        job.jobNumber || 'N/A',
        job.customerName || 'N/A',
        job.customerPhone || 'N/A',
        job.technicianName || 'N/A',
        `Rs. ${this.formatNumber(job.totalCost)}`,
        job.status || 'N/A',
        job.priority || 'N/A',
        job.deviceType || 'N/A',
        job.location || 'N/A',
        job.createdAt ? new Date(job.createdAt).toLocaleDateString() : 'N/A',
        job.completedAt ? new Date(job.completedAt).toLocaleDateString() : 'N/A'
      ]);
      let y = this.drawTable(doc, jobHeaders, jobRows, doc.y);
      doc.y = y + 10;
    }

    // Location Summary table
    if (data.locationSummary && data.locationSummary.length > 0) {
      doc.fontSize(12).text('Location Summary', { underline: true });
      doc.moveDown(0.5);
      const locHeaders = ['Location', 'Type', 'Total Jobs', 'Completed', 'Completion Rate', 'Revenue', 'Technicians', 'Avg Rev/Job'];
      const locRows = data.locationSummary.map((loc: any) => [
        loc.locationName || 'N/A',
        loc.locationType || 'N/A',
        (loc.totalJobs || 0).toString(),
        (loc.completedJobs || 0).toString(),
        loc.completionRate || '0%',
        `Rs. ${this.formatNumber(loc.revenue)}`,
        (loc.techniciansCount || 0).toString(),
        `Rs. ${this.formatNumber(loc.avgRevenuePerJob)}`
      ]);
      let y = this.drawTable(doc, locHeaders, locRows, doc.y);
      doc.y = y + 10;
    }

    // Trends by Day table
    if (data.trendsByDay && data.trendsByDay.length > 0) {
      doc.fontSize(12).text('Daily Trends', { underline: true });
      doc.moveDown(0.5);
      const trendHeaders = ['Date', 'Created', 'Completed', 'Revenue', 'Completion Rate', 'Active Techs'];
      const trendRows = data.trendsByDay.map((trend: any) => [
        trend.date || 'N/A',
        (trend.created || 0).toString(),
        (trend.completed || 0).toString(),
        `Rs. ${this.formatNumber(trend.revenue)}`,
        trend.completionRate || '0%',
        (trend.activeTechnicians || 0).toString()
      ]);
      this.drawTable(doc, trendHeaders, trendRows, doc.y);
    }
  }

  /**
   * Generate CSV Report
   */
  private generateCSVReport(reportType: string, data: any): string {
    let csv = '';

    switch (reportType) {
      case 'sales':
        // Summary
        csv += 'Summary\n';
        csv += `Total Sales,${data.summary?.totalSales || 0}\n`;
        csv += `Total Revenue,${this.formatNumber(data.summary?.totalRevenue)}\n`;
        csv += `Total Profit,${this.formatNumber(data.summary?.totalProfit)}\n`;
        csv += `Profit Margin,${this.formatNumber(data.summary?.profitMargin)}%\n`;
        csv += '\n';
        
        // Top Products
        csv += 'Top Products\n';
        csv += 'Product Name,SKU,Category,Quantity,Revenue,Profit,Profit Margin %\n';
        (data.topProducts || []).forEach((product: any) => {
          csv += `"${product.productName || 'N/A'}","${product.sku || 'N/A'}","${product.category || 'N/A'}",${product.quantity || 0},${this.formatNumber(product.revenue)},${this.formatNumber(product.profit)},${this.formatNumber(product.profitMargin)}\n`;
        });
        csv += '\n';
        
        // Top Locations
        csv += 'Top Locations\n';
        csv += 'Location Name,Type,Sales,Revenue,Profit,Profit Margin %\n';
        (data.topLocations || []).forEach((location: any) => {
          csv += `"${location.locationName || 'N/A'}","${location.locationType || 'N/A'}",${location.sales || 0},${this.formatNumber(location.revenue)},${this.formatNumber(location.profit)},${this.formatNumber(location.profitMargin)}\n`;
        });
        csv += '\n';
        
        // Sales by Day
        csv += 'Sales by Day\n';
        csv += 'Date,Sales,Revenue,Profit,Avg Order Value,Unique Customers\n';
        (data.salesByDay || []).forEach((day: any) => {
          csv += `${day.date || 'N/A'},${day.sales || 0},${this.formatNumber(day.revenue)},${this.formatNumber(day.profit)},${this.formatNumber(day.averageOrderValue)},${day.uniqueCustomers || 0}\n`;
        });
        csv += '\n';
        
        // Payment Methods
        csv += 'Payment Methods\n';
        csv += 'Method,Count,Amount,Sales Count,Avg Transaction\n';
        (data.paymentMethods || []).forEach((pm: any) => {
          csv += `"${pm.method || 'N/A'}",${pm.count || 0},${this.formatNumber(pm.amount)},${pm.salesCount || 0},${this.formatNumber(pm.averageTransaction)}\n`;
        });
        csv += '\n';
        
        // Top Customers
        csv += 'Top Customers\n';
        csv += 'Customer Name,Phone,Purchases,Total Spent,Avg Order Value\n';
        (data.topCustomers || []).forEach((customer: any) => {
          csv += `"${customer.customerName || 'N/A'}","${customer.phone || 'N/A'}",${customer.purchases || 0},${this.formatNumber(customer.totalSpent)},${this.formatNumber(customer.averageOrderValue)}\n`;
        });
        break;
        
      case 'inventory':
        csv += 'Summary\n';
        csv += `Total Items,${data.summary?.totalItems || 0}\n`;
        csv += `Total Value,${this.formatNumber(data.summary?.totalValue)}\n`;
        csv += `Total Quantity,${data.summary?.totalQuantity || 0}\n`;
        csv += '\n';
        
        csv += 'Fast Moving Items\n';
        csv += 'Product Name,SKU,Category,Quantity Sold,Turnover Rate,Revenue,Location\n';
        (data.fastMovingItems || []).forEach((item: any) => {
          csv += `"${item.productName || 'N/A'}","${item.sku || 'N/A'}","${item.category || 'N/A'}",${item.quantitySold || 0},${this.formatNumber(item.turnoverRate)},${this.formatNumber(item.revenue)},"${item.location || 'N/A'}"\n`;
        });
        csv += '\n';
        
        csv += 'Slow Moving Items\n';
        csv += 'Product Name,SKU,Category,Quantity,Value,Location\n';
        (data.slowMovingItems || []).forEach((item: any) => {
          csv += `"${item.productName || 'N/A'}","${item.sku || 'N/A'}","${item.category || 'N/A'}",${item.quantity || 0},${this.formatNumber(item.value)},"${item.location || 'N/A'}"\n`;
        });
        csv += '\n';
        
        csv += 'Category Wise Breakdown\n';
        csv += 'Category Name,Items,Quantity,Value,Retail Value,Potential Profit,Profit Margin %\n';
        (data.categoryWise || []).forEach((category: any) => {
          csv += `"${category.categoryName || 'N/A'}",${category.items || 0},${category.quantity || 0},${this.formatNumber(category.value)},${this.formatNumber(category.retailValue)},${this.formatNumber(category.potentialProfit)},${this.formatNumber(category.profitMargin)}\n`;
        });
        break;
        
      case 'staff_performance':
        csv += 'Summary\n';
        csv += `Total Staff,${data.summary?.totalStaff || 0}\n`;
        csv += `Active Staff,${data.summary?.activeStaff || 0}\n`;
        csv += `Total Revenue,${this.formatNumber(data.summary?.totalRevenue)}\n`;
        csv += '\n';
        
        csv += 'Top Performers\n';
        csv += 'Staff Name,Position,Total Sales,Sales Revenue,Completed Jobs,Job Revenue,Total Revenue,Total Profit,Unique Customers,Average Rating\n';
        (data.topPerformers || []).forEach((staff: any) => {
          csv += `"${staff.staffName || 'N/A'}","${staff.position || 'N/A'}",${staff.totalSales || 0},${this.formatNumber(staff.salesRevenue)},${staff.completedJobs || 0},${this.formatNumber(staff.jobRevenue)},${this.formatNumber(staff.totalRevenue)},${this.formatNumber(staff.totalProfit)},${staff.uniqueCustomers || 0},${this.formatNumber(staff.averageRating)}\n`;
        });
        csv += '\n';
        
        csv += 'Department Wise\n';
        csv += 'Department,Total Staff,Total Sales,Total Revenue,Total Jobs,Avg Revenue Per Staff\n';
        (data.departmentWise || []).forEach((dept: any) => {
          csv += `"${dept.department || 'N/A'}",${dept.totalStaff || 0},${dept.totalSales || 0},${this.formatNumber(dept.totalRevenue)},${dept.totalJobs || 0},${this.formatNumber(dept.averageRevenuePerStaff)}\n`;
        });
        break;
        
      case 'customer_analysis':
        csv += 'Summary\n';
        csv += `Total Customers,${data.summary?.totalCustomers || 0}\n`;
        csv += `New Customers,${data.summary?.newCustomers || 0}\n`;
        csv += `Returning Customers,${data.summary?.returningCustomers || 0}\n`;
        csv += `Customer Retention Rate,${this.formatNumber(data.summary?.customerRetentionRate)}%\n`;
        csv += `Average Customer Value,${this.formatNumber(data.summary?.averageCustomerValue)}\n`;
        csv += '\n';
        
        csv += 'Top Customers\n';
        csv += 'Customer Name,Phone,Type,Purchases,Jobsheets,Total Spent,Avg Order Value,Items Purchased,Last Purchase\n';
        (data.topCustomers || []).forEach((customer: any) => {
          csv += `"${customer.customerName || 'N/A'}","${customer.phone || 'N/A'}","${customer.customerType || 'N/A'}",${customer.totalPurchases || 0},${customer.totalJobsheets || 0},${this.formatNumber(customer.totalSpent)},${this.formatNumber(customer.averageOrderValue)},${customer.itemsPurchased || 0},"${customer.lastPurchase || 'N/A'}"\n`;
        });
        csv += '\n';
        
        csv += 'Customers by Type\n';
        csv += 'Type,Count,Revenue,Avg Spent,Percentage\n';
        (data.customersByType || []).forEach((ct: any) => {
          csv += `"${ct.type || 'N/A'}",${ct.count || 0},${this.formatNumber(ct.revenue)},${this.formatNumber(ct.averageSpent)},${ct.percentage || '0%'}\n`;
        });
        break;
        
      case 'shop_performance':
        csv += 'Summary\n';
        csv += `Total Locations,${data.summary?.totalLocations || 0}\n`;
        csv += `Total Revenue,${this.formatNumber(data.summary?.totalRevenue)}\n`;
        csv += `Total Profit,${this.formatNumber(data.summary?.totalProfit)}\n`;
        csv += '\n';
        
        csv += 'Top Performing Locations\n';
        csv += 'Location Name,Type,Total Sales,Sales Revenue,Jobsheets,Job Revenue,Total Revenue,Profit,Profit Margin %,Customers Served,Staff Count,Inventory Value\n';
        (data.topPerformingLocations || []).forEach((location: any) => {
          csv += `"${location.locationName || 'N/A'}","${location.locationType || 'N/A'}",${location.totalSales || 0},${this.formatNumber(location.salesRevenue)},${location.jobsheets || 0},${this.formatNumber(location.jobRevenue)},${this.formatNumber(location.totalRevenue)},${this.formatNumber(location.profit)},${this.formatNumber(location.profitMargin)},${location.customersServed || 0},${location.staffCount || 0},${this.formatNumber(location.inventoryValue)}\n`;
        });
        csv += '\n';
        
        csv += 'Performance by Type\n';
        csv += 'Type,Locations,Revenue,Profit,Sales,Avg Revenue Per Location\n';
        (data.performanceByType || []).forEach((pt: any) => {
          csv += `"${pt.type || 'N/A'}",${pt.locations || 0},${this.formatNumber(pt.revenue)},${this.formatNumber(pt.profit)},${pt.sales || 0},${this.formatNumber(pt.averageRevenuePerLocation)}\n`;
        });
        break;
        
      case 'jobsheet':
        csv += 'Summary\n';
        csv += `Total Jobsheets,${data.summary?.totalJobsheets || 0}\n`;
        csv += `Completed Jobs,${data.summary?.completedJobs || 0}\n`;
        csv += `Pending Jobs,${data.summary?.pendingJobs || 0}\n`;
        csv += `Completion Rate,${data.summary?.completionRate || '0%'}\n`;
        csv += `Total Revenue,${this.formatNumber(data.summary?.totalRevenue)}\n`;
        csv += '\n';
        
        csv += 'Status Summary\n';
        csv += 'Status,Count,Revenue,Avg Completion Time (hrs),Percentage\n';
        (data.statusSummary || []).forEach((status: any) => {
          csv += `"${status.status || 'N/A'}",${status.count || 0},${this.formatNumber(status.revenue)},${this.formatNumber(status.avgCompletionTime)},${status.percentage || '0%'}\n`;
        });
        csv += '\n';
        
        csv += 'Top Jobsheets\n';
        csv += 'Job Number,Customer Name,Customer Phone,Technician,Total Cost,Status,Priority,Device Type,Location\n';
        (data.topJobsheets || []).forEach((job: any) => {
          csv += `"${job.jobNumber || 'N/A'}","${job.customerName || 'N/A'}","${job.customerPhone || 'N/A'}","${job.technicianName || 'N/A'}",${this.formatNumber(job.totalCost)},"${job.status || 'N/A'}","${job.priority || 'N/A'}","${job.deviceType || 'N/A'}","${job.location || 'N/A'}"\n`;
        });
        csv += '\n';
        
        csv += 'Top Technicians\n';
        csv += 'Technician Name,Email,Total Jobs,Completed Jobs,Completion Rate,Revenue,Avg Completion Time,Unique Customers\n';
        (data.topTechnicians || []).forEach((tech: any) => {
          csv += `"${tech.technicianName || 'N/A'}","${tech.email || 'N/A'}",${tech.totalJobs || 0},${tech.completedJobs || 0},${tech.completionRate || '0%'},${this.formatNumber(tech.revenue)},${this.formatNumber(tech.avgCompletionTime)},${tech.uniqueCustomers || 0}\n`;
        });
        break;
        
      case 'profit_loss':
        csv += 'Summary\n';
        csv += `Total Revenue,${this.formatNumber(data.summary?.totalRevenue)}\n`;
        csv += `Cost of Goods Sold,${this.formatNumber(data.summary?.costOfGoodsSold)}\n`;
        csv += `Gross Profit,${this.formatNumber(data.summary?.grossProfit)}\n`;
        csv += `Gross Profit Margin,${this.formatNumber(data.summary?.grossProfitMargin)}%\n`;
        csv += `Operating Expenses,${this.formatNumber(data.summary?.operatingExpenses)}\n`;
        csv += `Net Profit,${this.formatNumber(data.summary?.netProfit)}\n`;
        csv += `Net Profit Margin,${this.formatNumber(data.summary?.netProfitMargin)}%\n`;
        csv += '\n';
        
        csv += 'Daily Breakdown\n';
        csv += 'Date,Revenue,Costs,Profit,Profit Margin %,Sales Count,Jobsheet Count\n';
        (data.breakdown || []).forEach((day: any) => {
          csv += `${day.date || 'N/A'},${this.formatNumber(day.revenue)},${this.formatNumber(day.costs)},${this.formatNumber(day.profit)},${this.formatNumber(day.profitMargin)},${day.salesCount || 0},${day.jobsheetCount || 0}\n`;
        });
        csv += '\n';
        
        csv += 'Payment Methods\n';
        csv += 'Method,Amount,Percentage\n';
        (data.paymentMethods || []).forEach((pm: any) => {
          csv += `"${pm.method || 'N/A'}",${this.formatNumber(pm.amount)},${this.formatNumber(pm.percentage)}\n`;
        });
        break;
    }

    return csv;
  }
}

export default new ReportsController();

