'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log('🔧 Removing extra columns from products table to match Prisma schema...');

    try {
      // Check if extra columns exist
      const [columns] = await queryInterface.sequelize.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'products'
        AND column_name IN ('warranty_period', 'warranty_terms', 'image_url', 'cloudinary_id', 'tags');
      `);

      console.log('Found extra columns:', columns.map(c => c.column_name));

      const extraColumns = ['warranty_period', 'warranty_terms', 'image_url', 'cloudinary_id', 'tags'];

      // Remove each extra column if it exists
      for (const columnName of extraColumns) {
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

      console.log('Final column list:');
      remainingColumns.forEach((col, idx) => {
        console.log(`  ${idx + 1}. ${col.column_name} (${col.data_type})`);
      });

      console.log('✅ Extra columns removed successfully!');
    } catch (error) {
      console.error('❌ Error removing extra columns:', error.message);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    console.log('🔄 Rolling back: Adding back extra columns to products table...');
    console.log('⚠️  WARNING: This rollback adds back columns that are not in Prisma schema!');

    try {
      // Add back warranty_period
      await queryInterface.addColumn('products', 'warranty_period', {
        type: Sequelize.INTEGER,
        allowNull: true,
      });
      console.log('  ✓ warranty_period column added back');

      // Add back warranty_terms
      await queryInterface.addColumn('products', 'warranty_terms', {
        type: Sequelize.TEXT,
        allowNull: true,
      });
      console.log('  ✓ warranty_terms column added back');

      // Add back image_url
      await queryInterface.addColumn('products', 'image_url', {
        type: Sequelize.STRING,
        allowNull: true,
      });
      console.log('  ✓ image_url column added back');

      // Add back cloudinary_id
      await queryInterface.addColumn('products', 'cloudinary_id', {
        type: Sequelize.STRING,
        allowNull: true,
      });
      console.log('  ✓ cloudinary_id column added back');

      // Add back tags
      await queryInterface.addColumn('products', 'tags', {
        type: Sequelize.JSON,
        allowNull: true,
      });
      console.log('  ✓ tags column added back');

      console.log('✅ Rollback completed');
    } catch (error) {
      console.error('❌ Error during rollback:', error.message);
      throw error;
    }
  }
};
