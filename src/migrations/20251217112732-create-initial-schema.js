'use strict';

/**
 * INITIAL SCHEMA MIGRATION
 * Generated from Prisma schema: 2025-12-17T11:27:32.062Z
 * 
 * This migration creates all tables with their complete structure.
 * Run this migration first before any other migrations.
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    console.log('🚀 Creating initial database schema...\n');
    
    // ========================================
    // CREATE ENUMS
    // ========================================
    await queryInterface.sequelize.query(`
      CREATE TYPE "LocationType" AS ENUM ('WAREHOUSE', 'BRANCH', 'STORE', 'OUTLET');
    `);
    console.log('  ✓ Created enum: LocationType');

    await queryInterface.sequelize.query(`
      CREATE TYPE "WarehouseType" AS ENUM ('GENERAL', 'ELECTRONICS', 'PARTS', 'BULK', 'COLD_STORAGE', 'SECURE');
    `);
    console.log('  ✓ Created enum: WarehouseType');

    await queryInterface.sequelize.query(`
      CREATE TYPE "BranchType" AS ENUM ('SERVICE_CENTER', 'SALES_OUTLET', 'SHOWROOM', 'FULL_SERVICE', 'FRANCHISE', 'AUTHORIZED_CENTER');
    `);
    console.log('  ✓ Created enum: BranchType');

    await queryInterface.sequelize.query(`
      CREATE TYPE "TransferType" AS ENUM ('WAREHOUSE_TO_WAREHOUSE', 'WAREHOUSE_TO_BRANCH', 'BRANCH_TO_BRANCH', 'BRANCH_TO_WAREHOUSE');
    `);
    console.log('  ✓ Created enum: TransferType');

    await queryInterface.sequelize.query(`
      CREATE TYPE "TransferStatus" AS ENUM ('PENDING', 'APPROVED', 'IN_TRANSIT', 'RECEIVED', 'COMPLETED', 'CANCELLED');
    `);
    console.log('  ✓ Created enum: TransferStatus');

    await queryInterface.sequelize.query(`
      CREATE TYPE "TargetType" AS ENUM ('SALES', 'REPAIR', 'REVENUE', 'CUSTOMER_ACQUISITION');
    `);
    console.log('  ✓ Created enum: TargetType');

    await queryInterface.sequelize.query(`
      CREATE TYPE "CustomerType" AS ENUM ('WALK_IN', 'REGULAR', 'VIP');
    `);
    console.log('  ✓ Created enum: CustomerType');

    await queryInterface.sequelize.query(`
      CREATE TYPE "DeviceType" AS ENUM ('MOBILE', 'TABLET', 'LAPTOP', 'DESKTOP', 'SMARTWATCH', 'OTHER');
    `);
    console.log('  ✓ Created enum: DeviceType');

    await queryInterface.sequelize.query(`
      CREATE TYPE "JobStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'WAITING_PARTS', 'WAITING_APPROVAL', 'COMPLETED', 'QUALITY_CHECK', 'READY_DELIVERY', 'DELIVERED', 'CANCELLED', 'ON_HOLD');
    `);
    console.log('  ✓ Created enum: JobStatus');

    await queryInterface.sequelize.query(`
      CREATE TYPE "Priority" AS ENUM ('LOW', 'NORMAL', 'MEDIUM', 'HIGH', 'URGENT');
    `);
    console.log('  ✓ Created enum: Priority');

    await queryInterface.sequelize.query(`
      CREATE TYPE "RepairStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED');
    `);
    console.log('  ✓ Created enum: RepairStatus');

    await queryInterface.sequelize.query(`
      CREATE TYPE "PartCategory" AS ENUM ('SCREEN', 'BATTERY', 'CHARGER', 'BACK_COVER', 'CAMERA', 'SPEAKER', 'MICROPHONE', 'CHARGING_PORT', 'HEADPHONE_JACK', 'BUTTON', 'FLEX_CABLE', 'MOTHERBOARD', 'RAM', 'STORAGE', 'OTHER');
    `);
    console.log('  ✓ Created enum: PartCategory');

    await queryInterface.sequelize.query(`
      CREATE TYPE "MovementType" AS ENUM ('IN', 'OUT', 'ADJUSTMENT', 'RETURN', 'DAMAGED');
    `);
    console.log('  ✓ Created enum: MovementType');

    await queryInterface.sequelize.query(`
      CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'CARD', 'BANK_TRANSFER', 'MOBILE_PAYMENT', 'CHECK', 'OTHER');
    `);
    console.log('  ✓ Created enum: PaymentMethod');

    await queryInterface.sequelize.query(`
      CREATE TYPE "RecipientType" AS ENUM ('CUSTOMER', 'ADMIN', 'MANAGER', 'STAFF', 'TECHNICIAN', 'SYSTEM');
    `);
    console.log('  ✓ Created enum: RecipientType');

    await queryInterface.sequelize.query(`
      CREATE TYPE "EventType" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE', 'PRICE_UPDATE', 'QUANTITY_UPDATE', 'APPROVAL', 'REJECTION', 'ASSIGNMENT', 'COMPLETION');
    `);
    console.log('  ✓ Created enum: EventType');

    await queryInterface.sequelize.query(`
      CREATE TYPE "NotificationPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
    `);
    console.log('  ✓ Created enum: NotificationPriority');

    await queryInterface.sequelize.query(`
      CREATE TYPE "NotificationType" AS ENUM ('JOB_CREATED', 'JOB_STARTED', 'JOB_COMPLETED', 'JOB_UPDATED', 'JOB_DELETED', 'JOB_STATUS_CHANGED', 'JOB_ASSIGNED', 'READY_PICKUP', 'JOB_READY_PICKUP', 'JOB_DIAGNOSED', 'JOB_REPAIRING', 'JOB_DELIVERED', 'JOB_CANCELLED', 'JOB_PRICE_UPDATED', 'PAYMENT_RECEIVED', 'JOB_REMINDER', 'SALE_CREATED', 'SALE_COMPLETED', 'SALE_UPDATED', 'SALE_CANCELLED', 'SALE_PRICE_CHANGED', 'SALE_PAYMENT_RECEIVED', 'SALE_RECEIPT', 'SALE_HIGH_VALUE', 'RETURN_CREATED', 'RETURN_RECEIVED', 'RETURN_INSPECTED', 'RETURN_APPROVED', 'RETURN_REJECTED', 'RETURN_COMPLETED', 'RETURN_REFUNDED', 'RETURN_REPLACED', 'RETURN_UPDATED', 'RETURN_CANCELLED', 'REMINDER', 'PROMOTION');
    `);
    console.log('  ✓ Created enum: NotificationType');

    await queryInterface.sequelize.query(`
      CREATE TYPE "NotificationMethod" AS ENUM ('SMS', 'EMAIL', 'WHATSAPP');
    `);
    console.log('  ✓ Created enum: NotificationMethod');

    await queryInterface.sequelize.query(`
      CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'DELIVERED');
    `);
    console.log('  ✓ Created enum: NotificationStatus');

    await queryInterface.sequelize.query(`
      CREATE TYPE "WarrantyType" AS ENUM ('STANDARD', 'EXTENDED', 'LIMITED', 'LIFETIME', 'NO_WARRANTY');
    `);
    console.log('  ✓ Created enum: WarrantyType');

    await queryInterface.sequelize.query(`
      CREATE TYPE "QualityGrade" AS ENUM ('A_GRADE', 'B_GRADE', 'C_GRADE', 'OEM', 'AFTERMARKET');
    `);
    console.log('  ✓ Created enum: QualityGrade');

    await queryInterface.sequelize.query(`
      CREATE TYPE "SupplierType" AS ENUM ('LOCAL', 'INTERNATIONAL', 'MANUFACTURER', 'DISTRIBUTOR', 'WHOLESALER', 'RETAILER');
    `);
    console.log('  ✓ Created enum: SupplierType');

    await queryInterface.sequelize.query(`
      CREATE TYPE "SupplierStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'BLACKLISTED', 'PENDING_APPROVAL');
    `);
    console.log('  ✓ Created enum: SupplierStatus');

    await queryInterface.sequelize.query(`
      CREATE TYPE "POStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'CONFIRMED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'COMPLETED', 'CANCELLED', 'ON_HOLD');
    `);
    console.log('  ✓ Created enum: POStatus');

    await queryInterface.sequelize.query(`
      CREATE TYPE "POPaymentStatus" AS ENUM ('UNPAID', 'PARTIALLY_PAID', 'PAID', 'OVERPAID');
    `);
    console.log('  ✓ Created enum: POPaymentStatus');

    await queryInterface.sequelize.query(`
      CREATE TYPE "GRNStatus" AS ENUM ('PENDING_QC', 'QC_PASSED', 'QC_FAILED', 'PARTIALLY_ACCEPTED', 'COMPLETED');
    `);
    console.log('  ✓ Created enum: GRNStatus');

    await queryInterface.sequelize.query(`
      CREATE TYPE "ItemQualityStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'DAMAGED', 'PARTIAL');
    `);
    console.log('  ✓ Created enum: ItemQualityStatus');

    await queryInterface.sequelize.query(`
      CREATE TYPE "ReturnType" AS ENUM ('DAMAGED', 'DEFECTIVE', 'WRONG_ITEM', 'EXCESS_QUANTITY', 'WARRANTY_CLAIM', 'OTHER');
    `);
    console.log('  ✓ Created enum: ReturnType');

    await queryInterface.sequelize.query(`
      CREATE TYPE "ReturnReason" AS ENUM ('DOA', 'MANUFACTURING_DEFECT', 'SHIPPING_DAMAGE', 'WRONG_SPECIFICATION', 'QUALITY_ISSUE', 'EXPIRED', 'PACKAGING_DAMAGED', 'INCOMPLETE', 'NOT_AS_DESCRIBED', 'WARRANTY_CLAIM', 'DEFECTIVE', 'WRONG_ITEM', 'CUSTOMER_CHANGED_MIND', 'SIZE_COLOR_ISSUE', 'DAMAGED_IN_SHIPPING', 'EXCESS_STOCK', 'DUPLICATE_ORDER', 'USER_DAMAGE', 'OTHER');
    `);
    console.log('  ✓ Created enum: ReturnReason');

    await queryInterface.sequelize.query(`
      CREATE TYPE "ReturnStatus" AS ENUM ('PENDING', 'APPROVED', 'IN_TRANSIT', 'RECEIVED', 'INSPECTING', 'REFUND_PROCESSED', 'REPLACEMENT_SENT', 'REJECTED', 'COMPLETED', 'CANCELLED', 'PENDING_APPROVAL', 'PROCESSING');
    `);
    console.log('  ✓ Created enum: ReturnStatus');

    await queryInterface.sequelize.query(`
      CREATE TYPE "RefundMethod" AS ENUM ('CASH', 'BANK_TRANSFER', 'CREDIT_NOTE', 'REPLACEMENT', 'ACCOUNT_CREDIT');
    `);
    console.log('  ✓ Created enum: RefundMethod');

    await queryInterface.sequelize.query(`
      CREATE TYPE "StockMovementType" AS ENUM ('PURCHASE', 'SALES', 'TRANSFER_IN', 'TRANSFER_OUT', 'ADJUSTMENT_IN', 'ADJUSTMENT_OUT', 'RETURN_FROM_CUSTOMER', 'RETURN_TO_SUPPLIER', 'DAMAGED', 'EXPIRED', 'STOLEN', 'FOUND', 'USAGE', 'RESERVATION', 'RELEASE', 'WRITE_OFF');
    `);
    console.log('  ✓ Created enum: StockMovementType');

    await queryInterface.sequelize.query(`
      CREATE TYPE "ReferenceType" AS ENUM ('PURCHASE_ORDER', 'JOB_SHEET', 'TRANSFER', 'RETURN', 'ADJUSTMENT', 'GOODS_RECEIPT', 'STOCK_RELEASE', 'SALE', 'SALE_REFUND');
    `);
    console.log('  ✓ Created enum: ReferenceType');

    await queryInterface.sequelize.query(`
      CREATE TYPE "ReleaseType" AS ENUM ('JOB_USAGE', 'BRANCH_TRANSFER', 'INTERNAL_USE', 'SAMPLE', 'PROMOTION', 'DISPOSAL', 'OTHER');
    `);
    console.log('  ✓ Created enum: ReleaseType');

    await queryInterface.sequelize.query(`
      CREATE TYPE "ReleaseStatus" AS ENUM ('PENDING', 'APPROVED', 'RELEASED', 'RECEIVED', 'COMPLETED', 'CANCELLED');
    `);
    console.log('  ✓ Created enum: ReleaseStatus');

    await queryInterface.sequelize.query(`
      CREATE TYPE "JobProductStatus" AS ENUM ('PENDING', 'RESERVED', 'INSTALLED', 'RETURNED', 'DEFECTIVE');
    `);
    console.log('  ✓ Created enum: JobProductStatus');

    await queryInterface.sequelize.query(`
      CREATE TYPE "SaleType" AS ENUM ('DIRECT', 'ONLINE', 'PHONE', 'WHOLESALE');
    `);
    console.log('  ✓ Created enum: SaleType');

    await queryInterface.sequelize.query(`
      CREATE TYPE "SaleStatus" AS ENUM ('DRAFT', 'COMPLETED', 'CANCELLED', 'REFUNDED', 'PARTIAL_REFUND');
    `);
    console.log('  ✓ Created enum: SaleStatus');

    await queryInterface.sequelize.query(`
      CREATE TYPE "DiscountType" AS ENUM ('PERCENTAGE', 'FIXED');
    `);
    console.log('  ✓ Created enum: DiscountType');

    await queryInterface.sequelize.query(`
      CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PARTIAL', 'COMPLETED', 'REFUNDED');
    `);
    console.log('  ✓ Created enum: PaymentStatus');

    await queryInterface.sequelize.query(`
      CREATE TYPE "WarrantyStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'CLAIMED', 'VOIDED', 'TRANSFERRED');
    `);
    console.log('  ✓ Created enum: WarrantyStatus');

    await queryInterface.sequelize.query(`
      CREATE TYPE "ClaimStatus" AS ENUM ('SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
    `);
    console.log('  ✓ Created enum: ClaimStatus');

    await queryInterface.sequelize.query(`
      CREATE TYPE "ClaimPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
    `);
    console.log('  ✓ Created enum: ClaimPriority');

    await queryInterface.sequelize.query(`
      CREATE TYPE "ResolutionType" AS ENUM ('REPAIRED', 'REPLACED', 'REFUNDED', 'STORE_CREDIT', 'REJECTED', 'REFUND_PROCESSED', 'RESTOCKED_BRANCH', 'TRANSFERRED_WAREHOUSE', 'RETURNED_SUPPLIER', 'SCRAPPED', 'PENDING_DECISION');
    `);
    console.log('  ✓ Created enum: ResolutionType');

    await queryInterface.sequelize.query(`
      CREATE TYPE "SMSTemplateType" AS ENUM ('SALE_CONFIRMATION', 'PAYMENT_RECEIVED', 'JOBSHEET_CREATED', 'JOBSHEET_COMPLETED', 'WARRANTY_REMINDER', 'CUSTOM');
    `);
    console.log('  ✓ Created enum: SMSTemplateType');

    await queryInterface.sequelize.query(`
      CREATE TYPE "SMSStatus" AS ENUM ('SUCCESS', 'FAILED', 'PENDING');
    `);
    console.log('  ✓ Created enum: SMSStatus');

    await queryInterface.sequelize.query(`
      CREATE TYPE "ReturnSourceType" AS ENUM ('SALE', 'WARRANTY_CLAIM', 'JOB_SHEET', 'STOCK_CHECK', 'DIRECT', 'GOODS_RECEIPT');
    `);
    console.log('  ✓ Created enum: ReturnSourceType');

    await queryInterface.sequelize.query(`
      CREATE TYPE "ReturnCategory" AS ENUM ('CUSTOMER_RETURN', 'WARRANTY_RETURN', 'DEFECTIVE', 'EXCESS_STOCK', 'QUALITY_FAILURE', 'DAMAGED', 'INTERNAL_TRANSFER');
    `);
    console.log('  ✓ Created enum: ReturnCategory');

    await queryInterface.sequelize.query(`
      CREATE TYPE "ProductCondition" AS ENUM ('NEW_SEALED', 'NEW_OPEN_BOX', 'USED_EXCELLENT', 'USED_GOOD', 'USED_FAIR', 'DEFECTIVE', 'DAMAGED', 'PARTS_MISSING', 'DESTROYED');
    `);
    console.log('  ✓ Created enum: ProductCondition');

    
    // ========================================
    // CREATE TABLES (without foreign keys)
    // ========================================

    // User → users
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      role_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      location_id: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      },
      refresh_token: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      last_login: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false,
      },
      staff: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      received_payments: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      activity_logs: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      notifications: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      role: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      location: {
        type: Sequelize.UUID,
        allowNull: true,
      },
    });
    console.log('  ✓ Created table: users');

    // Staff → staff
    await queryInterface.createTable('staff', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
      },
      staff_id: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
      },
      nic_number: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      date_of_birth: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      address: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      phone_number: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true,
      },
      additional_phone: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      emergency_contact: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      emergency_name: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      emergency_relation: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      qualifications: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      experience: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      joining_date: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      profile_image: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      cloudinary_public_id: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      documents: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      notes: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false,
      },
      user: {
        type: Sequelize.UUID,
        allowNull: true,
      },
    });
    console.log('  ✓ Created table: staff');

    // Location → locations
    await queryInterface.createTable('locations', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
      },
      location_code: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      location_type: {
        type: Sequelize.ENUM('WAREHOUSE', 'BRANCH', 'STORE', 'OUTLET'),
        allowNull: false,
      },
      address: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      city: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      phone: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      phone2: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      phone3: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false,
      },
      warehouse_id: {
        type: Sequelize.UUID,
        allowNull: true,
        unique: true,
      },
      branch_id: {
        type: Sequelize.UUID,
        allowNull: true,
        unique: true,
      },
      customers: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      job_sheets: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      inventory: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      product_inventory: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      sales: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      goods_receipts: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      warranty_cards: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      warranty_claims: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      product_returns: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      warehouse: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      branch: {
        type: Sequelize.UUID,
        allowNull: true,
      },
    });
    console.log('  ✓ Created table: locations');

    // Warehouse → _warehouse
    await queryInterface.createTable('_warehouse', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
      },
      warehouse_code: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      description: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      address: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      city: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      district: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      province: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      postal_code: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      country: {
        type: Sequelize.STRING,
        defaultValue: "Sri Lanka",
        allowNull: false,
      },
      phone: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      alternate_phone: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      manager_name: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      manager_phone: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      manager_email: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      total_area: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true,
      },
      storage_capacity: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      zones: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
    });
    console.log('  ✓ Created table: _warehouse');

    // Branch → branches
    await queryInterface.createTable('branches', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
      },
      branch_code: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      short_name: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      description: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      address: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      city: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      district: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      province: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      postal_code: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      country: {
        type: Sequelize.STRING,
        defaultValue: "Sri Lanka",
        allowNull: false,
      },
      phone: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      alternate_phone: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      fax: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      website: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      manager_name: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      manager_phone: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      manager_email: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      business_reg_no: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      tax_id: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      branch_type: {
        type: Sequelize.ENUM('SERVICE_CENTER', 'SALES_OUTLET', 'SHOWROOM', 'FULL_SERVICE', 'FRANCHISE', 'AUTHORIZED_CENTER'),
        allowNull: false,
      },
      services: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      has_service_center: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      },
      has_showroom: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      has_parking: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      floor_area: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true,
      },
      daily_capacity: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      technician_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false,
      },
      service_counters: {
        type: Sequelize.INTEGER,
        defaultValue: 1,
        allowNull: false,
      },
      operating_hours: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      monthly_target: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true,
      },
      yearly_target: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      },
      opening_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      closure_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      closure_reason: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      notes: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      images: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      documents: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false,
      },
      branch_staff: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      branch_targets: {
        type: Sequelize.STRING,
        allowNull: false,
      },
    });
    console.log('  ✓ Created table: branches');

    // WarehouseStaff → warehouse_staff
    await queryInterface.createTable('warehouse_staff', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
      },
      warehouse_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      position: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      start_date: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      end_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      is_primary: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false,
      },
      warehouse: {
        type: Sequelize.UUID,
        allowNull: true,
      },
    });
    console.log('  ✓ Created table: warehouse_staff');

    // BranchStaff → branch_staff
    await queryInterface.createTable('branch_staff', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
      },
      branch_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      position: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      start_date: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      end_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      is_primary: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false,
      },
      branch: {
        type: Sequelize.UUID,
        allowNull: true,
      },
    });
    console.log('  ✓ Created table: branch_staff');

    // InventoryZone → inventory_zones
    await queryInterface.createTable('inventory_zones', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
      },
      warehouse_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      zone_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      zone_code: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      description: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      capacity: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      zone_type: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      aisles: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false,
      },
      warehouse: {
        type: Sequelize.UUID,
        allowNull: true,
      },
    });
    console.log('  ✓ Created table: inventory_zones');

    // WarehouseInventory → _warehouse_inventory
    await queryInterface.createTable('_warehouse_inventory', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
      },
      warehouse_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      product_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      quantity: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false,
      },
      reserved_quantity: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false,
      },
      available_quantity: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false,
      },
      zone_code: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      aisle: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      rack: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      shelf: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      bin_location: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      batches: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      warehouse: {
        type: Sequelize.UUID,
        allowNull: true,
      },
    });
    console.log('  ✓ Created table: _warehouse_inventory');

    // StockTransfer → stock_transfers
    await queryInterface.createTable('stock_transfers', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
      },
      transfer_number: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      from_warehouse_id: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      to_warehouse_id: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      from_location_id: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      to_location_id: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      transfer_type: {
        type: Sequelize.ENUM('WAREHOUSE_TO_WAREHOUSE', 'WAREHOUSE_TO_BRANCH', 'BRANCH_TO_BRANCH', 'BRANCH_TO_WAREHOUSE'),
        allowNull: false,
      },
      transfer_date: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('PENDING', 'APPROVED', 'IN_TRANSIT', 'RECEIVED', 'COMPLETED', 'CANCELLED'),
        allowNull: false,
      },
      requested_by: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      approved_by: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      approved_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      sent_by: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      sent_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      received_by: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      received_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      notes: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      attachments: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false,
      },
      items: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      from_warehouse: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      to_warehouse: {
        type: Sequelize.UUID,
        allowNull: true,
      },
    });
    console.log('  ✓ Created table: stock_transfers');

    // StockTransferItem → stock_transfer_items
    await queryInterface.createTable('stock_transfer_items', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
      },
      stock_transfer_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      product_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      requested_quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      sent_quantity: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false,
      },
      received_quantity: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false,
      },
      notes: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false,
      },
      stock_transfer: {
        type: Sequelize.UUID,
        allowNull: true,
      },
    });
    console.log('  ✓ Created table: stock_transfer_items');

    // BranchTarget → branch_targets
    await queryInterface.createTable('branch_targets', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
      },
      branch_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      target_type: {
        type: Sequelize.ENUM('SALES', 'REPAIR', 'REVENUE', 'CUSTOMER_ACQUISITION'),
        allowNull: false,
      },
      target_period: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      target_value: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
      },
      achieved_value: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0,
        allowNull: false,
      },
      start_date: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      end_date: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false,
      },
      branch: {
        type: Sequelize.UUID,
        allowNull: true,
      },
    });
    console.log('  ✓ Created table: branch_targets');

    // Role → roles
    await queryInterface.createTable('roles', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      description: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      },
      users: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      permissions: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false,
      },
    });
    console.log('  ✓ Created table: roles');

    // Permission → permissions
    await queryInterface.createTable('permissions', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      description: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      module: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      action: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      roles: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false,
      },
    });
    console.log('  ✓ Created table: permissions');

    // Customer → customers
    await queryInterface.createTable('customers', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
      },
      customer_id: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      phone: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      alternate_phone: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      address: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      city: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      nic_number: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true,
      },
      location_id: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      customer_type: {
        type: Sequelize.ENUM('WALK_IN', 'REGULAR', 'VIP'),
        allowNull: false,
      },
      loyalty_points: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false,
      },
      notes: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false,
      },
      devices: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      job_sheets: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      payments: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      notifications: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      sales: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      warranty_cards: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      product_returns: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      location: {
        type: Sequelize.UUID,
        allowNull: true,
      },
    });
    console.log('  ✓ Created table: customers');

    // Device → devices
    await queryInterface.createTable('devices', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
      },
      customer_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      device_type: {
        type: Sequelize.ENUM('MOBILE', 'TABLET', 'LAPTOP', 'DESKTOP', 'SMARTWATCH', 'OTHER'),
        allowNull: false,
      },
      brand: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      model: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      serial_number: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true,
      },
      imei: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true,
      },
      color: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      purchase_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      warranty_expiry: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      notes: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false,
      },
      job_sheets: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      customer: {
        type: Sequelize.UUID,
        allowNull: true,
      },
    });
    console.log('  ✓ Created table: devices');

    // JobSheet → job_sheets
    await queryInterface.createTable('job_sheets', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
      },
      job_number: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      customer_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      device_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      location_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      created_by_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      assigned_to_id: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      issue_description: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      customer_remarks: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      technician_remarks: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      device_condition: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      accessories: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      device_password: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      backup_taken: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('PENDING', 'IN_PROGRESS', 'WAITING_PARTS', 'WAITING_APPROVAL', 'COMPLETED', 'QUALITY_CHECK', 'READY_DELIVERY', 'DELIVERED', 'CANCELLED', 'ON_HOLD'),
        allowNull: false,
      },
      priority: {
        type: Sequelize.ENUM('LOW', 'NORMAL', 'MEDIUM', 'HIGH', 'URGENT'),
        allowNull: false,
      },
      received_date: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      expected_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      completed_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      delivered_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      estimated_cost: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0,
        allowNull: false,
      },
      actual_cost: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0,
        allowNull: false,
      },
      labour_cost: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0,
        allowNull: false,
      },
      parts_cost: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0,
        allowNull: false,
      },
      discount_amount: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0,
        allowNull: false,
      },
      total_amount: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0,
        allowNull: false,
      },
      paid_amount: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0,
        allowNull: false,
      },
      balance_amount: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0,
        allowNull: false,
      },
      warranty_period: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      warranty_expiry: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false,
      },
      repairs: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      parts: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      products: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      payments: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      status_history: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      notifications: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      warranty_claim: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      customer: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      device: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      location: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      assigned_to: {
        type: Sequelize.UUID,
        allowNull: true,
      },
    });
    console.log('  ✓ Created table: job_sheets');

    // Repair → repairs
    await queryInterface.createTable('repairs', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
      },
      job_sheet_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      repair_type: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      description: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      cost: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0,
        allowNull: false,
      },
      start_time: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      end_time: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED'),
        allowNull: false,
      },
      notes: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false,
      },
      job_sheet: {
        type: Sequelize.UUID,
        allowNull: true,
      },
    });
    console.log('  ✓ Created table: repairs');

    // Part → parts
    await queryInterface.createTable('parts', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
      },
      part_number: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      description: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      category: {
        type: Sequelize.ENUM('SCREEN', 'BATTERY', 'CHARGER', 'BACK_COVER', 'CAMERA', 'SPEAKER', 'MICROPHONE', 'CHARGING_PORT', 'HEADPHONE_JACK', 'BUTTON', 'FLEX_CABLE', 'MOTHERBOARD', 'RAM', 'STORAGE', 'OTHER'),
        allowNull: false,
      },
      brand: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      model: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      compatibility: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      unit_price: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
      },
      cost_price: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
      },
      min_stock_level: {
        type: Sequelize.INTEGER,
        defaultValue: 5,
        allowNull: false,
      },
      reorder_level: {
        type: Sequelize.INTEGER,
        defaultValue: 10,
        allowNull: false,
      },
      supplier: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      supplier_contact: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      warranty_months: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false,
      },
      inventory: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      job_sheet_parts: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      stock_movements: {
        type: Sequelize.STRING,
        allowNull: false,
      },
    });
    console.log('  ✓ Created table: parts');

    // Inventory → inventory
    await queryInterface.createTable('inventory', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
      },
      part_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      location_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      quantity: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false,
      },
      storage_location: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      last_restocked: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false,
      },
      part: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      location: {
        type: Sequelize.UUID,
        allowNull: true,
      },
    });
    console.log('  ✓ Created table: inventory');

    // JobSheetPart → job_sheet_parts
    await queryInterface.createTable('job_sheet_parts', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
      },
      job_sheet_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      part_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      unit_price: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
      },
      total_price: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
      },
      warranty_months: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false,
      },
      job_sheet: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      part: {
        type: Sequelize.UUID,
        allowNull: true,
      },
    });
    console.log('  ✓ Created table: job_sheet_parts');

    // StockMovement → stock_movements
    await queryInterface.createTable('stock_movements', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
      },
      part_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      movement_type: {
        type: Sequelize.ENUM('IN', 'OUT', 'ADJUSTMENT', 'RETURN', 'DAMAGED'),
        allowNull: false,
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      reference_id: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      reference_type: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      notes: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      part: {
        type: Sequelize.UUID,
        allowNull: true,
      },
    });
    console.log('  ✓ Created table: stock_movements');

    // Payment → payments
    await queryInterface.createTable('payments', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
      },
      payment_number: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      job_sheet_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      customer_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      received_by_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      amount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
      },
      payment_method: {
        type: Sequelize.ENUM('CASH', 'CARD', 'BANK_TRANSFER', 'MOBILE_PAYMENT', 'CHECK', 'OTHER'),
        allowNull: false,
      },
      payment_date: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      reference: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      notes: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false,
      },
      job_sheet: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      customer: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      received_by: {
        type: Sequelize.UUID,
        allowNull: true,
      },
    });
    console.log('  ✓ Created table: payments');

    // JobStatusHistory → job_status_history
    await queryInterface.createTable('job_status_history', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
      },
      job_sheet_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      from_status: {
        type: Sequelize.ENUM('PENDING', 'IN_PROGRESS', 'WAITING_PARTS', 'WAITING_APPROVAL', 'COMPLETED', 'QUALITY_CHECK', 'READY_DELIVERY', 'DELIVERED', 'CANCELLED', 'ON_HOLD'),
        allowNull: true,
      },
      to_status: {
        type: Sequelize.ENUM('PENDING', 'IN_PROGRESS', 'WAITING_PARTS', 'WAITING_APPROVAL', 'COMPLETED', 'QUALITY_CHECK', 'READY_DELIVERY', 'DELIVERED', 'CANCELLED', 'ON_HOLD'),
        allowNull: false,
      },
      changed_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      remarks: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      job_sheet: {
        type: Sequelize.UUID,
        allowNull: true,
      },
    });
    console.log('  ✓ Created table: job_status_history');

    // Notification → notifications
    await queryInterface.createTable('notifications', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
      },
      customer_id: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      job_sheet_id: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      sale_id: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      product_return_id: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      type: {
        type: Sequelize.ENUM('JOB_CREATED', 'JOB_STARTED', 'JOB_COMPLETED', 'JOB_UPDATED', 'JOB_DELETED', 'JOB_STATUS_CHANGED', 'JOB_ASSIGNED', 'READY_PICKUP', 'JOB_READY_PICKUP', 'JOB_DIAGNOSED', 'JOB_REPAIRING', 'JOB_DELIVERED', 'JOB_CANCELLED', 'JOB_PRICE_UPDATED', 'PAYMENT_RECEIVED', 'JOB_REMINDER', 'SALE_CREATED', 'SALE_COMPLETED', 'SALE_UPDATED', 'SALE_CANCELLED', 'SALE_PRICE_CHANGED', 'SALE_PAYMENT_RECEIVED', 'SALE_RECEIPT', 'SALE_HIGH_VALUE', 'RETURN_CREATED', 'RETURN_RECEIVED', 'RETURN_INSPECTED', 'RETURN_APPROVED', 'RETURN_REJECTED', 'RETURN_COMPLETED', 'RETURN_REFUNDED', 'RETURN_REPLACED', 'RETURN_UPDATED', 'RETURN_CANCELLED', 'REMINDER', 'PROMOTION'),
        allowNull: false,
      },
      event_type: {
        type: Sequelize.ENUM('CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE', 'PRICE_UPDATE', 'QUANTITY_UPDATE', 'APPROVAL', 'REJECTION', 'ASSIGNMENT', 'COMPLETION'),
        allowNull: true,
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      message: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      method: {
        type: Sequelize.ENUM('SMS', 'EMAIL', 'WHATSAPP'),
        allowNull: false,
      },
      recipient: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('PENDING', 'SENT', 'FAILED', 'DELIVERED'),
        allowNull: false,
      },
      recipient_type: {
        type: Sequelize.ENUM('CUSTOMER', 'ADMIN', 'MANAGER', 'STAFF', 'TECHNICIAN', 'SYSTEM'),
        allowNull: false,
      },
      recipient_user_id: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      recipient_role: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      priority: {
        type: Sequelize.ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT'),
        allowNull: false,
      },
      workflow_stage: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      parent_notification_id: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      retry_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false,
      },
      last_retry_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      failure_reason: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      sent_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false,
      },
      customer: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      job_sheet: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      sale: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      product_return: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      recipient_user: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      parent_notification: {
        type: Sequelize.UUID,
        allowNull: true,
      },
    });
    console.log('  ✓ Created table: notifications');

    // NotificationSetting → notification_settings
    await queryInterface.createTable('notification_settings', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
      },
      notification_type: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      enabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      },
      admin_enabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      manager_enabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      customer_enabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      },
      staff_enabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      sms_enabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      },
      email_enabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      whatsapp_enabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      priority: {
        type: Sequelize.ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT'),
        allowNull: false,
      },
      auto_send: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false,
      },
    });
    console.log('  ✓ Created table: notification_settings');

    // ActivityLog → activity_logs
    await queryInterface.createTable('activity_logs', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      action: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      module: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      record_id: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      details: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      ip_address: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      user_agent: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      user: {
        type: Sequelize.UUID,
        allowNull: true,
      },
    });
    console.log('  ✓ Created table: activity_logs');

    // ProductCategory → product_categories
    await queryInterface.createTable('product_categories', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
      },
      category_code: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      description: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      parent_id: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      image: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      },
      display_order: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false,
      },
      products: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      parent: {
        type: Sequelize.UUID,
        allowNull: true,
      },
    });
    console.log('  ✓ Created table: product_categories');

    // Product → products
    await queryInterface.createTable('products', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
      },
      product_code: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      sku: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true,
      },
      barcode: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      description: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      category_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      brand: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      model: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      compatibility: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      specifications: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      unit_price: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
      },
      cost_price: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
      },
      wholesale_price: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true,
      },
      margin_percentage: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true,
      },
      tax_rate: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0,
        allowNull: false,
      },
      min_stock_level: {
        type: Sequelize.INTEGER,
        defaultValue: 5,
        allowNull: false,
      },
      max_stock_level: {
        type: Sequelize.INTEGER,
        defaultValue: 100,
        allowNull: true,
      },
      reorder_level: {
        type: Sequelize.INTEGER,
        defaultValue: 10,
        allowNull: false,
      },
      reorder_quantity: {
        type: Sequelize.INTEGER,
        defaultValue: 20,
        allowNull: false,
      },
      weight: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true,
      },
      dimensions: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      warranty_months: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false,
      },
      warranty_type: {
        type: Sequelize.ENUM('STANDARD', 'EXTENDED', 'LIMITED', 'LIFETIME', 'NO_WARRANTY'),
        allowNull: false,
      },
      quality_grade: {
        type: Sequelize.ENUM('A_GRADE', 'B_GRADE', 'C_GRADE', 'OEM', 'AFTERMARKET'),
        allowNull: false,
      },
      terms: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      coverage: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      exclusions: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      },
      is_discontinued: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      discontinued_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      images: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      primary_image: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false,
      },
      inventory: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      supplier_products: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      purchase_order_items: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      stock_movements: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      job_sheet_products: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      stock_releases: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      sale_items: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      warranty_cards: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      product_returns: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      category: {
        type: Sequelize.UUID,
        allowNull: true,
      },
    });
    console.log('  ✓ Created table: products');

    // Supplier → suppliers
    await queryInterface.createTable('suppliers', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
      },
      supplier_code: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      company_name: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true,
      },
      phone: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      alternate_phone: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      fax: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      website: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      address: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      city: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      state: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      postal_code: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      country: {
        type: Sequelize.STRING,
        defaultValue: "Sri Lanka",
        allowNull: false,
      },
      tax_id: {
        type: Sequelize.UUID,
        allowNull: true,
        unique: true,
      },
      registration_number: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true,
      },
      payment_terms: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      credit_limit: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true,
      },
      credit_days: {
        type: Sequelize.INTEGER,
        defaultValue: 30,
        allowNull: true,
      },
      bank_name: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      account_number: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      account_name: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      swift_code: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      contact_person_name: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      contact_person_phone: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      contact_person_email: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      contact_person_designation: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      rating: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true,
      },
      supplier_type: {
        type: Sequelize.ENUM('LOCAL', 'INTERNATIONAL', 'MANUFACTURER', 'DISTRIBUTOR', 'WHOLESALER', 'RETAILER'),
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('ACTIVE', 'INACTIVE', 'BLACKLISTED', 'PENDING_APPROVAL'),
        allowNull: false,
      },
      documents: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      notes: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false,
      },
      supplier_products: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      purchase_orders: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      supplier_returns: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      supplier_payments: {
        type: Sequelize.STRING,
        allowNull: false,
      },
    });
    console.log('  ✓ Created table: suppliers');

    // SupplierProduct → supplier_products
    await queryInterface.createTable('supplier_products', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
      },
      supplier_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      product_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      supplier_s_k_u: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      supplier_price: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
      },
      moq: {
        type: Sequelize.INTEGER,
        defaultValue: 1,
        allowNull: false,
      },
      lead_time_days: {
        type: Sequelize.INTEGER,
        defaultValue: 7,
        allowNull: false,
      },
      is_primary: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      last_purchase_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      last_purchase_price: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false,
      },
      supplier: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      product: {
        type: Sequelize.UUID,
        allowNull: true,
      },
    });
    console.log('  ✓ Created table: supplier_products');

    // PurchaseOrder → purchase_orders
    await queryInterface.createTable('purchase_orders', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
      },
      po_number: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      supplier_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      order_date: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      expected_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      received_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('DRAFT', 'SUBMITTED', 'CONFIRMED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'COMPLETED', 'CANCELLED', 'ON_HOLD'),
        allowNull: false,
      },
      priority: {
        type: Sequelize.ENUM('LOW', 'NORMAL', 'MEDIUM', 'HIGH', 'URGENT'),
        allowNull: false,
      },
      payment_status: {
        type: Sequelize.ENUM('UNPAID', 'PARTIALLY_PAID', 'PAID', 'OVERPAID'),
        allowNull: false,
      },
      subtotal: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0,
        allowNull: false,
      },
      tax_amount: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0,
        allowNull: false,
      },
      shipping_cost: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0,
        allowNull: false,
      },
      discount_amount: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0,
        allowNull: false,
      },
      total_amount: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0,
        allowNull: false,
      },
      paid_amount: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0,
        allowNull: false,
      },
      balance_amount: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0,
        allowNull: false,
      },
      payment_terms: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      shipping_method: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      shipping_address: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      notes: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      internal_notes: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      attachments: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      approved_by: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      approved_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false,
      },
      items: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      receipts: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      payments: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      status_history: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      supplier: {
        type: Sequelize.UUID,
        allowNull: true,
      },
    });
    console.log('  ✓ Created table: purchase_orders');

    // PurchaseOrderItem → purchase_order_items
    await queryInterface.createTable('purchase_order_items', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
      },
      purchase_order_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      product_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      received_quantity: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false,
      },
      unit_price: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
      },
      tax_rate: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0,
        allowNull: false,
      },
      discount_percent: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0,
        allowNull: false,
      },
      total_price: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
      },
      notes: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false,
      },
      purchase_order: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      product: {
        type: Sequelize.UUID,
        allowNull: true,
      },
    });
    console.log('  ✓ Created table: purchase_order_items');

    // POStatusHistory → po_status_history
    await queryInterface.createTable('po_status_history', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
      },
      purchase_order_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      from_status: {
        type: Sequelize.ENUM('DRAFT', 'SUBMITTED', 'CONFIRMED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'COMPLETED', 'CANCELLED', 'ON_HOLD'),
        allowNull: true,
      },
      to_status: {
        type: Sequelize.ENUM('DRAFT', 'SUBMITTED', 'CONFIRMED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'COMPLETED', 'CANCELLED', 'ON_HOLD'),
        allowNull: false,
      },
      changed_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      changed_by: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      remarks: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      purchase_order: {
        type: Sequelize.UUID,
        allowNull: true,
      },
    });
    console.log('  ✓ Created table: po_status_history');

    // GoodsReceipt → goods_receipts
    await queryInterface.createTable('goods_receipts', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
      },
      receipt_number: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      purchase_order_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      destination_location_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      receipt_date: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      received_by: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      invoice_number: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      invoice_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      notes: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      attachments: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('PENDING_QC', 'QC_PASSED', 'QC_FAILED', 'PARTIALLY_ACCEPTED', 'COMPLETED'),
        allowNull: false,
      },
      quality_check_by: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      quality_check_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      quality_check_notes: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false,
      },
      items: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      purchase_order: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      destination_location: {
        type: Sequelize.UUID,
        allowNull: true,
      },
    });
    console.log('  ✓ Created table: goods_receipts');

    // GoodsReceiptItem → goods_receipt_items
    await queryInterface.createTable('goods_receipt_items', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
      },
      goods_receipt_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      product_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      ordered_quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      received_quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      accepted_quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      rejected_quantity: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false,
      },
      batch_number: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      expiry_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      quality_status: {
        type: Sequelize.ENUM('PENDING', 'ACCEPTED', 'REJECTED', 'DAMAGED', 'PARTIAL'),
        allowNull: false,
      },
      rejection_reason: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      notes: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false,
      },
      goods_receipt: {
        type: Sequelize.UUID,
        allowNull: true,
      },
    });
    console.log('  ✓ Created table: goods_receipt_items');

    // SupplierReturn → supplier_returns
    await queryInterface.createTable('supplier_returns', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
      },
      return_number: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      supplier_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      purchase_order_id: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      return_date: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      return_type: {
        type: Sequelize.ENUM('DAMAGED', 'DEFECTIVE', 'WRONG_ITEM', 'EXCESS_QUANTITY', 'WARRANTY_CLAIM', 'OTHER'),
        allowNull: false,
      },
      reason: {
        type: Sequelize.ENUM('DOA', 'MANUFACTURING_DEFECT', 'SHIPPING_DAMAGE', 'WRONG_SPECIFICATION', 'QUALITY_ISSUE', 'EXPIRED', 'PACKAGING_DAMAGED', 'INCOMPLETE', 'NOT_AS_DESCRIBED', 'WARRANTY_CLAIM', 'DEFECTIVE', 'WRONG_ITEM', 'CUSTOMER_CHANGED_MIND', 'SIZE_COLOR_ISSUE', 'DAMAGED_IN_SHIPPING', 'EXCESS_STOCK', 'DUPLICATE_ORDER', 'USER_DAMAGE', 'OTHER'),
        allowNull: false,
      },
      reason_description: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('PENDING', 'APPROVED', 'IN_TRANSIT', 'RECEIVED', 'INSPECTING', 'REFUND_PROCESSED', 'REPLACEMENT_SENT', 'REJECTED', 'COMPLETED', 'CANCELLED', 'PENDING_APPROVAL', 'PROCESSING'),
        allowNull: false,
      },
      total_amount: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0,
        allowNull: false,
      },
      refund_amount: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0,
        allowNull: false,
      },
      refund_method: {
        type: Sequelize.ENUM('CASH', 'BANK_TRANSFER', 'CREDIT_NOTE', 'REPLACEMENT', 'ACCOUNT_CREDIT'),
        allowNull: true,
      },
      refund_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      replacement_issued: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      approved_by: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      approved_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      notes: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      attachments: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false,
      },
      items: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      supplier: {
        type: Sequelize.UUID,
        allowNull: true,
      },
    });
    console.log('  ✓ Created table: supplier_returns');

    // SupplierReturnItem → supplier_return_items
    await queryInterface.createTable('supplier_return_items', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
      },
      supplier_return_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      product_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      unit_price: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
      },
      total_price: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
      },
      batch_number: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      serial_number: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      condition: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      images: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      notes: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false,
      },
      supplier_return: {
        type: Sequelize.UUID,
        allowNull: true,
      },
    });
    console.log('  ✓ Created table: supplier_return_items');

    // SupplierPayment → supplier_payments
    await queryInterface.createTable('supplier_payments', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
      },
      payment_number: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      supplier_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      purchase_order_id: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      amount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
      },
      payment_method: {
        type: Sequelize.ENUM('CASH', 'CARD', 'BANK_TRANSFER', 'MOBILE_PAYMENT', 'CHECK', 'OTHER'),
        allowNull: false,
      },
      payment_date: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      reference: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      bank_name: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      check_number: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      transaction_id: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      notes: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      attachments: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      paid_by: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false,
      },
      supplier: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      purchase_order: {
        type: Sequelize.UUID,
        allowNull: true,
      },
    });
    console.log('  ✓ Created table: supplier_payments');

    // ProductInventory → product_inventory
    await queryInterface.createTable('product_inventory', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
      },
      product_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      location_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      quantity: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false,
      },
      reserved_quantity: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false,
      },
      available_quantity: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false,
      },
      storage_location: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      zone: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      min_stock_level: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      max_stock_level: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      last_restocked: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      last_stock_check: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      next_stock_check: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      average_cost: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0,
        allowNull: false,
      },
      total_value: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0,
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false,
      },
      product: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      location: {
        type: Sequelize.UUID,
        allowNull: true,
      },
    });
    console.log('  ✓ Created table: product_inventory');

    // ProductStockMovement → product_stock_movements
    await queryInterface.createTable('product_stock_movements', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
      },
      product_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      location_id: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      movement_type: {
        type: Sequelize.ENUM('PURCHASE', 'SALES', 'TRANSFER_IN', 'TRANSFER_OUT', 'ADJUSTMENT_IN', 'ADJUSTMENT_OUT', 'RETURN_FROM_CUSTOMER', 'RETURN_TO_SUPPLIER', 'DAMAGED', 'EXPIRED', 'STOLEN', 'FOUND', 'USAGE', 'RESERVATION', 'RELEASE', 'WRITE_OFF'),
        allowNull: false,
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      quantity_before: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      quantity_after: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      reference_id: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      reference_type: {
        type: Sequelize.ENUM('PURCHASE_ORDER', 'JOB_SHEET', 'TRANSFER', 'RETURN', 'ADJUSTMENT', 'GOODS_RECEIPT', 'STOCK_RELEASE', 'SALE', 'SALE_REFUND'),
        allowNull: true,
      },
      reference_number: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      unit_cost: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true,
      },
      total_cost: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true,
      },
      batch_number: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      serial_number: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      location: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      performed_by: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      approved_by: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      notes: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      product: {
        type: Sequelize.UUID,
        allowNull: true,
      },
    });
    console.log('  ✓ Created table: product_stock_movements');

    // StockRelease → stock_releases
    await queryInterface.createTable('stock_releases', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
      },
      release_number: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      release_type: {
        type: Sequelize.ENUM('JOB_USAGE', 'BRANCH_TRANSFER', 'INTERNAL_USE', 'SAMPLE', 'PROMOTION', 'DISPOSAL', 'OTHER'),
        allowNull: false,
      },
      release_date: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      reference_id: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      reference_type: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      reference_number: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      from_location_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      to_location_id: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('PENDING', 'APPROVED', 'RELEASED', 'RECEIVED', 'COMPLETED', 'CANCELLED'),
        allowNull: false,
      },
      requested_by: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      approved_by: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      approved_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      released_by: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      released_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      notes: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false,
      },
      items: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      from_location: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      to_location: {
        type: Sequelize.UUID,
        allowNull: true,
      },
    });
    console.log('  ✓ Created table: stock_releases');

    // StockReleaseItem → stock_release_items
    await queryInterface.createTable('stock_release_items', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
      },
      stock_release_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      product_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      requested_quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      released_quantity: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false,
      },
      unit_cost: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
      },
      total_cost: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
      },
      batch_number: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      serial_number: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      location: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      notes: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false,
      },
      stock_release: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      product: {
        type: Sequelize.UUID,
        allowNull: true,
      },
    });
    console.log('  ✓ Created table: stock_release_items');

    // JobSheetProduct → job_sheet_products
    await queryInterface.createTable('job_sheet_products', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
      },
      job_sheet_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      product_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      unit_price: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
      },
      cost_price: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
      },
      total_price: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
      },
      warranty_months: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false,
      },
      serial_number: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      batch_number: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('PENDING', 'RESERVED', 'INSTALLED', 'RETURNED', 'DEFECTIVE'),
        allowNull: false,
      },
      installed_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      notes: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false,
      },
      job_sheet: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      product: {
        type: Sequelize.UUID,
        allowNull: true,
      },
    });
    console.log('  ✓ Created table: job_sheet_products');

    // Sale → sales
    await queryInterface.createTable('sales', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
      },
      sale_number: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      customer_id: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      customer_name: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      customer_phone: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      customer_email: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      location_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      sold_by_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      sale_type: {
        type: Sequelize.ENUM('DIRECT', 'ONLINE', 'PHONE', 'WHOLESALE'),
        allowNull: false,
      },
      sale_channel: {
        type: Sequelize.STRING,
        defaultValue: "POS",
        allowNull: true,
      },
      subtotal: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0,
        allowNull: false,
      },
      discount: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0,
        allowNull: false,
      },
      discount_type: {
        type: Sequelize.ENUM('PERCENTAGE', 'FIXED'),
        allowNull: true,
      },
      discount_reason: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      tax: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0,
        allowNull: false,
      },
      tax_rate: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0,
        allowNull: false,
      },
      total_amount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
      },
      paid_amount: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0,
        allowNull: false,
      },
      balance_amount: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0,
        allowNull: false,
      },
      payment_status: {
        type: Sequelize.ENUM('PENDING', 'PARTIAL', 'COMPLETED', 'REFUNDED'),
        allowNull: false,
      },
      payment_method: {
        type: Sequelize.ENUM('CASH', 'CARD', 'BANK_TRANSFER', 'MOBILE_PAYMENT', 'CHECK', 'OTHER'),
        allowNull: true,
      },
      payment_reference: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('DRAFT', 'COMPLETED', 'CANCELLED', 'REFUNDED', 'PARTIAL_REFUND'),
        allowNull: false,
      },
      notes: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      invoice_url: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false,
      },
      completed_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      cancelled_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      items: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      payments: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      refunds: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      warranty_cards: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      notifications: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      customer: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      location: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      sold_by: {
        type: Sequelize.UUID,
        allowNull: true,
      },
    });
    console.log('  ✓ Created table: sales');

    // SaleItem → sale_items
    await queryInterface.createTable('sale_items', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
      },
      sale_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      product_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      product_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      product_s_k_u: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      unit_price: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
      },
      cost_price: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
      },
      discount: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0,
        allowNull: false,
      },
      tax: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0,
        allowNull: false,
      },
      subtotal: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
      },
      warranty_months: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false,
      },
      warranty_expiry: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      warranty_card: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      sale: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      product: {
        type: Sequelize.UUID,
        allowNull: true,
      },
    });
    console.log('  ✓ Created table: sale_items');

    // SalePayment → sale_payments
    await queryInterface.createTable('sale_payments', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
      },
      payment_number: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      sale_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      amount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
      },
      payment_method: {
        type: Sequelize.ENUM('CASH', 'CARD', 'BANK_TRANSFER', 'MOBILE_PAYMENT', 'CHECK', 'OTHER'),
        allowNull: false,
      },
      payment_date: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      reference: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('PENDING', 'PARTIAL', 'COMPLETED', 'REFUNDED'),
        allowNull: false,
      },
      notes: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      received_by_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      sale: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      received_by: {
        type: Sequelize.UUID,
        allowNull: true,
      },
    });
    console.log('  ✓ Created table: sale_payments');

    // SaleRefund → sale_refunds
    await queryInterface.createTable('sale_refunds', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
      },
      refund_number: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      sale_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      amount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
      },
      reason: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      refund_method: {
        type: Sequelize.ENUM('CASH', 'CARD', 'BANK_TRANSFER', 'MOBILE_PAYMENT', 'CHECK', 'OTHER'),
        allowNull: false,
      },
      refund_date: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      processed_by_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      sale: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      processed_by: {
        type: Sequelize.UUID,
        allowNull: true,
      },
    });
    console.log('  ✓ Created table: sale_refunds');

    // WarrantyCard → warranty_cards
    await queryInterface.createTable('warranty_cards', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
      },
      warranty_number: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      sale_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      sale_item_id: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
      },
      product_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      product_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      product_s_k_u: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      product_code: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      serial_number: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      customer_id: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      customer_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      customer_phone: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      customer_email: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      location_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      warranty_type: {
        type: Sequelize.ENUM('STANDARD', 'EXTENDED', 'LIMITED', 'LIFETIME', 'NO_WARRANTY'),
        allowNull: false,
      },
      warranty_months: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      start_date: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      expiry_date: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      terms: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      coverage: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      exclusions: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('ACTIVE', 'EXPIRED', 'CLAIMED', 'VOIDED', 'TRANSFERRED'),
        allowNull: false,
      },
      activated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      voided_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      void_reason: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      is_transferred: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      transferred_to: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      transferred_phone: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      transferred_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      transfer_notes: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      notes: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      attachments: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false,
      },
      claims: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      sale: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      sale_item: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      product: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      customer: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      location: {
        type: Sequelize.UUID,
        allowNull: true,
      },
    });
    console.log('  ✓ Created table: warranty_cards');

    // WarrantyClaim → warranty_claims
    await queryInterface.createTable('warranty_claims', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
      },
      claim_number: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      warranty_card_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      claim_date: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      issue_description: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      issue_type: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'),
        allowNull: false,
      },
      priority: {
        type: Sequelize.ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT'),
        allowNull: false,
      },
      resolution_type: {
        type: Sequelize.ENUM('REPAIRED', 'REPLACED', 'REFUNDED', 'STORE_CREDIT', 'REJECTED', 'REFUND_PROCESSED', 'RESTOCKED_BRANCH', 'TRANSFERRED_WAREHOUSE', 'RETURNED_SUPPLIER', 'SCRAPPED', 'PENDING_DECISION'),
        allowNull: true,
      },
      resolution_notes: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      resolution_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      job_sheet_id: {
        type: Sequelize.UUID,
        allowNull: true,
        unique: true,
      },
      replacement_product_id: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      submitted_by_id: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      assigned_to_id: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      location_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      estimated_cost: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true,
      },
      actual_cost: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true,
      },
      customer_charge: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true,
      },
      images: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      documents: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      notes: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false,
      },
      warranty_card: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      job_sheet: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      replacement_product: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      submitted_by: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      assigned_to: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      location: {
        type: Sequelize.UUID,
        allowNull: true,
      },
    });
    console.log('  ✓ Created table: warranty_claims');

    // SMSLog → sms_logs
    await queryInterface.createTable('sms_logs', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
      },
      type: {
        type: Sequelize.ENUM('SALE_CONFIRMATION', 'PAYMENT_RECEIVED', 'JOBSHEET_CREATED', 'JOBSHEET_COMPLETED', 'WARRANTY_REMINDER', 'CUSTOM'),
        allowNull: false,
      },
      recipient: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      message: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('SUCCESS', 'FAILED', 'PENDING'),
        allowNull: false,
      },
      response: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      reference_id: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      reference_type: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      sent_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
    console.log('  ✓ Created table: sms_logs');

    // ProductReturn → product_returns
    await queryInterface.createTable('product_returns', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
      },
      return_number: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      location_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      source_type: {
        type: Sequelize.ENUM('SALE', 'WARRANTY_CLAIM', 'JOB_SHEET', 'STOCK_CHECK', 'DIRECT', 'GOODS_RECEIPT'),
        allowNull: false,
      },
      source_id: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      customer_id: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      customer_name: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      customer_phone: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      product_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      serial_number: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      return_reason: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      return_category: {
        type: Sequelize.ENUM('CUSTOMER_RETURN', 'WARRANTY_RETURN', 'DEFECTIVE', 'EXCESS_STOCK', 'QUALITY_FAILURE', 'DAMAGED', 'INTERNAL_TRANSFER'),
        allowNull: false,
      },
      condition: {
        type: Sequelize.ENUM('NEW_SEALED', 'NEW_OPEN_BOX', 'USED_EXCELLENT', 'USED_GOOD', 'USED_FAIR', 'DEFECTIVE', 'DAMAGED', 'PARTS_MISSING', 'DESTROYED'),
        allowNull: false,
      },
      condition_notes: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      product_value: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
      },
      refund_amount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('PENDING', 'APPROVED', 'IN_TRANSIT', 'RECEIVED', 'INSPECTING', 'REFUND_PROCESSED', 'REPLACEMENT_SENT', 'REJECTED', 'COMPLETED', 'CANCELLED', 'PENDING_APPROVAL', 'PROCESSING'),
        allowNull: false,
      },
      priority: {
        type: Sequelize.ENUM('LOW', 'NORMAL', 'MEDIUM', 'HIGH', 'URGENT'),
        allowNull: false,
      },
      inspected_by: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      inspected_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      inspection_notes: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      approved_by: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      approved_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      approval_notes: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      resolution_type: {
        type: Sequelize.ENUM('REPAIRED', 'REPLACED', 'REFUNDED', 'STORE_CREDIT', 'REJECTED', 'REFUND_PROCESSED', 'RESTOCKED_BRANCH', 'TRANSFERRED_WAREHOUSE', 'RETURNED_SUPPLIER', 'SCRAPPED', 'PENDING_DECISION'),
        allowNull: true,
      },
      resolution_details: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      resolution_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      sale_refund_id: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      supplier_return_id: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      stock_transfer_id: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      images: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      documents: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      notes: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      created_by_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false,
      },
      completed_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      notifications: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      location: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      customer: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      product: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: true,
      },
    });
    console.log('  ✓ Created table: product_returns');

    // ========================================
    // ADD FOREIGN KEY CONSTRAINTS
    // ========================================

    // Foreign keys for users
    await queryInterface.addConstraint('users', {
      fields: ['role'],
      type: 'foreign key',
      name: 'users_role_fkey',
      references: {
        table: 'roles',
        field: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    await queryInterface.addConstraint('users', {
      fields: ['location'],
      type: 'foreign key',
      name: 'users_location_fkey',
      references: {
        table: 'locations',
        field: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    console.log('  ✓ Added foreign keys for: users');

    // Foreign keys for staff
    await queryInterface.addConstraint('staff', {
      fields: ['user'],
      type: 'foreign key',
      name: 'staff_user_fkey',
      references: {
        table: 'users',
        field: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    console.log('  ✓ Added foreign keys for: staff');

    // Foreign keys for locations
    await queryInterface.addConstraint('locations', {
      fields: ['warehouse'],
      type: 'foreign key',
      name: 'locations_warehouse_fkey',
      references: {
        table: '_warehouse',
        field: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    await queryInterface.addConstraint('locations', {
      fields: ['branch'],
      type: 'foreign key',
      name: 'locations_branch_fkey',
      references: {
        table: 'branches',
        field: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    console.log('  ✓ Added foreign keys for: locations');

    // Foreign keys for warehouse_staff
    await queryInterface.addConstraint('warehouse_staff', {
      fields: ['warehouse'],
      type: 'foreign key',
      name: 'warehouse_staff_warehouse_fkey',
      references: {
        table: '_warehouse',
        field: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    console.log('  ✓ Added foreign keys for: warehouse_staff');

    // Foreign keys for branch_staff
    await queryInterface.addConstraint('branch_staff', {
      fields: ['branch'],
      type: 'foreign key',
      name: 'branch_staff_branch_fkey',
      references: {
        table: 'branches',
        field: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    console.log('  ✓ Added foreign keys for: branch_staff');

    // Foreign keys for inventory_zones
    await queryInterface.addConstraint('inventory_zones', {
      fields: ['warehouse'],
      type: 'foreign key',
      name: 'inventory_zones_warehouse_fkey',
      references: {
        table: '_warehouse',
        field: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    console.log('  ✓ Added foreign keys for: inventory_zones');

    // Foreign keys for _warehouse_inventory
    await queryInterface.addConstraint('_warehouse_inventory', {
      fields: ['warehouse'],
      type: 'foreign key',
      name: '_warehouse_inventory_warehouse_fkey',
      references: {
        table: '_warehouse',
        field: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    console.log('  ✓ Added foreign keys for: _warehouse_inventory');

    // Foreign keys for stock_transfers
    await queryInterface.addConstraint('stock_transfers', {
      fields: ['from_warehouse'],
      type: 'foreign key',
      name: 'stock_transfers_from_warehouse_fkey',
      references: {
        table: '_warehouse',
        field: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    await queryInterface.addConstraint('stock_transfers', {
      fields: ['to_warehouse'],
      type: 'foreign key',
      name: 'stock_transfers_to_warehouse_fkey',
      references: {
        table: '_warehouse',
        field: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    console.log('  ✓ Added foreign keys for: stock_transfers');

    // Foreign keys for stock_transfer_items
    await queryInterface.addConstraint('stock_transfer_items', {
      fields: ['stock_transfer'],
      type: 'foreign key',
      name: 'stock_transfer_items_stock_transfer_fkey',
      references: {
        table: 'stock_transfers',
        field: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    console.log('  ✓ Added foreign keys for: stock_transfer_items');

    // Foreign keys for branch_targets
    await queryInterface.addConstraint('branch_targets', {
      fields: ['branch'],
      type: 'foreign key',
      name: 'branch_targets_branch_fkey',
      references: {
        table: 'branches',
        field: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    console.log('  ✓ Added foreign keys for: branch_targets');

    // Foreign keys for customers
    await queryInterface.addConstraint('customers', {
      fields: ['location'],
      type: 'foreign key',
      name: 'customers_location_fkey',
      references: {
        table: 'locations',
        field: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    console.log('  ✓ Added foreign keys for: customers');

    // Foreign keys for devices
    await queryInterface.addConstraint('devices', {
      fields: ['customer'],
      type: 'foreign key',
      name: 'devices_customer_fkey',
      references: {
        table: 'customers',
        field: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    console.log('  ✓ Added foreign keys for: devices');

    // Foreign keys for job_sheets
    await queryInterface.addConstraint('job_sheets', {
      fields: ['customer'],
      type: 'foreign key',
      name: 'job_sheets_customer_fkey',
      references: {
        table: 'customers',
        field: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    await queryInterface.addConstraint('job_sheets', {
      fields: ['device'],
      type: 'foreign key',
      name: 'job_sheets_device_fkey',
      references: {
        table: 'devices',
        field: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    await queryInterface.addConstraint('job_sheets', {
      fields: ['location'],
      type: 'foreign key',
      name: 'job_sheets_location_fkey',
      references: {
        table: 'locations',
        field: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    await queryInterface.addConstraint('job_sheets', {
      fields: ['created_by'],
      type: 'foreign key',
      name: 'job_sheets_created_by_fkey',
      references: {
        table: 'users',
        field: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    await queryInterface.addConstraint('job_sheets', {
      fields: ['assigned_to'],
      type: 'foreign key',
      name: 'job_sheets_assigned_to_fkey',
      references: {
        table: 'users',
        field: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    console.log('  ✓ Added foreign keys for: job_sheets');

    // Foreign keys for repairs
    await queryInterface.addConstraint('repairs', {
      fields: ['job_sheet'],
      type: 'foreign key',
      name: 'repairs_job_sheet_fkey',
      references: {
        table: 'job_sheets',
        field: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    console.log('  ✓ Added foreign keys for: repairs');

    // Foreign keys for inventory
    await queryInterface.addConstraint('inventory', {
      fields: ['part'],
      type: 'foreign key',
      name: 'inventory_part_fkey',
      references: {
        table: 'parts',
        field: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    await queryInterface.addConstraint('inventory', {
      fields: ['location'],
      type: 'foreign key',
      name: 'inventory_location_fkey',
      references: {
        table: 'locations',
        field: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    console.log('  ✓ Added foreign keys for: inventory');

    // Foreign keys for job_sheet_parts
    await queryInterface.addConstraint('job_sheet_parts', {
      fields: ['job_sheet'],
      type: 'foreign key',
      name: 'job_sheet_parts_job_sheet_fkey',
      references: {
        table: 'job_sheets',
        field: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    await queryInterface.addConstraint('job_sheet_parts', {
      fields: ['part'],
      type: 'foreign key',
      name: 'job_sheet_parts_part_fkey',
      references: {
        table: 'parts',
        field: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    console.log('  ✓ Added foreign keys for: job_sheet_parts');

    // Foreign keys for stock_movements
    await queryInterface.addConstraint('stock_movements', {
      fields: ['part'],
      type: 'foreign key',
      name: 'stock_movements_part_fkey',
      references: {
        table: 'parts',
        field: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    console.log('  ✓ Added foreign keys for: stock_movements');

    // Foreign keys for payments
    await queryInterface.addConstraint('payments', {
      fields: ['job_sheet'],
      type: 'foreign key',
      name: 'payments_job_sheet_fkey',
      references: {
        table: 'job_sheets',
        field: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    await queryInterface.addConstraint('payments', {
      fields: ['customer'],
      type: 'foreign key',
      name: 'payments_customer_fkey',
      references: {
        table: 'customers',
        field: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    await queryInterface.addConstraint('payments', {
      fields: ['received_by'],
      type: 'foreign key',
      name: 'payments_received_by_fkey',
      references: {
        table: 'users',
        field: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    console.log('  ✓ Added foreign keys for: payments');

    // Foreign keys for job_status_history
    await queryInterface.addConstraint('job_status_history', {
      fields: ['job_sheet'],
      type: 'foreign key',
      name: 'job_status_history_job_sheet_fkey',
      references: {
        table: 'job_sheets',
        field: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    console.log('  ✓ Added foreign keys for: job_status_history');

    // Foreign keys for notifications
    await queryInterface.addConstraint('notifications', {
      fields: ['customer'],
      type: 'foreign key',
      name: 'notifications_customer_fkey',
      references: {
        table: 'customers',
        field: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    await queryInterface.addConstraint('notifications', {
      fields: ['job_sheet'],
      type: 'foreign key',
      name: 'notifications_job_sheet_fkey',
      references: {
        table: 'job_sheets',
        field: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    await queryInterface.addConstraint('notifications', {
      fields: ['sale'],
      type: 'foreign key',
      name: 'notifications_sale_fkey',
      references: {
        table: 'sales',
        field: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    await queryInterface.addConstraint('notifications', {
      fields: ['product_return'],
      type: 'foreign key',
      name: 'notifications_product_return_fkey',
      references: {
        table: 'product_returns',
        field: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    await queryInterface.addConstraint('notifications', {
      fields: ['recipient_user'],
      type: 'foreign key',
      name: 'notifications_recipient_user_fkey',
      references: {
        table: 'users',
        field: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    await queryInterface.addConstraint('notifications', {
      fields: ['parent_notification'],
      type: 'foreign key',
      name: 'notifications_parent_notification_fkey',
      references: {
        table: 'notifications',
        field: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    console.log('  ✓ Added foreign keys for: notifications');

    // Foreign keys for activity_logs
    await queryInterface.addConstraint('activity_logs', {
      fields: ['user'],
      type: 'foreign key',
      name: 'activity_logs_user_fkey',
      references: {
        table: 'users',
        field: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    console.log('  ✓ Added foreign keys for: activity_logs');

    // Foreign keys for product_categories
    await queryInterface.addConstraint('product_categories', {
      fields: ['parent'],
      type: 'foreign key',
      name: 'product_categories_parent_fkey',
      references: {
        table: 'product_categories',
        field: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    console.log('  ✓ Added foreign keys for: product_categories');

    // Foreign keys for products
    await queryInterface.addConstraint('products', {
      fields: ['category'],
      type: 'foreign key',
      name: 'products_category_fkey',
      references: {
        table: 'product_categories',
        field: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    console.log('  ✓ Added foreign keys for: products');

    // Foreign keys for supplier_products
    await queryInterface.addConstraint('supplier_products', {
      fields: ['supplier'],
      type: 'foreign key',
      name: 'supplier_products_supplier_fkey',
      references: {
        table: 'suppliers',
        field: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    await queryInterface.addConstraint('supplier_products', {
      fields: ['product'],
      type: 'foreign key',
      name: 'supplier_products_product_fkey',
      references: {
        table: 'products',
        field: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    console.log('  ✓ Added foreign keys for: supplier_products');

    // Foreign keys for purchase_orders
    await queryInterface.addConstraint('purchase_orders', {
      fields: ['supplier'],
      type: 'foreign key',
      name: 'purchase_orders_supplier_fkey',
      references: {
        table: 'suppliers',
        field: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    console.log('  ✓ Added foreign keys for: purchase_orders');

    // Foreign keys for purchase_order_items
    await queryInterface.addConstraint('purchase_order_items', {
      fields: ['purchase_order'],
      type: 'foreign key',
      name: 'purchase_order_items_purchase_order_fkey',
      references: {
        table: 'purchase_orders',
        field: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    await queryInterface.addConstraint('purchase_order_items', {
      fields: ['product'],
      type: 'foreign key',
      name: 'purchase_order_items_product_fkey',
      references: {
        table: 'products',
        field: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    console.log('  ✓ Added foreign keys for: purchase_order_items');

    // Foreign keys for po_status_history
    await queryInterface.addConstraint('po_status_history', {
      fields: ['purchase_order'],
      type: 'foreign key',
      name: 'po_status_history_purchase_order_fkey',
      references: {
        table: 'purchase_orders',
        field: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    console.log('  ✓ Added foreign keys for: po_status_history');

    // Foreign keys for goods_receipts
    await queryInterface.addConstraint('goods_receipts', {
      fields: ['purchase_order'],
      type: 'foreign key',
      name: 'goods_receipts_purchase_order_fkey',
      references: {
        table: 'purchase_orders',
        field: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    await queryInterface.addConstraint('goods_receipts', {
      fields: ['destination_location'],
      type: 'foreign key',
      name: 'goods_receipts_destination_location_fkey',
      references: {
        table: 'locations',
        field: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    console.log('  ✓ Added foreign keys for: goods_receipts');

    // Foreign keys for goods_receipt_items
    await queryInterface.addConstraint('goods_receipt_items', {
      fields: ['goods_receipt'],
      type: 'foreign key',
      name: 'goods_receipt_items_goods_receipt_fkey',
      references: {
        table: 'goods_receipts',
        field: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    console.log('  ✓ Added foreign keys for: goods_receipt_items');

    // Foreign keys for supplier_returns
    await queryInterface.addConstraint('supplier_returns', {
      fields: ['supplier'],
      type: 'foreign key',
      name: 'supplier_returns_supplier_fkey',
      references: {
        table: 'suppliers',
        field: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    console.log('  ✓ Added foreign keys for: supplier_returns');

    // Foreign keys for supplier_return_items
    await queryInterface.addConstraint('supplier_return_items', {
      fields: ['supplier_return'],
      type: 'foreign key',
      name: 'supplier_return_items_supplier_return_fkey',
      references: {
        table: 'supplier_returns',
        field: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    console.log('  ✓ Added foreign keys for: supplier_return_items');

    // Foreign keys for supplier_payments
    await queryInterface.addConstraint('supplier_payments', {
      fields: ['supplier'],
      type: 'foreign key',
      name: 'supplier_payments_supplier_fkey',
      references: {
        table: 'suppliers',
        field: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    await queryInterface.addConstraint('supplier_payments', {
      fields: ['purchase_order'],
      type: 'foreign key',
      name: 'supplier_payments_purchase_order_fkey',
      references: {
        table: 'purchase_orders',
        field: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    console.log('  ✓ Added foreign keys for: supplier_payments');

    // Foreign keys for product_inventory
    await queryInterface.addConstraint('product_inventory', {
      fields: ['product'],
      type: 'foreign key',
      name: 'product_inventory_product_fkey',
      references: {
        table: 'products',
        field: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    await queryInterface.addConstraint('product_inventory', {
      fields: ['location'],
      type: 'foreign key',
      name: 'product_inventory_location_fkey',
      references: {
        table: 'locations',
        field: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    console.log('  ✓ Added foreign keys for: product_inventory');

    // Foreign keys for product_stock_movements
    await queryInterface.addConstraint('product_stock_movements', {
      fields: ['product'],
      type: 'foreign key',
      name: 'product_stock_movements_product_fkey',
      references: {
        table: 'products',
        field: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    console.log('  ✓ Added foreign keys for: product_stock_movements');

    // Foreign keys for stock_releases
    await queryInterface.addConstraint('stock_releases', {
      fields: ['from_location'],
      type: 'foreign key',
      name: 'stock_releases_from_location_fkey',
      references: {
        table: 'locations',
        field: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    await queryInterface.addConstraint('stock_releases', {
      fields: ['to_location'],
      type: 'foreign key',
      name: 'stock_releases_to_location_fkey',
      references: {
        table: 'locations',
        field: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    console.log('  ✓ Added foreign keys for: stock_releases');

    // Foreign keys for stock_release_items
    await queryInterface.addConstraint('stock_release_items', {
      fields: ['stock_release'],
      type: 'foreign key',
      name: 'stock_release_items_stock_release_fkey',
      references: {
        table: 'stock_releases',
        field: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    await queryInterface.addConstraint('stock_release_items', {
      fields: ['product'],
      type: 'foreign key',
      name: 'stock_release_items_product_fkey',
      references: {
        table: 'products',
        field: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    console.log('  ✓ Added foreign keys for: stock_release_items');

    // Foreign keys for job_sheet_products
    await queryInterface.addConstraint('job_sheet_products', {
      fields: ['job_sheet'],
      type: 'foreign key',
      name: 'job_sheet_products_job_sheet_fkey',
      references: {
        table: 'job_sheets',
        field: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    await queryInterface.addConstraint('job_sheet_products', {
      fields: ['product'],
      type: 'foreign key',
      name: 'job_sheet_products_product_fkey',
      references: {
        table: 'products',
        field: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    console.log('  ✓ Added foreign keys for: job_sheet_products');

    // Foreign keys for sales
    await queryInterface.addConstraint('sales', {
      fields: ['customer'],
      type: 'foreign key',
      name: 'sales_customer_fkey',
      references: {
        table: 'customers',
        field: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    await queryInterface.addConstraint('sales', {
      fields: ['location'],
      type: 'foreign key',
      name: 'sales_location_fkey',
      references: {
        table: 'locations',
        field: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    await queryInterface.addConstraint('sales', {
      fields: ['sold_by'],
      type: 'foreign key',
      name: 'sales_sold_by_fkey',
      references: {
        table: 'users',
        field: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    console.log('  ✓ Added foreign keys for: sales');

    // Foreign keys for sale_items
    await queryInterface.addConstraint('sale_items', {
      fields: ['sale'],
      type: 'foreign key',
      name: 'sale_items_sale_fkey',
      references: {
        table: 'sales',
        field: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    await queryInterface.addConstraint('sale_items', {
      fields: ['product'],
      type: 'foreign key',
      name: 'sale_items_product_fkey',
      references: {
        table: 'products',
        field: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    console.log('  ✓ Added foreign keys for: sale_items');

    // Foreign keys for sale_payments
    await queryInterface.addConstraint('sale_payments', {
      fields: ['sale'],
      type: 'foreign key',
      name: 'sale_payments_sale_fkey',
      references: {
        table: 'sales',
        field: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    await queryInterface.addConstraint('sale_payments', {
      fields: ['received_by'],
      type: 'foreign key',
      name: 'sale_payments_received_by_fkey',
      references: {
        table: 'users',
        field: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    console.log('  ✓ Added foreign keys for: sale_payments');

    // Foreign keys for sale_refunds
    await queryInterface.addConstraint('sale_refunds', {
      fields: ['sale'],
      type: 'foreign key',
      name: 'sale_refunds_sale_fkey',
      references: {
        table: 'sales',
        field: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    await queryInterface.addConstraint('sale_refunds', {
      fields: ['processed_by'],
      type: 'foreign key',
      name: 'sale_refunds_processed_by_fkey',
      references: {
        table: 'users',
        field: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    console.log('  ✓ Added foreign keys for: sale_refunds');

    // Foreign keys for warranty_cards
    await queryInterface.addConstraint('warranty_cards', {
      fields: ['sale'],
      type: 'foreign key',
      name: 'warranty_cards_sale_fkey',
      references: {
        table: 'sales',
        field: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    await queryInterface.addConstraint('warranty_cards', {
      fields: ['sale_item'],
      type: 'foreign key',
      name: 'warranty_cards_sale_item_fkey',
      references: {
        table: 'sale_items',
        field: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    await queryInterface.addConstraint('warranty_cards', {
      fields: ['product'],
      type: 'foreign key',
      name: 'warranty_cards_product_fkey',
      references: {
        table: 'products',
        field: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    await queryInterface.addConstraint('warranty_cards', {
      fields: ['customer'],
      type: 'foreign key',
      name: 'warranty_cards_customer_fkey',
      references: {
        table: 'customers',
        field: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    await queryInterface.addConstraint('warranty_cards', {
      fields: ['location'],
      type: 'foreign key',
      name: 'warranty_cards_location_fkey',
      references: {
        table: 'locations',
        field: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    console.log('  ✓ Added foreign keys for: warranty_cards');

    // Foreign keys for warranty_claims
    await queryInterface.addConstraint('warranty_claims', {
      fields: ['warranty_card'],
      type: 'foreign key',
      name: 'warranty_claims_warranty_card_fkey',
      references: {
        table: 'warranty_cards',
        field: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    await queryInterface.addConstraint('warranty_claims', {
      fields: ['job_sheet'],
      type: 'foreign key',
      name: 'warranty_claims_job_sheet_fkey',
      references: {
        table: 'job_sheets',
        field: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    await queryInterface.addConstraint('warranty_claims', {
      fields: ['replacement_product'],
      type: 'foreign key',
      name: 'warranty_claims_replacement_product_fkey',
      references: {
        table: 'products',
        field: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    await queryInterface.addConstraint('warranty_claims', {
      fields: ['submitted_by'],
      type: 'foreign key',
      name: 'warranty_claims_submitted_by_fkey',
      references: {
        table: 'users',
        field: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    await queryInterface.addConstraint('warranty_claims', {
      fields: ['assigned_to'],
      type: 'foreign key',
      name: 'warranty_claims_assigned_to_fkey',
      references: {
        table: 'users',
        field: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    await queryInterface.addConstraint('warranty_claims', {
      fields: ['location'],
      type: 'foreign key',
      name: 'warranty_claims_location_fkey',
      references: {
        table: 'locations',
        field: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    console.log('  ✓ Added foreign keys for: warranty_claims');

    // Foreign keys for product_returns
    await queryInterface.addConstraint('product_returns', {
      fields: ['location'],
      type: 'foreign key',
      name: 'product_returns_location_fkey',
      references: {
        table: 'locations',
        field: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    await queryInterface.addConstraint('product_returns', {
      fields: ['customer'],
      type: 'foreign key',
      name: 'product_returns_customer_fkey',
      references: {
        table: 'customers',
        field: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    await queryInterface.addConstraint('product_returns', {
      fields: ['product'],
      type: 'foreign key',
      name: 'product_returns_product_fkey',
      references: {
        table: 'products',
        field: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    await queryInterface.addConstraint('product_returns', {
      fields: ['created_by'],
      type: 'foreign key',
      name: 'product_returns_created_by_fkey',
      references: {
        table: 'users',
        field: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    console.log('  ✓ Added foreign keys for: product_returns');

    console.log('\n✅ Initial schema created successfully!\n');
  },

  async down(queryInterface, Sequelize) {
    console.log('⚠️  Dropping all tables...\n');

    await queryInterface.dropTable('product_returns');
    await queryInterface.dropTable('sms_logs');
    await queryInterface.dropTable('warranty_claims');
    await queryInterface.dropTable('warranty_cards');
    await queryInterface.dropTable('sale_refunds');
    await queryInterface.dropTable('sale_payments');
    await queryInterface.dropTable('sale_items');
    await queryInterface.dropTable('sales');
    await queryInterface.dropTable('job_sheet_products');
    await queryInterface.dropTable('stock_release_items');
    await queryInterface.dropTable('stock_releases');
    await queryInterface.dropTable('product_stock_movements');
    await queryInterface.dropTable('product_inventory');
    await queryInterface.dropTable('supplier_payments');
    await queryInterface.dropTable('supplier_return_items');
    await queryInterface.dropTable('supplier_returns');
    await queryInterface.dropTable('goods_receipt_items');
    await queryInterface.dropTable('goods_receipts');
    await queryInterface.dropTable('po_status_history');
    await queryInterface.dropTable('purchase_order_items');
    await queryInterface.dropTable('purchase_orders');
    await queryInterface.dropTable('supplier_products');
    await queryInterface.dropTable('suppliers');
    await queryInterface.dropTable('products');
    await queryInterface.dropTable('product_categories');
    await queryInterface.dropTable('activity_logs');
    await queryInterface.dropTable('notification_settings');
    await queryInterface.dropTable('notifications');
    await queryInterface.dropTable('job_status_history');
    await queryInterface.dropTable('payments');
    await queryInterface.dropTable('stock_movements');
    await queryInterface.dropTable('job_sheet_parts');
    await queryInterface.dropTable('inventory');
    await queryInterface.dropTable('parts');
    await queryInterface.dropTable('repairs');
    await queryInterface.dropTable('job_sheets');
    await queryInterface.dropTable('devices');
    await queryInterface.dropTable('customers');
    await queryInterface.dropTable('permissions');
    await queryInterface.dropTable('roles');
    await queryInterface.dropTable('branch_targets');
    await queryInterface.dropTable('stock_transfer_items');
    await queryInterface.dropTable('stock_transfers');
    await queryInterface.dropTable('_warehouse_inventory');
    await queryInterface.dropTable('inventory_zones');
    await queryInterface.dropTable('branch_staff');
    await queryInterface.dropTable('warehouse_staff');
    await queryInterface.dropTable('branches');
    await queryInterface.dropTable('_warehouse');
    await queryInterface.dropTable('locations');
    await queryInterface.dropTable('staff');
    await queryInterface.dropTable('users');

    // Drop enums
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "LocationType";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "WarehouseType";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "BranchType";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "TransferType";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "TransferStatus";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "TargetType";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "CustomerType";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "DeviceType";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "JobStatus";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "Priority";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "RepairStatus";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "PartCategory";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "MovementType";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "PaymentMethod";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "RecipientType";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "EventType";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "NotificationPriority";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "NotificationType";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "NotificationMethod";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "NotificationStatus";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "WarrantyType";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "QualityGrade";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "SupplierType";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "SupplierStatus";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "POStatus";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "POPaymentStatus";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "GRNStatus";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "ItemQualityStatus";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "ReturnType";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "ReturnReason";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "ReturnStatus";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "RefundMethod";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "StockMovementType";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "ReferenceType";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "ReleaseType";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "ReleaseStatus";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "JobProductStatus";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "SaleType";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "SaleStatus";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "DiscountType";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "PaymentStatus";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "WarrantyStatus";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "ClaimStatus";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "ClaimPriority";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "ResolutionType";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "SMSTemplateType";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "SMSStatus";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "ReturnSourceType";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "ReturnCategory";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "ProductCondition";');

    console.log('\n✅ All tables dropped!\n');
  }
};
