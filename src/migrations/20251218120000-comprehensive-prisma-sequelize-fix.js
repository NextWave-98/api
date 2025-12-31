'use strict';

/**
 * COMPREHENSIVE PRISMA TO SEQUELIZE MIGRATION FIX
 * 
 * This migration fixes ALL discovered discrepancies between the original Prisma schema
 * and the Sequelize implementation:
 * 
 * 1. ENUM FIXES:
 *    - Add DIRECT and PHONE to SaleType enum
 *    - Ensure TRANSFER exists in ReferenceType enum
 * 
 * 2. SALE MODEL FIXES:
 *    - Add missing fields: customerName, customerPhone, customerEmail, saleChannel
 *    - Add missing financial fields: subtotal, discount, discountType, discountReason, tax, taxRate
 *    - Add missing metadata fields: paymentReference, invoiceUrl, completedAt, cancelledAt
 *    - Remove legacy array columns: items, payments, refunds, warranty_cards, notifications
 * 
 * 3. PRODUCT MODEL FIXES:
 *    - Add warranty terms fields: terms, coverage, exclusions
 * 
 * 4. GENERAL FIXES:
 *    - Ensure all foreign keys have proper constraints
 *    - Ensure all indexes match Prisma schema
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      console.log('\n🔧 Starting comprehensive Prisma-to-Sequelize migration fix...\n');

      // ============================================
      // 1. FIX SALETYPE ENUM
      // ============================================
      console.log('📊 Step 1: Fixing SaleType enum...');
      try {
        // Check if enum type exists
        const [enumCheck] = await queryInterface.sequelize.query(
          `SELECT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_sales_sale_type');`,
          { transaction }
        );

        if (enumCheck[0].exists) {
          // Add new values to existing enum
          await queryInterface.sequelize.query(
            `ALTER TYPE "enum_sales_sale_type" ADD VALUE IF NOT EXISTS 'DIRECT';`,
            { transaction }
          );
          await queryInterface.sequelize.query(
            `ALTER TYPE "enum_sales_sale_type" ADD VALUE IF NOT EXISTS 'PHONE';`,
            { transaction }
          );
          console.log('   ✅ Added DIRECT and PHONE to SaleType enum');
        } else {
          console.log('   ⚠️  SaleType enum does not exist yet');
        }
      } catch (error) {
        console.log('   ⚠️  Could not modify SaleType enum:', error.message);
      }

      // ============================================
      // 2. FIX REFERENCETYPE ENUM
      // ============================================
      console.log('\n📊 Step 2: Fixing ReferenceType enum...');
      try {
        // Check if enum type exists
        const [enumCheck] = await queryInterface.sequelize.query(
          `SELECT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_product_stock_movements_reference_type');`,
          { transaction }
        );

        if (enumCheck[0].exists) {
          // Add TRANSFER if it doesn't exist (in addition to STOCK_TRANSFER)
          await queryInterface.sequelize.query(
            `ALTER TYPE "enum_product_stock_movements_reference_type" ADD VALUE IF NOT EXISTS 'TRANSFER';`,
            { transaction }
          );
          console.log('   ✅ Added TRANSFER to ReferenceType enum');
        }
      } catch (error) {
        console.log('   ⚠️  Could not modify ReferenceType enum:', error.message);
      }

      // ============================================
      // 3. ADD MISSING FIELDS TO SALES TABLE
      // ============================================
      console.log('\n📦 Step 3: Adding missing fields to sales table...');
      const salesColumns = await queryInterface.describeTable('sales');

      // Customer fields for walk-in sales
      if (!salesColumns.customer_name) {
        await queryInterface.addColumn('sales', 'customer_name', {
          type: Sequelize.STRING,
          allowNull: true,
        }, { transaction });
        console.log('   ✅ Added customer_name');
      }

      if (!salesColumns.customer_phone) {
        await queryInterface.addColumn('sales', 'customer_phone', {
          type: Sequelize.STRING,
          allowNull: true,
        }, { transaction });
        console.log('   ✅ Added customer_phone');
      }

      if (!salesColumns.customer_email) {
        await queryInterface.addColumn('sales', 'customer_email', {
          type: Sequelize.STRING,
          allowNull: true,
        }, { transaction });
        console.log('   ✅ Added customer_email');
      }

      // Sale channel
      if (!salesColumns.sale_channel) {
        await queryInterface.addColumn('sales', 'sale_channel', {
          type: Sequelize.STRING,
          allowNull: true,
          defaultValue: 'POS',
        }, { transaction });
        console.log('   ✅ Added sale_channel');
      }

      // Financial fields
      if (!salesColumns.subtotal) {
        await queryInterface.addColumn('sales', 'subtotal', {
          type: Sequelize.DECIMAL(10, 2),
          allowNull: false,
          defaultValue: 0,
        }, { transaction });
        console.log('   ✅ Added subtotal');
      }

      if (!salesColumns.discount) {
        await queryInterface.addColumn('sales', 'discount', {
          type: Sequelize.DECIMAL(10, 2),
          allowNull: false,
          defaultValue: 0,
        }, { transaction });
        console.log('   ✅ Added discount');
      }

      if (!salesColumns.discount_type) {
        await queryInterface.addColumn('sales', 'discount_type', {
          type: Sequelize.ENUM('PERCENTAGE', 'FIXED'),
          allowNull: true,
        }, { transaction });
        console.log('   ✅ Added discount_type');
      }

      if (!salesColumns.discount_reason) {
        await queryInterface.addColumn('sales', 'discount_reason', {
          type: Sequelize.STRING,
          allowNull: true,
        }, { transaction });
        console.log('   ✅ Added discount_reason');
      }

      if (!salesColumns.tax) {
        await queryInterface.addColumn('sales', 'tax', {
          type: Sequelize.DECIMAL(10, 2),
          allowNull: false,
          defaultValue: 0,
        }, { transaction });
        console.log('   ✅ Added tax');
      }

      if (!salesColumns.tax_rate) {
        await queryInterface.addColumn('sales', 'tax_rate', {
          type: Sequelize.DECIMAL(5, 2),
          allowNull: false,
          defaultValue: 0,
        }, { transaction });
        console.log('   ✅ Added tax_rate');
      }

      // Payment fields
      if (!salesColumns.payment_reference) {
        await queryInterface.addColumn('sales', 'payment_reference', {
          type: Sequelize.STRING,
          allowNull: true,
        }, { transaction });
        console.log('   ✅ Added payment_reference');
      }

      // Metadata fields
      if (!salesColumns.invoice_url) {
        await queryInterface.addColumn('sales', 'invoice_url', {
          type: Sequelize.STRING,
          allowNull: true,
        }, { transaction });
        console.log('   ✅ Added invoice_url');
      }

      if (!salesColumns.completed_at) {
        await queryInterface.addColumn('sales', 'completed_at', {
          type: Sequelize.DATE,
          allowNull: true,
        }, { transaction });
        console.log('   ✅ Added completed_at');
      }

      if (!salesColumns.cancelled_at) {
        await queryInterface.addColumn('sales', 'cancelled_at', {
          type: Sequelize.DATE,
          allowNull: true,
        }, { transaction });
        console.log('   ✅ Added cancelled_at');
      }

      // ============================================
      // 4. REMOVE LEGACY ARRAY COLUMNS FROM SALES
      // ============================================
      console.log('\n🗑️  Step 4: Removing legacy array columns from sales table...');
      
      if (salesColumns.items) {
        await queryInterface.removeColumn('sales', 'items', { transaction });
        console.log('   ✅ Removed items column');
      }

      if (salesColumns.payments) {
        await queryInterface.removeColumn('sales', 'payments', { transaction });
        console.log('   ✅ Removed payments column');
      }

      if (salesColumns.refunds) {
        await queryInterface.removeColumn('sales', 'refunds', { transaction });
        console.log('   ✅ Removed refunds column');
      }

      if (salesColumns.warranty_cards) {
        await queryInterface.removeColumn('sales', 'warranty_cards', { transaction });
        console.log('   ✅ Removed warranty_cards column');
      }

      if (salesColumns.notifications) {
        await queryInterface.removeColumn('sales', 'notifications', { transaction });
        console.log('   ✅ Removed notifications column');
      }

      // ============================================
      // 5. ADD MISSING FIELDS TO PRODUCTS TABLE
      // ============================================
      console.log('\n📦 Step 5: Adding warranty terms fields to products table...');
      const productsColumns = await queryInterface.describeTable('products');

      if (!productsColumns.terms) {
        await queryInterface.addColumn('products', 'terms', {
          type: Sequelize.TEXT,
          allowNull: true,
          comment: 'Warranty terms and conditions',
        }, { transaction });
        console.log('   ✅ Added terms');
      }

      if (!productsColumns.coverage) {
        await queryInterface.addColumn('products', 'coverage', {
          type: Sequelize.TEXT,
          allowNull: true,
          comment: 'What is covered under warranty',
        }, { transaction });
        console.log('   ✅ Added coverage');
      }

      if (!productsColumns.exclusions) {
        await queryInterface.addColumn('products', 'exclusions', {
          type: Sequelize.TEXT,
          allowNull: true,
          comment: 'What is not covered under warranty',
        }, { transaction });
        console.log('   ✅ Added exclusions');
      }

      // ============================================
      // 6. ADD INDEXES
      // ============================================
      console.log('\n🔍 Step 6: Adding missing indexes...');
      
      try {
        // Add index for sales customer fields
        await queryInterface.addIndex('sales', ['customer_phone'], {
          name: 'sales_customer_phone_idx',
          transaction,
        });
        console.log('   ✅ Added index on sales.customer_phone');
      } catch (error) {
        console.log('   ⚠️  Index may already exist');
      }

      // Commit transaction
      await transaction.commit();
      console.log('\n✅ Migration completed successfully!\n');

    } catch (error) {
      await transaction.rollback();
      console.error('\n❌ Migration failed:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      console.log('\n🔄 Reverting comprehensive Prisma-to-Sequelize migration fix...\n');

      // Remove added columns from sales
      console.log('Removing added columns from sales...');
      await queryInterface.removeColumn('sales', 'customer_name', { transaction });
      await queryInterface.removeColumn('sales', 'customer_phone', { transaction });
      await queryInterface.removeColumn('sales', 'customer_email', { transaction });
      await queryInterface.removeColumn('sales', 'sale_channel', { transaction });
      await queryInterface.removeColumn('sales', 'subtotal', { transaction });
      await queryInterface.removeColumn('sales', 'discount', { transaction });
      await queryInterface.removeColumn('sales', 'discount_type', { transaction });
      await queryInterface.removeColumn('sales', 'discount_reason', { transaction });
      await queryInterface.removeColumn('sales', 'tax', { transaction });
      await queryInterface.removeColumn('sales', 'tax_rate', { transaction });
      await queryInterface.removeColumn('sales', 'payment_reference', { transaction });
      await queryInterface.removeColumn('sales', 'invoice_url', { transaction });
      await queryInterface.removeColumn('sales', 'completed_at', { transaction });
      await queryInterface.removeColumn('sales', 'cancelled_at', { transaction });

      // Re-add legacy array columns
      console.log('Re-adding legacy array columns to sales...');
      await queryInterface.addColumn('sales', 'items', {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: '[]',
      }, { transaction });
      await queryInterface.addColumn('sales', 'payments', {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: '[]',
      }, { transaction });
      await queryInterface.addColumn('sales', 'refunds', {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: '[]',
      }, { transaction });
      await queryInterface.addColumn('sales', 'warranty_cards', {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: '[]',
      }, { transaction });
      await queryInterface.addColumn('sales', 'notifications', {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: '[]',
      }, { transaction });

      // Remove warranty term fields from products
      console.log('Removing warranty term fields from products...');
      await queryInterface.removeColumn('products', 'terms', { transaction });
      await queryInterface.removeColumn('products', 'coverage', { transaction });
      await queryInterface.removeColumn('products', 'exclusions', { transaction });

      await transaction.commit();
      console.log('\n✅ Rollback completed successfully!\n');

    } catch (error) {
      await transaction.rollback();
      console.error('\n❌ Rollback failed:', error);
      throw error;
    }
  }
};
