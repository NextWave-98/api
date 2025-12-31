'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    console.log('🔧 Removing remaining invalid destination_location column from goods_receipts...');

    try {
      // Check if the destination_location column exists
      const [columns] = await queryInterface.sequelize.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'goods_receipts'
        AND column_name = 'destination_location';
      `);

      if (columns.length > 0) {
        console.log('  🔄 Removing invalid column destination_location...');
        await queryInterface.removeColumn('goods_receipts', 'destination_location');
        console.log('  ✓ Column destination_location removed');
      } else {
        console.log('  ℹ️  Column destination_location not found (already correct)');
      }

      // Verify final structure
      console.log('\n✅ Verifying final GOODS_RECEIPTS structure...');
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
      console.error('❌ Error removing destination_location column:', error.message);
      throw error;
    }
  },

  async down (queryInterface, Sequelize) {
    console.log('🔄 Rolling back: Adding back destination_location column...');
    console.log('⚠️  WARNING: This adds back an incorrect column!');

    try {
      await queryInterface.addColumn('goods_receipts', 'destination_location', {
        type: Sequelize.UUID,
        allowNull: true
      });

      console.log('⚠️  Invalid column destination_location restored. Relations may be broken!');

    } catch (error) {
      console.error('❌ Error rolling back:', error.message);
      throw error;
    }
  }
};
