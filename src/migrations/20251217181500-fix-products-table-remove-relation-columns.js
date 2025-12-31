'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log('🔧 Removing invalid relation columns from products table...');

    try {
      // Check if invalid columns exist
      const [columns] = await queryInterface.sequelize.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'products'
        AND column_name IN (
          'inventory', 
          'supplier_products', 
          'purchase_order_items', 
          'stock_movements', 
          'job_sheet_products', 
          'stock_releases', 
          'sale_items', 
          'warranty_cards', 
          'product_returns',
          'category'
        );
      `);

      console.log('Found invalid columns:', columns.map(c => c.column_name));

      const invalidColumns = [
        'inventory',
        'supplier_products',
        'purchase_order_items',
        'stock_movements',
        'job_sheet_products',
        'stock_releases',
        'sale_items',
        'warranty_cards',
        'product_returns',
        'category' // Duplicate of category_id
      ];

      // Remove each invalid column if it exists
      for (const columnName of invalidColumns) {
        if (columns.some(c => c.column_name === columnName)) {
          console.log(`  🔄 Removing ${columnName} column...`);
          await queryInterface.removeColumn('products', columnName);
          console.log(`  ✓ ${columnName} column removed`);
        }
      }

      // Verify final column count
      const [finalColumns] = await queryInterface.sequelize.query(`
        SELECT COUNT(*) as column_count
        FROM information_schema.columns
        WHERE table_name = 'products';
      `);

      console.log(`✅ Products table now has ${finalColumns[0].column_count} columns (should be 35)`);

      // Display remaining columns for verification
      const [remainingColumns] = await queryInterface.sequelize.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'products'
        ORDER BY ordinal_position;
      `);

      console.log('Remaining columns:');
      remainingColumns.forEach(col => {
        console.log(`  - ${col.column_name} (${col.data_type}, nullable: ${col.is_nullable})`);
      });

      console.log('✅ Invalid relation columns removed successfully!');
    } catch (error) {
      console.error('❌ Error removing invalid columns:', error.message);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    console.log('🔄 Rolling back: Adding back invalid columns to products table...');
    console.log('⚠️  WARNING: This rollback adds back incorrect columns that should not exist!');

    try {
      // Note: These columns should NOT exist in a properly structured database
      // They are Prisma/Sequelize relations defined in OTHER tables via foreign keys

      const invalidColumns = [
        'inventory',
        'supplier_products',
        'purchase_order_items',
        'stock_movements',
        'job_sheet_products',
        'stock_releases',
        'sale_items',
        'warranty_cards',
        'product_returns',
        'category'
      ];

      for (const columnName of invalidColumns) {
        await queryInterface.addColumn('products', columnName, {
          type: Sequelize.STRING,
          allowNull: false,
        });
        console.log(`  ✓ ${columnName} column added back`);
      }

      console.log('✅ Rollback completed');
    } catch (error) {
      console.error('❌ Error during rollback:', error.message);
      throw error;
    }
  }
};
