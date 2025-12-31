'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    console.log('🔧 Fixing purchase order relations and removing invalid columns...');

    try {
      // Fix PURCHASE_ORDERS table
      console.log('\n📋 Processing PURCHASE_ORDERS table...');

      const invalidColumnsPO = ['items', 'receipts', 'payments', 'status_history', 'supplier'];

      for (const column of invalidColumnsPO) {
        const [columns] = await queryInterface.sequelize.query(`
          SELECT column_name
          FROM information_schema.columns
          WHERE table_name = 'purchase_orders'
          AND column_name = '${column}';
        `);

        if (columns.length > 0) {
          console.log(`  🔄 Removing invalid column '${column}'...`);
          await queryInterface.removeColumn('purchase_orders', column);
          console.log(`  ✓ Column '${column}' removed`);
        } else {
          console.log(`  ℹ️  Column '${column}' not found (already correct)`);
        }
      }

      // Fix PURCHASE_ORDER_ITEMS table
      console.log('\n📋 Processing PURCHASE_ORDER_ITEMS table...');

      const invalidColumnsPOI = ['purchase_order', 'product'];

      for (const column of invalidColumnsPOI) {
        const [columns] = await queryInterface.sequelize.query(`
          SELECT column_name
          FROM information_schema.columns
          WHERE table_name = 'purchase_order_items'
          AND column_name = '${column}';
        `);

        if (columns.length > 0) {
          console.log(`  🔄 Removing invalid column '${column}'...`);
          await queryInterface.removeColumn('purchase_order_items', column);
          console.log(`  ✓ Column '${column}' removed`);
        } else {
          console.log(`  ℹ️  Column '${column}' not found (already correct)`);
        }
      }

      // Verify final structures
      console.log('\n✅ Verifying PURCHASE_ORDERS structure...');
      const [poColumns] = await queryInterface.sequelize.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'purchase_orders'
        ORDER BY ordinal_position;
      `);

      console.log(`PURCHASE_ORDERS now has ${poColumns.length} columns:`);
      poColumns.forEach((col, idx) => {
        console.log(`  ${idx + 1}. ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
      });

      console.log('\n✅ Verifying PURCHASE_ORDER_ITEMS structure...');
      const [poiColumns] = await queryInterface.sequelize.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'purchase_order_items'
        ORDER BY ordinal_position;
      `);

      console.log(`PURCHASE_ORDER_ITEMS now has ${poiColumns.length} columns:`);
      poiColumns.forEach((col, idx) => {
        console.log(`  ${idx + 1}. ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
      });

    } catch (error) {
      console.error('❌ Error fixing purchase order relations:', error.message);
      throw error;
    }
  },

  async down (queryInterface, Sequelize) {
    console.log('🔄 Rolling back: Adding back invalid columns...');
    console.log('⚠️  WARNING: This adds back incorrect columns that were causing issues!');

    try {
      // Add back invalid columns to PURCHASE_ORDERS
      console.log('\n📋 Adding back invalid columns to PURCHASE_ORDERS...');

      await queryInterface.addColumn('purchase_orders', 'items', {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: '[]'
      });

      await queryInterface.addColumn('purchase_orders', 'receipts', {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: '[]'
      });

      await queryInterface.addColumn('purchase_orders', 'payments', {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: '[]'
      });

      await queryInterface.addColumn('purchase_orders', 'status_history', {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: '[]'
      });

      await queryInterface.addColumn('purchase_orders', 'supplier', {
        type: Sequelize.UUID,
        allowNull: true
      });

      // Add back invalid columns to PURCHASE_ORDER_ITEMS
      console.log('\n📋 Adding back invalid columns to PURCHASE_ORDER_ITEMS...');

      await queryInterface.addColumn('purchase_order_items', 'purchase_order', {
        type: Sequelize.UUID,
        allowNull: true
      });

      await queryInterface.addColumn('purchase_order_items', 'product', {
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
