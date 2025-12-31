'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    console.log('🔧 Fixing product_stock_movements table schema...');

    try {
      // First, add default value to created_at if it doesn't have one
      console.log('\n📋 Checking created_at column default value...');
      const [createdAtInfo] = await queryInterface.sequelize.query(`
        SELECT column_default
        FROM information_schema.columns
        WHERE table_name = 'product_stock_movements'
        AND column_name = 'created_at';
      `);

      if (!createdAtInfo[0].column_default) {
        console.log('  🔄 Adding default value to created_at...');
        await queryInterface.sequelize.query(`
          ALTER TABLE product_stock_movements
          ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;
        `);
        console.log('  ✓ Default value added to created_at');
      } else {
        console.log('  ℹ️  created_at already has default value');
      }

      // Add updated_at column if it doesn't exist
      const [updatedAtColumns] = await queryInterface.sequelize.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'product_stock_movements'
        AND column_name = 'updated_at';
      `);

      if (updatedAtColumns.length === 0) {
        console.log('  🔄 Adding updated_at column...');
        await queryInterface.addColumn('product_stock_movements', 'updated_at', {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        });
        console.log('  ✓ updated_at column added');
      } else {
        console.log('  ℹ️  updated_at column already exists');
      }

      // Add missing columns from Prisma schema
      const missingColumns = [
        { name: 'expiry_date', type: Sequelize.DATE, allowNull: true },
        { name: 'created_by', type: Sequelize.UUID, allowNull: true }
      ];

      for (const col of missingColumns) {
        const [existing] = await queryInterface.sequelize.query(`
          SELECT column_name
          FROM information_schema.columns
          WHERE table_name = 'product_stock_movements'
          AND column_name = '${col.name}';
        `);

        if (existing.length === 0) {
          console.log(`  🔄 Adding missing column ${col.name}...`);
          await queryInterface.addColumn('product_stock_movements', col.name, {
            type: col.type,
            allowNull: col.allowNull
          });
          console.log(`  ✓ Column ${col.name} added`);
        }
      }

      // Remove invalid columns
      const invalidColumns = ['location']; // This is the invalid relation column

      for (const column of invalidColumns) {
        const [columns] = await queryInterface.sequelize.query(`
          SELECT column_name
          FROM information_schema.columns
          WHERE table_name = 'product_stock_movements'
          AND column_name = '${column}';
        `);

        if (columns.length > 0) {
          console.log(`  🔄 Removing invalid column '${column}'...`);
          await queryInterface.removeColumn('product_stock_movements', column);
          console.log(`  ✓ Column '${column}' removed`);
        } else {
          console.log(`  ℹ️  Column '${column}' not found (already correct)`);
        }
      }

      // Verify final structure
      console.log('\n✅ Verifying PRODUCT_STOCK_MOVEMENTS structure...');
      const [finalColumns] = await queryInterface.sequelize.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'product_stock_movements'
        ORDER BY ordinal_position;
      `);

      console.log(`PRODUCT_STOCK_MOVEMENTS now has ${finalColumns.length} columns:`);
      finalColumns.forEach((col, idx) => {
        console.log(`  ${idx + 1}. ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'} ${col.column_default ? 'DEFAULT: ' + col.column_default : ''}`);
      });

    } catch (error) {
      console.error('❌ Error fixing product_stock_movements schema:', error.message);
      throw error;
    }
  },

  async down (queryInterface, Sequelize) {
    console.log('🔄 Rolling back: Reverting product_stock_movements schema changes...');
    console.log('⚠️  WARNING: This may break the table structure!');

    try {
      // Remove default from created_at
      console.log('\n📋 Removing default value from created_at...');
      await queryInterface.sequelize.query(`
        ALTER TABLE product_stock_movements
        ALTER COLUMN created_at DROP DEFAULT;
      `);

      // Remove updated_at column
      const [updatedAtExists] = await queryInterface.sequelize.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'product_stock_movements'
        AND column_name = 'updated_at';
      `);

      if (updatedAtExists.length > 0) {
        await queryInterface.removeColumn('product_stock_movements', 'updated_at');
      }

      // Remove added columns
      const addedColumns = ['expiry_date', 'created_by'];
      for (const col of addedColumns) {
        const [exists] = await queryInterface.sequelize.query(`
          SELECT column_name
          FROM information_schema.columns
          WHERE table_name = 'product_stock_movements'
          AND column_name = '${col}';
        `);

        if (exists.length > 0) {
          await queryInterface.removeColumn('product_stock_movements', col);
        }
      }

      // Add back invalid column
      await queryInterface.addColumn('product_stock_movements', 'location', {
        type: Sequelize.STRING,
        allowNull: true
      });

      console.log('⚠️  Schema changes reverted. Table may be in inconsistent state!');

    } catch (error) {
      console.error('❌ Error rolling back:', error.message);
      throw error;
    }
  }
};
