'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Add missing columns to existing tables

    // Example: Add created_by to sales table if missing
    const salesTable = await queryInterface.describeTable('sales');
    if (!salesTable.created_by) {
      await queryInterface.addColumn('sales', 'created_by', {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        }
      });
    }

    // Example: Add updated_at to sale_items if missing
    const saleItemsTable = await queryInterface.describeTable('sale_items');
    if (!saleItemsTable.updated_at) {
      await queryInterface.addColumn('sale_items', 'updated_at', {
        type: Sequelize.DATE,
        allowNull: true
      });
    }

    // Example: Add missing indexes
    await queryInterface.addIndex('sales', ['created_by']);
    await queryInterface.addIndex('sale_items', ['updated_at']);
  },

  async down (queryInterface, Sequelize) {
    // Remove added columns
    const salesTable = await queryInterface.describeTable('sales');
    if (salesTable.created_by) {
      await queryInterface.removeColumn('sales', 'created_by');
    }

    const saleItemsTable = await queryInterface.describeTable('sale_items');
    if (saleItemsTable.updated_at) {
      await queryInterface.removeColumn('sale_items', 'updated_at');
    }

    // Remove indexes
    await queryInterface.removeIndex('sales', ['created_by']);
    await queryInterface.removeIndex('sale_items', ['updated_at']);
  }
};
