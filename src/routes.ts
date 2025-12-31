import { Application } from 'express';
import { config } from './shared/config/env';

import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/user/user.routes';
import roleRoutes from './modules/role/role.routes';
import permissionRoutes from './modules/permission/permission.routes';
import adminRoutes from './modules/admin/admin.routes';
import staffRoutes from './modules/staff/staff.routes';
import branchRoutes from './modules/branch/branch.routes';
import locationRoutes from './modules/location/location.routes';
import customerRoutes from './modules/customer/customer.routes';
import deviceRoutes from './modules/device/device.routes';
import jobsheetRoutes from './modules/jobsheet/jobsheet.routes';
import repairRoutes from './modules/repair/repair.routes';
// import partRoutes from './modules/part/part.routes';
import inventoryRoutes from './modules/inventory/inventory.routes';
import paymentRoutes from './modules/payment/payment.routes';
import notificationRoutes from './modules/notification/notification.routes';
import activitylogRoutes from './modules/activitylog/activitylog.routes';

// New Stock & Supplier Management Routes
import productCategoryRoutes from './modules/productcategory/productcategory.routes';
import salesRoutes from './modules/sales/sales.routes';
import salesPOSRoutes from './modules/sales/sales-pos.routes';
import productRoutes from './modules/product/product.routes';
import supplierRoutes from './modules/supplier/supplier.routes';
import purchaseOrderRoutes from './modules/purchaseorder/purchaseorder.routes';
import goodsReceiptRoutes from './modules/goodsreceipt/goodsreceipt.routes';
import stockReleaseRoutes from './modules/inventory/stockrelease.routes';
import supplierPaymentRoutes from './modules/supplierpayment/supplierpayment.routes';
import warrantyRoutes from './modules/warranty/warranty.routes';
import reportsRoutes from './modules/reports/reports.routes';
import smsRoutes from './modules/sms/sms.routes';
import productReturnRoutes from './modules/productreturn/productreturn.routes';
import addonRequestRoutes from './modules/addonrequest/addonrequest.routes';
import businessRoutes from './modules/business/business.routes';


export const setupRoutes = (app: Application) => {
  app.use(`${config.apiPrefix}/auth`, authRoutes);
  app.use(`${config.apiPrefix}/users`, userRoutes);
  app.use(`${config.apiPrefix}/roles`, roleRoutes);
  app.use(`${config.apiPrefix}/permissions`, permissionRoutes);
  app.use(`${config.apiPrefix}/admin`, adminRoutes);
  app.use(`${config.apiPrefix}/staff`, staffRoutes);
  app.use(`${config.apiPrefix}/branches`, branchRoutes); // Legacy support - kept for backward compatibility
  app.use(`${config.apiPrefix}/locations`, locationRoutes); // New unified location endpoint
  app.use(`${config.apiPrefix}/customers`, customerRoutes);
  app.use(`${config.apiPrefix}/devices`, deviceRoutes);
  app.use(`${config.apiPrefix}/jobsheets`, jobsheetRoutes);
  app.use(`${config.apiPrefix}/repairs`, repairRoutes);
  // app.use(`${config.apiPrefix}/parts`, partRoutes);
  app.use(`${config.apiPrefix}/inventory`, inventoryRoutes);
  app.use(`${config.apiPrefix}/payments`, paymentRoutes);
  app.use(`${config.apiPrefix}/notifications`, notificationRoutes);
  app.use(`${config.apiPrefix}/activity-logs`, activitylogRoutes);

  // Stock & Supplier Management Routes
  app.use(`${config.apiPrefix}/product-categories`, productCategoryRoutes);
  // Legacy/alternate path (no hyphen) to support older clients
  app.use(`${config.apiPrefix}/productcategories`, productCategoryRoutes);
  app.use(`${config.apiPrefix}/products`, productRoutes);
  app.use(`${config.apiPrefix}/suppliers`, supplierRoutes);
  app.use(`${config.apiPrefix}/purchase-orders`, purchaseOrderRoutes);
  // Legacy/alternate path (no hyphen) to support older clients
  app.use(`${config.apiPrefix}/purchaseorders`, purchaseOrderRoutes);
  app.use(`${config.apiPrefix}/goods-receipts`, goodsReceiptRoutes);
  // Legacy/alternate path (no hyphen) to support older clients
  app.use(`${config.apiPrefix}/goodsreceipts`, goodsReceiptRoutes);
  app.use(`${config.apiPrefix}/stock-releases`, stockReleaseRoutes);
  app.use(`${config.apiPrefix}/supplier-payments`, supplierPaymentRoutes);
  // Legacy/alternate path (no hyphen) to support older clients
  app.use(`${config.apiPrefix}/supplierpayments`, supplierPaymentRoutes);

  // IMPORTANT: Register POS routes BEFORE analytics routes to avoid conflicts
  // POS Sales Routes (actual sales transactions)
  app.use(`${config.apiPrefix}/sales/pos`, salesPOSRoutes);
  
  // Sales Analytics Routes (reports/dashboard)
  app.use(`${config.apiPrefix}/sales`, salesRoutes);

  // Warranty Management Routes
  app.use(`${config.apiPrefix}`, warrantyRoutes);

  // Product Return Management Routes
  app.use(`${config.apiPrefix}/returns`, productReturnRoutes);

  // Reports & Analytics Routes
  app.use(`${config.apiPrefix}/reports`, reportsRoutes);

  // SMS Gateway Routes
  app.use(`${config.apiPrefix}/sms`, smsRoutes);

  // Addon Request Routes
  app.use(`${config.apiPrefix}/addon-requests`, addonRequestRoutes);

  // Business Profile Routes (Admin only)
  app.use(`${config.apiPrefix}/business`, businessRoutes);

};

