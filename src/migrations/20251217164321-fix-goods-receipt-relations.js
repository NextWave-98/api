'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    console.log('🔧 Fixing goods receipt relations and removing invalid columns...');

    try {
      // Fix GOODS_RECEIPTS table
      console.log('\n📋 Processing GOODS_RECEIPTS table...');

      const invalidColumnsGR = ['items', 'purchase_order'];

      for (const column of invalidColumnsGR) {
        const [columns] = await queryInterface.sequelize.query(`
          SELECT column_name
          FROM information_schema.columns
          WHERE table_name = 'goods_receipts'
          AND column_name = '${column}';
        `);

        if (columns.length > 0) {
          console.log(`  🔄 Removing invalid column '${column}'...`);
          await queryInterface.removeColumn('goods_receipts', column);
          console.log(`  ✓ Column '${column}' removed`);
        } else {
          console.log(`  ℹ️  Column '${column}' not found (already correct)`);
        }
      }

      // Verify final structure
      console.log('\n✅ Verifying GOODS_RECEIPTS structure...');
      const [grColumns] = await queryInterface.sequelize.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'goods_receipts'
        ORDER BY ordinal_position;
      `);

      console.log(`GOODS_RECEIPTS now has ${grColumns.length} columns:`);
      grColumns.forEach((col, idx) => {
        console.log(`  ${idx + 1}. ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
      });

    } catch (error) {
      console.error('❌ Error fixing goods receipt relations:', error.message);
      throw error;
    }
  },

  async down (queryInterface, Sequelize) {
    console.log('🔄 Rolling back: Adding back invalid columns...');
    console.log('⚠️  WARNING: This adds back incorrect columns that were causing issues!');

    try {
      // Add back invalid columns to GOODS_RECEIPTS
      console.log('\n📋 Adding back invalid columns to GOODS_RECEIPTS...');

      await queryInterface.addColumn('goods_receipts', 'items', {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: '[]'
      });

      await queryInterface.addColumn('goods_receipts', 'purchase_order', {
        type: Sequelize.UUID,
        allowNull: true
      });

      console.log('⚠️  Invalid columns restored. Relations may be broken!');

    } catch (error) {
      console.error('❌ Error rolling back:', error.message);
      throw error;
    }
  }
};
