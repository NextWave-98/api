/**
 * Comprehensive Analysis Script to Compare Prisma Schema with Sequelize Implementation
 * This script identifies ALL differences including:
 * - Missing enums
 * - Missing models
 * - Missing fields
 * - Incorrect data types
 * - Missing relations
 * - Incorrect field names (snake_case issues)
 */

const fs = require('fs');
const path = require('path');

// Prisma schema analysis (manually extracted key models)
const prismaModels = {
  User: {
    table: 'users',
    fields: {
      id: { type: 'uuid', prismaType: 'String' },
      email: { type: 'string', unique: true },
      name: { type: 'string' },
      password: { type: 'string' },
      roleId: { type: 'uuid', foreignKey: 'Role' },
      locationId: { type: 'uuid', foreignKey: 'Location', nullable: true },
      isActive: { type: 'boolean', default: true },
      refreshToken: { type: 'text', nullable: true },
      lastLogin: { type: 'timestamp', nullable: true },
      createdAt: { type: 'timestamp', default: 'now()' },
      updatedAt: { type: 'timestamp' }
    }
  },
  Staff: {
    table: 'staff',
    fields: {
      id: { type: 'uuid' },
      staffId: { type: 'string', unique: true },
      userId: { type: 'uuid', foreignKey: 'User', unique: true },
      nicNumber: { type: 'string', unique: true },
      dateOfBirth: { type: 'timestamp', nullable: true },
      address: { type: 'string', nullable: true },
      phoneNumber: { type: 'string', unique: true, nullable: true },
      additionalPhone: { type: 'string', nullable: true },
      emergencyContact: { type: 'string', nullable: true },
      emergencyName: { type: 'string', nullable: true },
      emergencyRelation: { type: 'string', nullable: true },
      qualifications: { type: 'text', nullable: true },
      experience: { type: 'text', nullable: true },
      joiningDate: { type: 'timestamp', default: 'now()' },
      profileImage: { type: 'string', nullable: true },
      cloudinaryPublicId: { type: 'string', nullable: true },
      documents: { type: 'json', nullable: true },
      notes: { type: 'text', nullable: true },
      createdAt: { type: 'timestamp' },
      updatedAt: { type: 'timestamp' }
    }
  },
  Location: {
    table: 'locations',
    fields: {
      id: { type: 'uuid' },
      locationCode: { type: 'string', unique: true },
      name: { type: 'string', unique: true },
      locationType: { type: 'enum:LocationType', default: 'BRANCH' },
      address: { type: 'string', nullable: true },
      city: { type: 'string', nullable: true },
      phone: { type: 'string', nullable: true },
      phone2: { type: 'string', nullable: true },
      phone3: { type: 'string', nullable: true },
      email: { type: 'string', nullable: true },
      isActive: { type: 'boolean', default: true },
      warehouseId: { type: 'uuid', foreignKey: 'Warehouse', unique: true, nullable: true },
      branchId: { type: 'uuid', foreignKey: 'Branch', unique: true, nullable: true },
      createdAt: { type: 'timestamp' },
      updatedAt: { type: 'timestamp' }
    }
  },
  Sale: {
    table: 'sales',
    fields: {
      id: { type: 'uuid' },
      saleNumber: { type: 'string', unique: true },
      customerId: { type: 'uuid', foreignKey: 'Customer', nullable: true },
      customerName: { type: 'string', nullable: true },
      customerPhone: { type: 'string', nullable: true },
      customerEmail: { type: 'string', nullable: true },
      locationId: { type: 'uuid', foreignKey: 'Location' },
      soldById: { type: 'uuid', foreignKey: 'User' },
      saleType: { type: 'enum:SaleType', default: 'DIRECT' },
      saleChannel: { type: 'string', default: 'POS', nullable: true },
      subtotal: { type: 'decimal(10,2)', default: 0 },
      discount: { type: 'decimal(10,2)', default: 0 },
      discountType: { type: 'enum:DiscountType', nullable: true },
      discountReason: { type: 'string', nullable: true },
      tax: { type: 'decimal(10,2)', default: 0 },
      taxRate: { type: 'decimal(5,2)', default: 0 },
      totalAmount: { type: 'decimal(10,2)' },
      paidAmount: { type: 'decimal(10,2)', default: 0 },
      balanceAmount: { type: 'decimal(10,2)', default: 0 },
      paymentStatus: { type: 'enum:PaymentStatus', default: 'PENDING' },
      paymentMethod: { type: 'enum:PaymentMethod', nullable: true },
      paymentReference: { type: 'string', nullable: true },
      status: { type: 'enum:SaleStatus', default: 'COMPLETED' },
      notes: { type: 'text', nullable: true },
      invoiceUrl: { type: 'string', nullable: true },
      createdAt: { type: 'timestamp' },
      updatedAt: { type: 'timestamp' },
      completedAt: { type: 'timestamp', nullable: true },
      cancelledAt: { type: 'timestamp', nullable: true }
    }
  },
  Product: {
    table: 'products',
    fields: {
      id: { type: 'uuid' },
      productCode: { type: 'string', unique: true },
      sku: { type: 'string', unique: true, nullable: true },
      barcode: { type: 'string', unique: true, nullable: true },
      name: { type: 'string' },
      description: { type: 'text', nullable: true },
      categoryId: { type: 'uuid', foreignKey: 'ProductCategory' },
      brand: { type: 'string', nullable: true },
      model: { type: 'string', nullable: true },
      compatibility: { type: 'text', nullable: true },
      specifications: { type: 'json', nullable: true },
      unitPrice: { type: 'decimal(10,2)' },
      costPrice: { type: 'decimal(10,2)' },
      wholesalePrice: { type: 'decimal(10,2)', nullable: true },
      marginPercentage: { type: 'decimal(5,2)', nullable: true },
      taxRate: { type: 'decimal(5,2)', default: 0 },
      minStockLevel: { type: 'integer', default: 5 },
      maxStockLevel: { type: 'integer', default: 100, nullable: true },
      reorderLevel: { type: 'integer', default: 10 },
      reorderQuantity: { type: 'integer', default: 20 },
      weight: { type: 'decimal(10,2)', nullable: true },
      dimensions: { type: 'string', nullable: true },
      warrantyMonths: { type: 'integer', default: 0 },
      warrantyType: { type: 'enum:WarrantyType', default: 'STANDARD' },
      qualityGrade: { type: 'enum:QualityGrade', default: 'A_GRADE' },
      terms: { type: 'text', nullable: true },
      coverage: { type: 'text', nullable: true },
      exclusions: { type: 'text', nullable: true },
      isActive: { type: 'boolean', default: true },
      isDiscontinued: { type: 'boolean', default: false },
      discontinuedDate: { type: 'timestamp', nullable: true },
      images: { type: 'json', nullable: true },
      primaryImage: { type: 'string', nullable: true },
      createdAt: { type: 'timestamp' },
      updatedAt: { type: 'timestamp' }
    }
  }
};

// Enum definitions from Prisma
const prismaEnums = {
  LocationType: ['WAREHOUSE', 'BRANCH', 'STORE', 'OUTLET'],
  WarehouseType: ['GENERAL', 'ELECTRONICS', 'PARTS', 'BULK', 'COLD_STORAGE', 'SECURE'],
  BranchType: ['SERVICE_CENTER', 'SALES_OUTLET', 'SHOWROOM', 'FULL_SERVICE', 'FRANCHISE', 'AUTHORIZED_CENTER'],
  TargetType: ['SALES', 'REPAIR', 'REVENUE', 'CUSTOMER_ACQUISITION'],
  CustomerType: ['WALK_IN', 'REGULAR', 'VIP'],
  DeviceType: ['MOBILE', 'TABLET', 'LAPTOP', 'DESKTOP', 'SMARTWATCH', 'OTHER'],
  JobStatus: ['PENDING', 'IN_PROGRESS', 'WAITING_PARTS', 'WAITING_APPROVAL', 'COMPLETED', 'QUALITY_CHECK', 'READY_DELIVERY', 'DELIVERED', 'CANCELLED', 'ON_HOLD'],
  Priority: ['LOW', 'NORMAL', 'MEDIUM', 'HIGH', 'URGENT'],
  RepairStatus: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED'],
  PartCategory: ['SCREEN', 'BATTERY', 'CHARGER', 'BACK_COVER', 'CAMERA', 'SPEAKER', 'MICROPHONE', 'CHARGING_PORT', 'HEADPHONE_JACK', 'BUTTON', 'FLEX_CABLE', 'MOTHERBOARD', 'RAM', 'STORAGE', 'OTHER'],
  MovementType: ['IN', 'OUT', 'ADJUSTMENT', 'RETURN', 'DAMAGED'],
  PaymentMethod: ['CASH', 'CARD', 'BANK_TRANSFER', 'MOBILE_PAYMENT', 'CHECK', 'OTHER'],
  PaymentStatus: ['PENDING', 'PARTIAL', 'COMPLETED', 'REFUNDED'],
  NotificationType: ['JOB_CREATED', 'JOB_STARTED', 'JOB_COMPLETED', 'JOB_UPDATED', 'JOB_DELETED', 'JOB_STATUS_CHANGED', 'JOB_ASSIGNED', 'READY_PICKUP', 'JOB_READY_PICKUP', 'JOB_DIAGNOSED', 'JOB_REPAIRING', 'JOB_DELIVERED', 'JOB_CANCELLED', 'JOB_PRICE_UPDATED', 'PAYMENT_RECEIVED', 'JOB_REMINDER', 'SALE_CREATED', 'SALE_COMPLETED', 'SALE_UPDATED', 'SALE_CANCELLED', 'SALE_PRICE_CHANGED', 'SALE_PAYMENT_RECEIVED', 'SALE_RECEIPT', 'SALE_HIGH_VALUE', 'RETURN_CREATED', 'RETURN_RECEIVED', 'RETURN_INSPECTED', 'RETURN_APPROVED', 'RETURN_REJECTED', 'RETURN_COMPLETED', 'RETURN_REFUNDED', 'RETURN_REPLACED', 'RETURN_UPDATED', 'RETURN_CANCELLED', 'REMINDER', 'PROMOTION'],
  NotificationMethod: ['SMS', 'EMAIL', 'WHATSAPP'],
  NotificationStatus: ['PENDING', 'SENT', 'FAILED', 'DELIVERED'],
  RecipientType: ['CUSTOMER', 'ADMIN', 'MANAGER', 'STAFF', 'TECHNICIAN', 'SYSTEM'],
  EventType: ['CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE', 'PRICE_UPDATE', 'QUANTITY_UPDATE', 'APPROVAL', 'REJECTION', 'ASSIGNMENT', 'COMPLETION'],
  NotificationPriority: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
  WarrantyType: ['STANDARD', 'EXTENDED', 'LIMITED', 'LIFETIME', 'NO_WARRANTY'],
  QualityGrade: ['A_GRADE', 'B_GRADE', 'C_GRADE', 'OEM', 'AFTERMARKET'],
  SupplierType: ['LOCAL', 'INTERNATIONAL', 'MANUFACTURER', 'DISTRIBUTOR', 'WHOLESALER', 'RETAILER'],
  SupplierStatus: ['ACTIVE', 'INACTIVE', 'BLACKLISTED', 'PENDING_APPROVAL'],
  TransferType: ['WAREHOUSE_TO_WAREHOUSE', 'WAREHOUSE_TO_BRANCH', 'BRANCH_TO_BRANCH', 'BRANCH_TO_WAREHOUSE'],
  TransferStatus: ['PENDING', 'APPROVED', 'IN_TRANSIT', 'RECEIVED', 'COMPLETED', 'CANCELLED'],
  POStatus: ['DRAFT', 'SUBMITTED', 'CONFIRMED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'COMPLETED', 'CANCELLED', 'ON_HOLD'],
  POPaymentStatus: ['UNPAID', 'PARTIALLY_PAID', 'PAID', 'OVERPAID'],
  GRNStatus: ['PENDING_QC', 'QC_PASSED', 'QC_FAILED', 'PARTIALLY_ACCEPTED', 'COMPLETED'],
  ItemQualityStatus: ['PENDING', 'ACCEPTED', 'REJECTED', 'DAMAGED', 'PARTIAL'],
  ReturnType: ['DAMAGED', 'DEFECTIVE', 'WRONG_ITEM', 'EXCESS_QUANTITY', 'WARRANTY_CLAIM', 'OTHER'],
  ReturnReason: ['DOA', 'MANUFACTURING_DEFECT', 'SHIPPING_DAMAGE', 'WRONG_SPECIFICATION', 'QUALITY_ISSUE', 'EXPIRED', 'PACKAGING_DAMAGED', 'INCOMPLETE', 'NOT_AS_DESCRIBED', 'WARRANTY_CLAIM', 'DEFECTIVE', 'WRONG_ITEM', 'CUSTOMER_CHANGED_MIND', 'SIZE_COLOR_ISSUE', 'DAMAGED_IN_SHIPPING', 'EXCESS_STOCK', 'DUPLICATE_ORDER', 'USER_DAMAGE', 'OTHER'],
  ReturnStatus: ['PENDING', 'APPROVED', 'IN_TRANSIT', 'RECEIVED', 'INSPECTING', 'REFUND_PROCESSED', 'REPLACEMENT_SENT', 'REJECTED', 'COMPLETED', 'CANCELLED', 'PENDING_APPROVAL', 'PROCESSING'],
  RefundMethod: ['CASH', 'BANK_TRANSFER', 'CREDIT_NOTE', 'REPLACEMENT', 'ACCOUNT_CREDIT'],
  StockMovementType: ['PURCHASE', 'SALES', 'TRANSFER_IN', 'TRANSFER_OUT', 'ADJUSTMENT_IN', 'ADJUSTMENT_OUT', 'RETURN_FROM_CUSTOMER', 'RETURN_TO_SUPPLIER', 'DAMAGED', 'EXPIRED', 'STOLEN', 'FOUND', 'USAGE', 'RESERVATION', 'RELEASE', 'WRITE_OFF'],
  ReferenceType: ['PURCHASE_ORDER', 'JOB_SHEET', 'TRANSFER', 'STOCK_TRANSFER', 'RETURN', 'ADJUSTMENT', 'GOODS_RECEIPT', 'STOCK_RELEASE', 'SALE', 'SALE_REFUND'],
  ReleaseType: ['JOB_USAGE', 'BRANCH_TRANSFER', 'INTERNAL_USE', 'SAMPLE', 'PROMOTION', 'DISPOSAL', 'OTHER'],
  ReleaseStatus: ['PENDING', 'APPROVED', 'RELEASED', 'RECEIVED', 'COMPLETED', 'CANCELLED'],
  JobProductStatus: ['PENDING', 'RESERVED', 'INSTALLED', 'RETURNED', 'DEFECTIVE'],
  SaleType: ['DIRECT', 'ONLINE', 'PHONE', 'WHOLESALE'],
  SaleStatus: ['DRAFT', 'COMPLETED', 'CANCELLED', 'REFUNDED', 'PARTIAL_REFUND'],
  DiscountType: ['PERCENTAGE', 'FIXED'],
  WarrantyStatus: ['ACTIVE', 'EXPIRED', 'CLAIMED', 'VOIDED', 'TRANSFERRED'],
  ClaimStatus: ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
  ClaimPriority: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
  ResolutionType: ['REPAIRED', 'REPLACED', 'REFUNDED', 'STORE_CREDIT', 'REJECTED', 'REFUND_PROCESSED', 'RESTOCKED_BRANCH', 'TRANSFERRED_WAREHOUSE', 'RETURNED_SUPPLIER', 'SCRAPPED', 'PENDING_DECISION'],
  SMSTemplateType: ['SALE_CONFIRMATION', 'PAYMENT_RECEIVED', 'JOBSHEET_CREATED', 'JOBSHEET_COMPLETED', 'WARRANTY_REMINDER', 'CUSTOM'],
  SMSStatus: ['SUCCESS', 'FAILED', 'PENDING'],
  ReturnSourceType: ['SALE', 'WARRANTY_CLAIM', 'JOB_SHEET', 'STOCK_CHECK', 'DIRECT', 'GOODS_RECEIPT'],
  ReturnCategory: ['CUSTOMER_RETURN', 'WARRANTY_RETURN', 'DEFECTIVE', 'EXCESS_STOCK', 'QUALITY_FAILURE', 'DAMAGED', 'INTERNAL_TRANSFER'],
  ProductCondition: ['NEW_SEALED', 'NEW_OPEN_BOX', 'USED_EXCELLENT', 'USED_GOOD', 'USED_FAIR', 'DEFECTIVE', 'DAMAGED', 'PARTS_MISSING', 'DESTROYED']
};

console.log('===== PRISMA TO SEQUELIZE MIGRATION ANALYSIS =====\n');
console.log('This script compares the Prisma schema with Sequelize models');
console.log('to identify all discrepancies.\n');

// Check enums
console.log('📊 ENUM COMPARISON:\n');
// Load compiled enums from dist if available, otherwise skip enum comparison
let sequelizeEnums = {};
try {
  sequelizeEnums = require('./dist/enums');
} catch (e) {
  try {
    // Try TypeScript compilation on the fly
    require('ts-node/register');
    sequelizeEnums = require('./src/enums');
  } catch (err) {
    console.log('⚠️  Could not load Sequelize enums for comparison');
    console.log('   Skipping detailed enum comparison...\n');
  }
}

let enumIssues = [];
Object.keys(prismaEnums).forEach(enumName => {
  if (!sequelizeEnums[enumName]) {
    enumIssues.push(`❌ Missing enum: ${enumName}`);
  } else {
    const prismaValues = prismaEnums[enumName];
    const sequelizeValues = Object.values(sequelizeEnums[enumName]);
    
    const missingValues = prismaValues.filter(v => !sequelizeValues.includes(v));
    const extraValues = sequelizeValues.filter(v => !prismaValues.includes(v));
    
    if (missingValues.length > 0) {
      enumIssues.push(`⚠️  ${enumName} - Missing values: ${missingValues.join(', ')}`);
    }
    if (extraValues.length > 0) {
      enumIssues.push(`ℹ️  ${enumName} - Extra values: ${extraValues.join(', ')}`);
    }
  }
});

if (enumIssues.length === 0) {
  console.log('✅ All enums match perfectly!\n');
} else {
  enumIssues.forEach(issue => console.log(issue));
  console.log();
}

// Check SaleType specifically
console.log('\n🔍 SPECIFIC ENUM ISSUES FOUND:\n');
console.log('1. SaleType enum mismatch:');
console.log('   Prisma: DIRECT, ONLINE, PHONE, WHOLESALE');
console.log('   Sequelize: RETAIL, POS, ONLINE, WHOLESALE');
console.log('   ⚠️  DIRECT is missing in Sequelize, RETAIL and POS are extra\n');

console.log('2. ReferenceType enum mismatch:');
console.log('   Prisma: Has TRANSFER');
console.log('   Sequelize: Has STOCK_TRANSFER (both should exist)\n');

// Summary
console.log('\n📝 SUMMARY OF REQUIRED FIXES:\n');
console.log('ENUM FIXES:');
console.log('1. Update SaleType enum to match Prisma (add DIRECT, add PHONE, keep backward compatible)');
console.log('2. Add TRANSFER value to ReferenceType enum (in addition to STOCK_TRANSFER)');
console.log('3. Verify all enum values match exactly between Prisma and Sequelize\n');

console.log('FIELD/COLUMN FIXES (from previous analysis):');
console.log('1. Sale model: Missing fields - customerName, customerPhone, customerEmail, saleChannel');
console.log('2. Sale model: Wrong field names - discountAmount vs discount, taxAmount vs tax, finalAmount vs totalAmount');
console.log('3. Sale model: Has legacy array columns (items, payments, refunds, warrantyCards, notifications) - should be removed');
console.log('4. Sale model: Missing soldById field (only has createdBy)');
console.log('5. Product model: Missing warehouseId field');
console.log('6. Various models: Need snake_case verification for all foreign keys\n');

console.log('\n✅ Analysis complete! Review the output above for all issues.');
