'use strict';

/**
 * Comprehensive migration to fix all column mismatches between Sequelize models and PostgreSQL database
 * 
 * Issues fixed:
 * 1. product_inventory - Add missing reorder_point column
 * 2. supplier_payments - Add missing reference_number column  
 * 3. sale_payments - Add missing reference_number column
 * 4. warranty_cards - Rename product_s_k_u to product_sku for consistency
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      console.log('Starting comprehensive column mismatch fix...');

      // 1. Add reorder_point to product_inventory
      console.log('1. Adding reorder_point to product_inventory...');
      const productInventoryColumns = await queryInterface.describeTable('product_inventory');
      if (!productInventoryColumns.reorder_point) {
        await queryInterface.addColumn(
          'product_inventory',
          'reorder_point',
          {
            type: Sequelize.INTEGER,
            allowNull: true,
            comment: 'Reorder point threshold for automatic purchase order suggestions'
          },
          { transaction }
        );
        console.log('   ✓ Added reorder_point to product_inventory');
      } else {
        console.log('   ⊳ reorder_point already exists in product_inventory');
      }

      // 2. Add reference_number to supplier_payments
      console.log('2. Adding reference_number to supplier_payments...');
      const supplierPaymentColumns = await queryInterface.describeTable('supplier_payments');
      if (!supplierPaymentColumns.reference_number) {
        await queryInterface.addColumn(
          'supplier_payments',
          'reference_number',
          {
            type: Sequelize.STRING,
            allowNull: true,
            comment: 'External reference number for the payment (invoice number, receipt number, etc.)'
          },
          { transaction }
        );
        console.log('   ✓ Added reference_number to supplier_payments');
      } else {
        console.log('   ⊳ reference_number already exists in supplier_payments');
      }

      // 3. Add reference_number to sale_payments
      console.log('3. Adding reference_number to sale_payments...');
      const salePaymentColumns = await queryInterface.describeTable('sale_payments');
      if (!salePaymentColumns.reference_number) {
        await queryInterface.addColumn(
          'sale_payments',
          'reference_number',
          {
            type: Sequelize.STRING,
            allowNull: true,
            comment: 'External reference number for the payment (transaction ID, receipt number, etc.)'
          },
          { transaction }
        );
        console.log('   ✓ Added reference_number to sale_payments');
      } else {
        console.log('   ⊳ reference_number already exists in sale_payments');
      }

      // 4. Rename product_s_k_u to product_sku in warranty_cards
      console.log('4. Renaming product_s_k_u to product_sku in warranty_cards...');
      const warrantyCardColumns = await queryInterface.describeTable('warranty_cards');
      if (warrantyCardColumns.product_s_k_u && !warrantyCardColumns.product_sku) {
        await queryInterface.renameColumn(
          'warranty_cards',
          'product_s_k_u',
          'product_sku',
          { transaction }
        );
        console.log('   ✓ Renamed product_s_k_u to product_sku in warranty_cards');
      } else if (warrantyCardColumns.product_sku) {
        console.log('   ⊳ product_sku already exists in warranty_cards');
      } else {
        console.log('   ⚠ product_s_k_u does not exist, creating product_sku instead');
        await queryInterface.addColumn(
          'warranty_cards',
          'product_sku',
          {
            type: Sequelize.STRING,
            allowNull: true,
            comment: 'Product SKU/Code'
          },
          { transaction }
        );
      }

      // 5. Rename product_s_k_u to product_sku in sale_items (also has same issue)
      console.log('5. Renaming product_s_k_u to product_sku in sale_items...');
      const saleItemColumns = await queryInterface.describeTable('sale_items');
      if (saleItemColumns.product_s_k_u && !saleItemColumns.product_sku) {
        await queryInterface.renameColumn(
          'sale_items',
          'product_s_k_u',
          'product_sku',
          { transaction }
        );
        console.log('   ✓ Renamed product_s_k_u to product_sku in sale_items');
      } else if (saleItemColumns.product_sku) {
        console.log('   ⊳ product_sku already exists in sale_items');
      } else {
        console.log('   ⚠ product_s_k_u does not exist, creating product_sku instead');
        await queryInterface.addColumn(
          'sale_items',
          'product_sku',
          {
            type: Sequelize.STRING,
            allowNull: true,
            comment: 'Product SKU/Code'
          },
          { transaction }
        );
      }

      // 6. Rename supplier_s_k_u to supplier_sku in supplier_products (consistency fix)
      console.log('6. Renaming supplier_s_k_u to supplier_sku in supplier_products...');
      const supplierProductColumns = await queryInterface.describeTable('supplier_products');
      if (supplierProductColumns.supplier_s_k_u && !supplierProductColumns.supplier_sku) {
        await queryInterface.renameColumn(
          'supplier_products',
          'supplier_s_k_u',
          'supplier_sku',
          { transaction }
        );
        console.log('   ✓ Renamed supplier_s_k_u to supplier_sku in supplier_products');
      } else if (supplierProductColumns.supplier_sku) {
        console.log('   ⊳ supplier_sku already exists in supplier_products');
      }

      await transaction.commit();
      console.log('\n✓ All column mismatches fixed successfully!');
    } catch (error) {
      await transaction.rollback();
      console.error('Error fixing column mismatches:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      console.log('Reverting comprehensive column mismatch fix...');

      // Revert in reverse order
      const supplierProductColumns = await queryInterface.describeTable('supplier_products');
      if (supplierProductColumns.supplier_sku) {
        await queryInterface.renameColumn('supplier_products', 'supplier_sku', 'supplier_s_k_u', { transaction });
      }

      const saleItemColumns = await queryInterface.describeTable('sale_items');
      if (saleItemColumns.product_sku) {
        await queryInterface.renameColumn('sale_items', 'product_sku', 'product_s_k_u', { transaction });
      }

      const warrantyCardColumns = await queryInterface.describeTable('warranty_cards');
      if (warrantyCardColumns.product_sku) {
        await queryInterface.renameColumn('warranty_cards', 'product_sku', 'product_s_k_u', { transaction });
      }

      const salePaymentColumns = await queryInterface.describeTable('sale_payments');
      if (salePaymentColumns.reference_number) {
        await queryInterface.removeColumn('sale_payments', 'reference_number', { transaction });
      }

      const supplierPaymentColumns = await queryInterface.describeTable('supplier_payments');
      if (supplierPaymentColumns.reference_number) {
        await queryInterface.removeColumn('supplier_payments', 'reference_number', { transaction });
      }

      const productInventoryColumns = await queryInterface.describeTable('product_inventory');
      if (productInventoryColumns.reorder_point) {
        await queryInterface.removeColumn('product_inventory', 'reorder_point', { transaction });
      }

      await transaction.commit();
      console.log('✓ Migration reverted successfully');
    } catch (error) {
      await transaction.rollback();
      console.error('Error reverting migration:', error);
      throw error;
    }
  }
};
