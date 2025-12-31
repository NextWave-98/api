'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log('🔧 Removing invalid relation columns from suppliers table...');
    
    try {
      // Check if supplier_products column exists
      const [columns] = await queryInterface.sequelize.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'suppliers' 
        AND column_name IN ('supplier_products', 'purchase_orders', 'supplier_returns', 'supplier_payments');
      `);

      console.log('Found invalid columns:', columns.map(c => c.column_name));

      // Remove supplier_products column if it exists
      if (columns.some(c => c.column_name === 'supplier_products')) {
        console.log('  🔄 Removing supplier_products column...');
        await queryInterface.removeColumn('suppliers', 'supplier_products');
        console.log('  ✓ supplier_products column removed');
      }

      // Remove purchase_orders column if it exists
      if (columns.some(c => c.column_name === 'purchase_orders')) {
        console.log('  🔄 Removing purchase_orders column...');
        await queryInterface.removeColumn('suppliers', 'purchase_orders');
        console.log('  ✓ purchase_orders column removed');
      }

      // Remove supplier_returns column if it exists
      if (columns.some(c => c.column_name === 'supplier_returns')) {
        console.log('  🔄 Removing supplier_returns column...');
        await queryInterface.removeColumn('suppliers', 'supplier_returns');
        console.log('  ✓ supplier_returns column removed');
      }

      // Remove supplier_payments column if it exists
      if (columns.some(c => c.column_name === 'supplier_payments')) {
        console.log('  🔄 Removing supplier_payments column...');
        await queryInterface.removeColumn('suppliers', 'supplier_payments');
        console.log('  ✓ supplier_payments column removed');
      }

      console.log('✅ Invalid columns removed successfully!');
    } catch (error) {
      console.error('❌ Error removing invalid columns:', error.message);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    console.log('⏪ This migration cannot be reverted as these columns should not exist.');
    console.log('⚠️  If you need to restore data, check your database backup.');
  }
};
