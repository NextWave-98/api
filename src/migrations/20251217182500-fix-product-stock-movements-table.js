'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log('🔧 Removing extra product column from product_stock_movements table...');

    try {
      // Check if the extra 'product' column exists
      const [columns] = await queryInterface.sequelize.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'product_stock_movements'
        AND column_name = 'product';
      `);

      if (columns.length > 0) {
        console.log('  🔄 Removing product column (duplicate relation column)...');
        await queryInterface.removeColumn('product_stock_movements', 'product');
        console.log('  ✓ product column removed');
      } else {
        console.log('  ℹ️  No extra product column found (already correct)');
      }

      // Verify final structure
      const [finalColumns] = await queryInterface.sequelize.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'product_stock_movements'
        ORDER BY ordinal_position;
      `);

      console.log(`\n✅ product_stock_movements table now has ${finalColumns.length} columns`);
      console.log('\nColumn list:');
      finalColumns.forEach((col, idx) => {
        console.log(`  ${idx + 1}. ${col.column_name} (${col.data_type})`);
      });

    } catch (error) {
      console.error('❌ Error removing extra column:', error.message);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    console.log('🔄 Rolling back: Adding back product column...');
    console.log('⚠️  WARNING: This adds back an incorrect column!');

    try {
      await queryInterface.addColumn('product_stock_movements', 'product', {
        type: Sequelize.UUID,
        allowNull: true,
      });
      console.log('  ✓ product column added back');
    } catch (error) {
      console.error('❌ Error during rollback:', error.message);
      throw error;
    }
  }
};
