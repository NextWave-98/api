'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Add STOCK_TRANSFER to ReferenceType enum
    // Note: The Prisma-generated enum name is enum_product_stock_movements_reference_type
    await queryInterface.sequelize.query('ALTER TYPE "enum_product_stock_movements_reference_type" ADD VALUE IF NOT EXISTS \'STOCK_TRANSFER\'');
  },

  async down (queryInterface, Sequelize) {
    // Note: PostgreSQL doesn't support removing enum values, so we can't revert this
    console.log('Cannot remove enum value STOCK_TRANSFER from enum_product_stock_movements_reference_type');
  }
};
