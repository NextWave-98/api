/**
 * Sequelize Models Index
 * Central export point for all Sequelize models and associations
 */

// Import all models
import { User } from './user.model';
import { Role } from './role.model';
import { Permission } from './permission.model';
import { RolePermission } from './role-permission.model';
import { Staff } from './staff.model';

import { Location } from './location.model';
import { Warehouse } from './warehouse.model';
import { Branch } from './branch.model';
import { WarehouseStaff } from './warehouse-staff.model';
import { BranchStaff } from './branch-staff.model';
import { InventoryZone } from './inventory-zone.model';
import { BranchTarget } from './branch-target.model';
import { Business } from './business.model';

import { Customer } from './customer.model';
import { Device } from './device.model';

import { ProductCategory } from './product-category.model';
import { Product } from './product.model';
import { ProductInventory } from './product-inventory.model';
import { ProductStockMovement } from './product-stock-movement.model';

import { JobSheet } from './jobsheet.model';
import { Repair } from './repair.model';
import { JobSheetPart } from './jobsheet-part.model';
import { JobSheetProduct } from './jobsheet-product.model';
import { JobStatusHistory } from './job-status-history.model';

import { Part } from './part.model';
import { Inventory } from './inventory.model';
import { StockMovement } from './stock-movement.model';

import { Payment } from './payment.model';

import { Sale } from './sale.model';
import { SaleItem } from './sale-item.model';
import { SalePayment } from './sale-payment.model';
import { SaleRefund } from './sale-refund.model';

import { Supplier } from './supplier.model';
import { SupplierProduct } from './supplier-product.model';
import { PurchaseOrder } from './purchase-order.model';
import { PurchaseOrderItem } from './purchase-order-item.model';
import { POStatusHistory } from './po-status-history.model';
import { SupplierPayment } from './supplier-payment.model';
import { SupplierReturn } from './supplier-return.model';
import { SupplierReturnItem } from './supplier-return-item.model';

import { WarrantyCard } from './warranty-card.model';
import { WarrantyClaim } from './warranty-claim.model';

import { StockRelease } from './stock-release.model';
import { StockReleaseItem } from './stock-release-item.model';

import { GoodsReceipt } from './goods-receipt.model';
import { GoodsReceiptItem } from './goods-receipt-item.model';

import { WarehouseInventory } from './warehouse-inventory.model';
import { StockTransfer } from './stock-transfer.model';
import { StockTransferItem } from './stock-transfer-item.model';

import { Notification } from './notification.model';
import { NotificationSetting } from './notification-setting.model';
import { ActivityLog } from './activity-log.model';
import { SMSLog } from './sms-log.model';
import { ProductReturn } from './product-return.model';
import { AddonRequest } from './addon-request.model';
import { CustomerFinancialDetails } from './customer-financial-details.model';
import { InstallmentPlan } from './installment-plan.model';
import { InstallmentPayment } from './installment-payment.model';

/**
 * Register all models with the Sequelize instance
 * Should be called once at application startup
 */
export const registerModels = () => {
  // Import sequelize only when needed to avoid circular dependency
  const { sequelize } = require('../config/database');

  const models = [
    User,
    Role,
    Permission,
    RolePermission,
    Staff,
    Location,
    Warehouse,
    Branch,
    WarehouseStaff,
    BranchStaff,
    InventoryZone,
    BranchTarget,
    Business,
    Customer,
    Device,
    ProductCategory,
    Product,
    ProductInventory,
    ProductStockMovement,
    JobSheet,
    Repair,
    JobSheetPart,
    JobSheetProduct,
    JobStatusHistory,
    Part,
    Inventory,
    StockMovement,
    Payment,
    Sale,
    SaleItem,
    SalePayment,
    SaleRefund,
    Supplier,
    SupplierProduct,
    PurchaseOrder,
    PurchaseOrderItem,
    POStatusHistory,
    SupplierPayment,
    SupplierReturn,
    SupplierReturnItem,
    WarrantyCard,
    WarrantyClaim,
    StockRelease,
    StockReleaseItem,
    GoodsReceipt,
    GoodsReceiptItem,
    WarehouseInventory,
    StockTransfer,
    StockTransferItem,
    Notification,
    NotificationSetting,
    ActivityLog,
    SMSLog,
    ProductReturn,
    AddonRequest,
    CustomerFinancialDetails,
    InstallmentPlan,
    InstallmentPayment,
  ];

  if (sequelize && typeof sequelize.addModels === 'function') {
    try {
      sequelize.addModels(models);
      console.log('✅ Models registered with Sequelize');
    } catch (error) {
      console.warn('Models registration warning:', error);
    }
  }
};

// Track if associations have been initialized
let associationsInitialized = false;

/**
 * Initialize all model associations
 * This should be called after all models are loaded
 * Note: With sequelize-typescript decorators, associations are auto-configured
 * This function is kept for backward compatibility but does minimal work
 */
export const
  initializeAssociations = (): void => {
    if (associationsInitialized) {
      console.log('🔗 Sequelize model associations already initialized.');
      return;
    }

    console.log('🔗 Sequelize model associations initialized via decorators.');
    associationsInitialized = true;

    // Associations are defined via decorators in model files
    // No manual definitions needed here
  };

// Legacy manual associations - not used when decorators are present
const _manualAssociations = () => {
  // User associations
  User.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });
  User.belongsTo(Location, { foreignKey: 'location_id', as: 'location' });
  User.hasOne(Staff, { foreignKey: 'user_id', as: 'staff' });
  User.hasMany(JobSheet, { foreignKey: 'created_by_id', as: 'createdJobs' });
  User.hasMany(JobSheet, { foreignKey: 'assigned_to_id', as: 'assignedJobs' });
  User.hasMany(Payment, { foreignKey: 'received_by', as: 'receivedPayments' });
  User.hasMany(Sale, { foreignKey: 'sold_by_id', as: 'sales' });

  // Role associations
  Role.hasMany(User, { foreignKey: 'role_id', as: 'users' });
  Role.belongsToMany(Permission, {
    through: { model: RolePermission, unique: false },
    foreignKey: 'b',
    otherKey: 'a',
    as: 'permissions',
    timestamps: false,
  });

  // Permission associations
  Permission.belongsToMany(Role, {
    through: { model: RolePermission, unique: false },
    foreignKey: 'a',
    otherKey: 'b',
    as: 'roles',
    timestamps: false,
  });

  // Staff associations
  Staff.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
  Staff.hasMany(WarehouseStaff, { foreignKey: 'user_id', as: 'warehouseAssignments' });
  Staff.hasMany(BranchStaff, { foreignKey: 'user_id', as: 'branchAssignments' });

  // Location associations
  Location.belongsTo(Warehouse, { foreignKey: 'warehouse_id', as: 'warehouse' });
  Location.belongsTo(Branch, { foreignKey: 'branch_id', as: 'branch' });
  Location.hasMany(User, { foreignKey: 'location_id', as: 'users' });
  Location.hasMany(Customer, { foreignKey: 'location_id', as: 'customers' });
  Location.hasMany(JobSheet, { foreignKey: 'location_id', as: 'jobSheets' });
  Location.hasMany(Sale, { foreignKey: 'location_id', as: 'sales' });
  Location.hasMany(ProductInventory, { foreignKey: 'location_id', as: 'productInventory' });
  Location.hasMany(Inventory, { foreignKey: 'location_id', as: 'partInventory' });
  Location.hasMany(StockRelease, { foreignKey: 'from_location_id', as: 'stockReleasesFrom' });
  Location.hasMany(StockRelease, { foreignKey: 'to_location_id', as: 'stockReleasesTo' });
  Location.hasMany(GoodsReceipt, { foreignKey: 'destination_location_id', as: 'goodsReceipts' });
  Location.hasMany(ProductReturn, { foreignKey: 'location_id', as: 'productReturns' });

  // Warehouse associations
  Warehouse.hasOne(Location, { foreignKey: 'warehouse_id', as: 'location' });
  Warehouse.hasMany(WarehouseStaff, { foreignKey: 'warehouse_id', as: 'staff' });
  Warehouse.hasMany(InventoryZone, { foreignKey: 'warehouse_id', as: 'zones' });
  Warehouse.hasMany(WarehouseInventory, { foreignKey: 'warehouse_id', as: 'inventory' });
  Warehouse.hasMany(StockTransfer, { foreignKey: 'from_warehouse_id', as: 'transfersOut' });
  Warehouse.hasMany(StockTransfer, { foreignKey: 'to_warehouse_id', as: 'transfersIn' });

  // Branch associations
  Branch.hasOne(Location, { foreignKey: 'branch_id', as: 'location' });
  Branch.hasMany(BranchStaff, { foreignKey: 'branch_id', as: 'staff' });
  Branch.hasMany(BranchTarget, { foreignKey: 'branch_id', as: 'targets' });

  // WarehouseStaff associations
  WarehouseStaff.belongsTo(Warehouse, { foreignKey: 'warehouse_id', as: 'warehouse' });
  WarehouseStaff.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

  // BranchStaff associations
  BranchStaff.belongsTo(Branch, { foreignKey: 'branch_id', as: 'branch' });
  BranchStaff.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

  // InventoryZone associations
  InventoryZone.belongsTo(Warehouse, { foreignKey: 'warehouse_id', as: 'warehouse' });

  // BranchTarget associations
  BranchTarget.belongsTo(Branch, { foreignKey: 'branch_id', as: 'branch' });

  // Customer associations
  Customer.belongsTo(Location, { foreignKey: 'location_id', as: 'location' });
  Customer.hasMany(Device, { foreignKey: 'customer_id', as: 'devices' });
  Customer.hasMany(JobSheet, { foreignKey: 'customer_id', as: 'jobSheets' });
  Customer.hasMany(Payment, { foreignKey: 'customer_id', as: 'payments' });
  Customer.hasMany(Sale, { foreignKey: 'customer_id', as: 'sales' });
  Customer.hasMany(WarrantyCard, { foreignKey: 'customer_id', as: 'warranties' });
  Customer.hasMany(ProductReturn, { foreignKey: 'customer_id', as: 'returns' });

  // Device associations
  Device.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });
  Device.hasMany(JobSheet, { foreignKey: 'device_id', as: 'jobSheets' });

  // ProductCategory associations (Self-referential)
  ProductCategory.belongsTo(ProductCategory, { foreignKey: 'parent_id', as: 'parent' });
  ProductCategory.hasMany(ProductCategory, { foreignKey: 'parent_id', as: 'children' });
  ProductCategory.hasMany(Product, { foreignKey: 'category_id', as: 'products' });

  // Product associations
  Product.belongsTo(ProductCategory, { foreignKey: 'category_id', as: 'category' });
  Product.hasMany(ProductInventory, { foreignKey: 'product_id', as: 'inventory' });
  Product.hasMany(SaleItem, { foreignKey: 'product_id', as: 'saleItems' });
  Product.hasMany(JobSheetProduct, { foreignKey: 'product_id', as: 'jobSheetProducts' });
  Product.hasMany(SupplierProduct, { foreignKey: 'product_id', as: 'suppliers' });
  Product.hasMany(PurchaseOrderItem, { foreignKey: 'product_id', as: 'purchaseOrderItems' });
  Product.hasMany(StockReleaseItem, { foreignKey: 'product_id', as: 'stockReleaseItems' });
  Product.hasMany(WarehouseInventory, { foreignKey: 'product_id', as: 'warehouseInventory' });

  // ProductInventory associations
  ProductInventory.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
  ProductInventory.belongsTo(Location, { foreignKey: 'location_id', as: 'location' });

  // ProductStockMovement associations
  ProductStockMovement.belongsTo(ProductInventory, { foreignKey: 'product_inventory_id', as: 'productInventory' });

  // JobSheet associations
  JobSheet.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });
  JobSheet.belongsTo(Device, { foreignKey: 'device_id', as: 'device' });
  JobSheet.belongsTo(Location, { foreignKey: 'location_id', as: 'location' });
  JobSheet.belongsTo(User, { foreignKey: 'created_by_id', as: 'createdBy' });
  JobSheet.belongsTo(User, { foreignKey: 'assigned_to_id', as: 'assignedTo' });
  JobSheet.hasMany(Repair, { foreignKey: 'job_sheet_id', as: 'repairs' });
  JobSheet.hasMany(JobSheetPart, { foreignKey: 'job_sheet_id', as: 'parts' });
  JobSheet.hasMany(JobSheetProduct, { foreignKey: 'job_sheet_id', as: 'products' });
  JobSheet.hasMany(Payment, { foreignKey: 'job_sheet_id', as: 'payments' });
  JobSheet.hasMany(JobStatusHistory, { foreignKey: 'job_sheet_id', as: 'statusHistory' });
  JobSheet.hasOne(WarrantyClaim, { foreignKey: 'job_sheet_id', as: 'warrantyClaim' });

  // Repair associations
  Repair.belongsTo(JobSheet, { foreignKey: 'job_sheet_id', as: 'jobSheet' });

  // JobSheetPart associations
  JobSheetPart.belongsTo(JobSheet, { foreignKey: 'job_sheet_id', as: 'jobSheet' });
  JobSheetPart.belongsTo(Part, { foreignKey: 'part_id', as: 'part' });

  // JobSheetProduct associations
  JobSheetProduct.belongsTo(JobSheet, { foreignKey: 'job_sheet_id', as: 'jobSheet' });
  JobSheetProduct.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

  // JobStatusHistory associations
  JobStatusHistory.belongsTo(JobSheet, { foreignKey: 'job_sheet_id', as: 'jobSheet' });

  // Part associations
  Part.hasMany(Inventory, { foreignKey: 'part_id', as: 'inventory' });
  Part.hasMany(StockMovement, { foreignKey: 'part_id', as: 'stockMovements' });
  Part.hasMany(JobSheetPart, { foreignKey: 'part_id', as: 'jobSheetParts' });

  // Inventory associations
  Inventory.belongsTo(Part, { foreignKey: 'part_id', as: 'part' });
  Inventory.belongsTo(Location, { foreignKey: 'location_id', as: 'location' });

  // StockMovement associations
  StockMovement.belongsTo(Part, { foreignKey: 'part_id', as: 'part' });

  // Payment associations - handled by @BelongsTo decorators in payment.model.ts
  // Payment.belongsTo(JobSheet, { foreignKey: 'jobSheetId', as: 'jobSheet' });
  // Payment.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });
  // Payment.belongsTo(User, { foreignKey: 'receivedBy', as: 'receivedByUser' });

  // Sale associations
  Sale.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });
  Sale.belongsTo(Location, { foreignKey: 'location_id', as: 'location' });
  Sale.belongsTo(User, { foreignKey: 'sold_by_id', as: 'soldBy' });
  Sale.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
  Sale.hasMany(SaleItem, { foreignKey: 'sale_id', as: 'items' });
  Sale.hasMany(SalePayment, { foreignKey: 'sale_id', as: 'payments' });
  Sale.hasMany(SaleRefund, { foreignKey: 'sale_id', as: 'refunds' });
  Sale.hasMany(WarrantyCard, { foreignKey: 'sale_id', as: 'warranties' });
  Sale.hasMany(ProductReturn, { foreignKey: 'sale_id', as: 'returns' });

  // SaleItem associations
  SaleItem.belongsTo(Sale, { foreignKey: 'sale_id', as: 'sale' });
  SaleItem.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
  SaleItem.hasMany(WarrantyCard, { foreignKey: 'sale_item_id', as: 'warranties' });

  // SalePayment associations
  SalePayment.belongsTo(Sale, { foreignKey: 'sale_id', as: 'sale' });
  SalePayment.belongsTo(User, { foreignKey: 'received_by_id', as: 'receivedBy' });

  // SaleRefund associations
  SaleRefund.belongsTo(Sale, { foreignKey: 'sale_id', as: 'sale' });
  SaleRefund.belongsTo(User, { foreignKey: 'processed_by_id', as: 'processedBy' });

  // Supplier associations
  Supplier.hasMany(SupplierProduct, { foreignKey: 'supplier_id', as: 'products' });
  Supplier.hasMany(PurchaseOrder, { foreignKey: 'supplier_id', as: 'purchaseOrders' });
  Supplier.hasMany(SupplierPayment, { foreignKey: 'supplier_id', as: 'payments' });
  Supplier.hasMany(SupplierReturn, { foreignKey: 'supplier_id', as: 'returns' });

  // SupplierProduct associations
  SupplierProduct.belongsTo(Supplier, { foreignKey: 'supplier_id', as: 'supplier' });
  SupplierProduct.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

  // PurchaseOrder associations
  PurchaseOrder.belongsTo(Supplier, { foreignKey: 'supplier_id', as: 'supplier' });
  PurchaseOrder.hasMany(PurchaseOrderItem, { foreignKey: 'purchase_order_id', as: 'items' });
  PurchaseOrder.hasMany(POStatusHistory, { foreignKey: 'purchase_order_id', as: 'statusHistory' });
  PurchaseOrder.hasMany(SupplierPayment, { foreignKey: 'purchase_order_id', as: 'payments' });
  PurchaseOrder.hasMany(GoodsReceipt, { foreignKey: 'purchase_order_id', as: 'receipts' });

  // PurchaseOrderItem associations
  PurchaseOrderItem.belongsTo(PurchaseOrder, { foreignKey: 'purchase_order_id', as: 'purchaseOrder' });
  PurchaseOrderItem.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

  // POStatusHistory associations
  POStatusHistory.belongsTo(PurchaseOrder, { foreignKey: 'purchase_order_id', as: 'purchaseOrder' });

  // SupplierPayment associations
  SupplierPayment.belongsTo(Supplier, { foreignKey: 'supplier_id', as: 'supplier' });
  SupplierPayment.belongsTo(PurchaseOrder, { foreignKey: 'purchase_order_id', as: 'purchaseOrder' });

  // SupplierReturn associations
  SupplierReturn.belongsTo(Supplier, { foreignKey: 'supplier_id', as: 'supplier' });
  SupplierReturn.hasMany(SupplierReturnItem, { foreignKey: 'supplier_return_id', as: 'items' });

  // SupplierReturnItem associations
  SupplierReturnItem.belongsTo(SupplierReturn, { foreignKey: 'supplier_return_id', as: 'supplierReturn' });

  // WarrantyCard associations
  WarrantyCard.belongsTo(Sale, { foreignKey: 'sale_id', as: 'sale' });
  WarrantyCard.belongsTo(SaleItem, { foreignKey: 'sale_item_id', as: 'saleItem' });
  WarrantyCard.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
  WarrantyCard.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });
  WarrantyCard.belongsTo(Location, { foreignKey: 'location_id', as: 'location' });
  WarrantyCard.hasMany(WarrantyClaim, { foreignKey: 'warranty_card_id', as: 'claims' });

  // WarrantyClaim associations
  WarrantyClaim.belongsTo(WarrantyCard, { foreignKey: 'warranty_card_id', as: 'warrantyCard' });
  WarrantyClaim.belongsTo(JobSheet, { foreignKey: 'job_sheet_id', as: 'jobSheet' });
  WarrantyClaim.belongsTo(Product, { foreignKey: 'replacement_product_id', as: 'replacementProduct' });
  WarrantyClaim.belongsTo(User, { foreignKey: 'submitted_by_id', as: 'submittedBy' });
  WarrantyClaim.belongsTo(User, { foreignKey: 'assigned_to_id', as: 'assignedTo' });
  WarrantyClaim.belongsTo(Location, { foreignKey: 'location_id', as: 'location' });

  // StockRelease associations
  StockRelease.belongsTo(Location, { foreignKey: 'from_location_id', as: 'fromLocation' });
  StockRelease.belongsTo(Location, { foreignKey: 'to_location_id', as: 'toLocation' });
  StockRelease.hasMany(StockReleaseItem, { foreignKey: 'stock_release_id', as: 'items' });

  // StockReleaseItem associations
  StockReleaseItem.belongsTo(StockRelease, { foreignKey: 'stock_release_id', as: 'stockRelease' });
  StockReleaseItem.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

  // GoodsReceipt associations
  GoodsReceipt.belongsTo(PurchaseOrder, { foreignKey: 'purchase_order_id', as: 'purchaseOrder' });
  GoodsReceipt.belongsTo(Location, { foreignKey: 'destination_location_id', as: 'destinationLocation' });
  GoodsReceipt.hasMany(GoodsReceiptItem, { foreignKey: 'goods_receipt_id', as: 'items' });

  // GoodsReceiptItem associations
  GoodsReceiptItem.belongsTo(GoodsReceipt, { foreignKey: 'goods_receipt_id', as: 'goodsReceipt' });

  // WarehouseInventory associations
  WarehouseInventory.belongsTo(Warehouse, { foreignKey: 'warehouse_id', as: 'warehouse' });
  WarehouseInventory.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

  // StockTransfer associations
  StockTransfer.belongsTo(Warehouse, { foreignKey: 'from_warehouse_id', as: 'fromWarehouse' });
  StockTransfer.belongsTo(Warehouse, { foreignKey: 'to_warehouse_id', as: 'toWarehouse' });
  StockTransfer.hasMany(StockTransferItem, { foreignKey: 'stock_transfer_id', as: 'items' });

  // StockTransferItem associations
  StockTransferItem.belongsTo(StockTransfer, { foreignKey: 'stock_transfer_id', as: 'stockTransfer' });

  // ProductReturn associations
  ProductReturn.belongsTo(Sale, { foreignKey: 'sale_id', as: 'sale' });
  ProductReturn.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });
  ProductReturn.belongsTo(Location, { foreignKey: 'location_id', as: 'location' });
  ProductReturn.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
  ProductReturn.belongsTo(User, { foreignKey: 'created_by_id', as: 'createdBy' });
  ProductReturn.belongsTo(WarrantyClaim, { foreignKey: 'warranty_claim_id', as: 'warrantyClaim' });
  ProductReturn.belongsTo(JobSheet, { foreignKey: 'job_sheet_id', as: 'jobSheet' });
};

/**
 * Get all models for syncing or migrations
 */
export const getAllModels = () => {
  return [
    // Core
    User,
    Role,
    Permission,
    Staff,

    // Location
    Location,
    Warehouse,
    Branch,
    WarehouseStaff,
    BranchStaff,
    InventoryZone,
    BranchTarget,
    Business,

    // Customer
    Customer,
    Device,

    // Products
    ProductCategory,
    Product,
    ProductInventory,
    ProductStockMovement,

    // Jobs
    JobSheet,
    Repair,
    JobSheetPart,
    JobSheetProduct,
    JobStatusHistory,

    // Parts
    Part,
    Inventory,
    StockMovement,

    // Payments
    Payment,

    // Sales
    Sale,
    SaleItem,
    SalePayment,
    SaleRefund,

    // Suppliers
    Supplier,
    SupplierProduct,
    PurchaseOrder,
    PurchaseOrderItem,
    POStatusHistory,
    SupplierPayment,
    SupplierReturn,
    SupplierReturnItem,

    // Warranty
    WarrantyCard,
    WarrantyClaim,

    // Stock Management
    StockRelease,
    StockReleaseItem,
    GoodsReceipt,
    GoodsReceiptItem,
    WarehouseInventory,
    StockTransfer,
    StockTransferItem,

    // System
    Notification,
    NotificationSetting,
    ActivityLog,
    SMSLog,
    ProductReturn,
    AddonRequest,
    CustomerFinancialDetails,
    InstallmentPlan,
    InstallmentPayment,
  ];
};

// Export all models
export {
  // Core
  User,
  Role,
  Permission,
  Staff,

  // Location
  Location,
  Warehouse,
  Branch,
  WarehouseStaff,
  BranchStaff,
  InventoryZone,
  BranchTarget,
  Business,

  // Customer
  Customer,
  Device,

  // Products
  ProductCategory,
  Product,
  ProductInventory,
  ProductStockMovement,

  // Jobs
  JobSheet,
  Repair,
  JobSheetPart,
  JobSheetProduct,
  JobStatusHistory,

  // Parts
  Part,
  Inventory,
  StockMovement,

  // Payments
  Payment,

  // Sales
  Sale,
  SaleItem,
  SalePayment,
  SaleRefund,

  // Suppliers
  Supplier,
  SupplierProduct,
  PurchaseOrder,
  PurchaseOrderItem,
  POStatusHistory,
  SupplierPayment,
  SupplierReturn,
  SupplierReturnItem,

  // Warranty
  WarrantyCard,
  WarrantyClaim,

  // Stock Management
  StockRelease,
  StockReleaseItem,
  GoodsReceipt,
  GoodsReceiptItem,
  WarehouseInventory,
  StockTransfer,
  StockTransferItem,

  // System
  Notification,
  NotificationSetting,
  ActivityLog,
  SMSLog,
  ProductReturn,
  RolePermission,
  AddonRequest,

  // Installment Payments
  CustomerFinancialDetails,
  InstallmentPlan,
  InstallmentPayment,
};

// Export enums
export * from '../enums';

// Export for convenience
export default {
  User,
  Role,
  Permission,
  RolePermission,
  initializeAssociations,
  getAllModels,
  registerModels,
};

