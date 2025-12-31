'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    console.log('🔧 Fixing supplier payments relations and removing invalid columns...');

    try {
      // Fix SUPPLIER_PAYMENTS table
      console.log('\n📋 Processing SUPPLIER_PAYMENTS table...');

      const invalidColumnsSP = ['supplier', 'purchase_order'];

      for (const column of invalidColumnsSP) {
        const [columns] = await queryInterface.sequelize.query(`
          SELECT column_name
          FROM information_schema.columns
          WHERE table_name = 'supplier_payments'
          AND column_name = '${column}';
        `);

        if (columns.length > 0) {
          console.log(`  🔄 Removing invalid column '${column}'...`);
          await queryInterface.removeColumn('supplier_payments', column);
          console.log(`  ✓ Column '${column}' removed`);
        } else {
          console.log(`  ℹ️  Column '${column}' not found (already correct)`);
        }
      }

      // Verify final structure
      console.log('\n✅ Verifying SUPPLIER_PAYMENTS structure...');
      const [spColumns] = await queryInterface.sequelize.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'supplier_payments'
        ORDER BY ordinal_position;
      `);

      console.log(`SUPPLIER_PAYMENTS now has ${spColumns.length} columns:`);
      spColumns.forEach((col, idx) => {
        console.log(`  ${idx + 1}. ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
      });

    } catch (error) {
      console.error('❌ Error fixing supplier payments relations:', error.message);
      throw error;
    }
  },

  async down (queryInterface, Sequelize) {
    console.log('🔄 Rolling back: Adding back invalid columns...');
    console.log('⚠️  WARNING: This adds back incorrect columns that were causing issues!');

    try {
      // Add back invalid columns to SUPPLIER_PAYMENTS
      console.log('\n📋 Adding back invalid columns to SUPPLIER_PAYMENTS...');

      await queryInterface.addColumn('supplier_payments', 'supplier', {
        type: Sequelize.UUID,
        allowNull: true
      });

      await queryInterface.addColumn('supplier_payments', 'purchase_order', {
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
