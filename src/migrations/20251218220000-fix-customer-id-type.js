'use strict';

/**
 * Remove legacy array columns from customers table and fix customer_id type
 * The sync migration added array columns for relations that should be removed
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      console.log('🔧 Removing legacy array columns from customers table...');

      const customerColumns = await queryInterface.describeTable('customers');

      // Remove legacy array columns that were added by sync migration
      const legacyColumns = ['devices', 'job_sheets', 'payments', 'notifications', 'sales', 'warranty_cards', 'product_returns'];

      for (const column of legacyColumns) {
        if (customerColumns[column]) {
          console.log(`  ➖ Removing customers.${column}`);
          await queryInterface.removeColumn('customers', column, { transaction });
        }
      }

      // Fix customer_id type from UUID to VARCHAR if needed
      if (customerColumns.customer_id && customerColumns.customer_id.type === 'UUID') {
        console.log('  🔄 Changing customer_id from UUID to VARCHAR');
        await queryInterface.changeColumn(
          'customers',
          'customer_id',
          {
            type: Sequelize.STRING,
            allowNull: false,
            unique: true,
          },
          { transaction }
        );
      }

      console.log('✅ Legacy columns removed and customer_id type fixed');
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error fixing customers table:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      console.log('🔄 Reverting customers table fixes...');

      // Re-add legacy array columns
      const legacyColumns = ['devices', 'job_sheets', 'payments', 'notifications', 'sales', 'warranty_cards', 'product_returns'];

      for (const column of legacyColumns) {
        console.log(`  ➕ Re-adding customers.${column}`);
        await queryInterface.addColumn('customers', column, {
          type: Sequelize.STRING,
          allowNull: false,
        }, { transaction });
      }

      // Revert customer_id back to UUID if it was changed
      console.log('  🔄 Reverting customer_id back to UUID');
      await queryInterface.changeColumn(
        'customers',
        'customer_id',
        {
          type: Sequelize.UUID,
          allowNull: false,
          unique: true,
        },
        { transaction }
      );

      console.log('✅ Reverted customers table changes');
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error reverting customers table:', error);
      throw error;
    }
  }
};