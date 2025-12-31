'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Remove incorrect items columns from purchase_orders and goods_receipts tables
    // These columns were added incorrectly - items should be separate tables
    
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Check if items column exists in purchase_orders table
      const purchaseOrdersColumns = await queryInterface.describeTable('purchase_orders');
      if (purchaseOrdersColumns.items) {
        await queryInterface.removeColumn('purchase_orders', 'items', { transaction });
        console.log('Removed items column from purchase_orders table');
      }
      
      // Check if items column exists in goods_receipts table
      const goodsReceiptsColumns = await queryInterface.describeTable('goods_receipts');
      if (goodsReceiptsColumns.items) {
        await queryInterface.removeColumn('goods_receipts', 'items', { transaction });
        console.log('Removed items column from goods_receipts table');
      }
      
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down (queryInterface, Sequelize) {
    // Re-add the items columns if needed for rollback
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Add items column back to purchase_orders table
      await queryInterface.addColumn('purchase_orders', 'items', {
        type: Sequelize.JSON,
        allowNull: true,
      }, { transaction });
      
      // Add items column back to goods_receipts table
      await queryInterface.addColumn('goods_receipts', 'items', {
        type: Sequelize.JSON,
        allowNull: true,
      }, { transaction });
      
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
