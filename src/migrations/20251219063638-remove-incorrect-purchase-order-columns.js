'use strict';

/**
 * Remove incorrect columns from purchase_orders table
 * 
 * The previous migration added string columns for associations (items, receipts, payments, status_history)
 * which are not needed since Sequelize handles associations through foreign keys and separate tables.
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      console.log('🧹 Removing incorrect association columns from purchase_orders table...');

      // Check if columns exist before removing them
      const poColumns = await queryInterface.describeTable('purchase_orders');

      const columnsToRemove = ['items', 'receipts', 'payments', 'status_history', 'supplier'];

      for (const column of columnsToRemove) {
        if (poColumns[column]) {
          await queryInterface.removeColumn('purchase_orders', column, { transaction });
          console.log(`   ✅ Removed column: ${column}`);
        } else {
          console.log(`   ⚠️  Column ${column} not found, skipping...`);
        }
      }

      await transaction.commit();
      console.log('✅ Migration completed successfully');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Migration failed:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      console.log('🔄 Rolling back: Adding back association columns to purchase_orders table...');

      // Add back the columns that were removed
      await queryInterface.addColumn('purchase_orders', 'items', {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: '[]'
      }, { transaction });

      await queryInterface.addColumn('purchase_orders', 'receipts', {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: '[]'
      }, { transaction });

      await queryInterface.addColumn('purchase_orders', 'payments', {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: '[]'
      }, { transaction });

      await queryInterface.addColumn('purchase_orders', 'status_history', {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: '[]'
      }, { transaction });

      await queryInterface.addColumn('purchase_orders', 'supplier', {
        type: Sequelize.UUID,
        allowNull: true
      }, { transaction });

      await transaction.commit();
      console.log('✅ Rollback completed successfully');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Rollback failed:', error);
      throw error;
    }
  }
};
