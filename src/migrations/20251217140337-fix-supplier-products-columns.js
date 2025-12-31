'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Rename supplier_s_k_u to supplier_sku
    await queryInterface.renameColumn('supplier_products', 'supplier_s_k_u', 'supplier_sku');

    // 2. Remove invalid relation columns (supplier, product)
    await queryInterface.removeColumn('supplier_products', 'supplier');
    await queryInterface.removeColumn('supplier_products', 'product');
  },

  async down(queryInterface, Sequelize) {
    // Revert changes
    await queryInterface.renameColumn('supplier_products', 'supplier_sku', 'supplier_s_k_u');
    
    // Add back the removed columns
    await queryInterface.addColumn('supplier_products', 'supplier', {
      type: Sequelize.UUID,
      allowNull: true,
    });
    await queryInterface.addColumn('supplier_products', 'product', {
      type: Sequelize.UUID,
      allowNull: true,
    });
  }
};
