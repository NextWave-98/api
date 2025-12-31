'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    console.log('🔧 Adding created_by column to supplier_payments table...');

    try {
      // Check if created_by column already exists
      const [columns] = await queryInterface.sequelize.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'supplier_payments'
        AND column_name = 'created_by';
      `);

      if (columns.length === 0) {
        console.log('  🔄 Adding created_by column...');
        await queryInterface.addColumn('supplier_payments', 'created_by', {
          type: Sequelize.UUID,
          allowNull: false,
          defaultValue: Sequelize.UUIDV4,
        });
        console.log('  ✓ created_by column added');
      } else {
        console.log('  ℹ️  created_by column already exists');
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
      console.error('❌ Error adding created_by column:', error.message);
      throw error;
    }
  },

  async down (queryInterface, Sequelize) {
    console.log('🔄 Rolling back: Removing created_by column...');

    try {
      await queryInterface.removeColumn('supplier_payments', 'created_by');
      console.log('⚠️  created_by column removed');

    } catch (error) {
      console.error('❌ Error rolling back:', error.message);
      throw error;
    }
  }
};
