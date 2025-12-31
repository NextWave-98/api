'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log('🔧 Removing invalid relation columns from product_categories table...');

    try {
      // Check if invalid columns exist
      const [columns] = await queryInterface.sequelize.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'product_categories'
        AND column_name IN ('products', 'parent');
      `);

      console.log('Found invalid columns:', columns.map(c => c.column_name));

      // Remove products column if it exists
      if (columns.some(c => c.column_name === 'products')) {
        console.log('  🔄 Removing products column...');
        await queryInterface.removeColumn('product_categories', 'products');
        console.log('  ✓ products column removed');
      }

      // Remove parent column if it exists
      if (columns.some(c => c.column_name === 'parent')) {
        console.log('  🔄 Removing parent column...');
        await queryInterface.removeColumn('product_categories', 'parent');
        console.log('  ✓ parent column removed');
      }

      console.log('✅ Invalid columns removed successfully!');
    } catch (error) {
      console.error('❌ Error removing invalid columns:', error.message);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    console.log('🔄 Rolling back: Adding back invalid columns to product_categories table...');

    try {
      // Add back products column
      await queryInterface.addColumn('product_categories', 'products', {
        type: Sequelize.STRING,
        allowNull: false,
      });
      console.log('  ✓ products column added back');

      // Add back parent column
      await queryInterface.addColumn('product_categories', 'parent', {
        type: Sequelize.UUID,
        allowNull: true,
      });
      console.log('  ✓ parent column added back');

      console.log('✅ Rollback completed!');
    } catch (error) {
      console.error('❌ Error during rollback:', error.message);
      throw error;
    }
  }
};