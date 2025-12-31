'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Add POS to the correct enum: enum_sales_sale_type
    await queryInterface.sequelize.query('ALTER TYPE "enum_sales_sale_type" ADD VALUE IF NOT EXISTS \'POS\'');
  },

  async down (queryInterface, Sequelize) {
    // Note: PostgreSQL doesn't support removing enum values easily
    // This would require recreating the enum without POS
    // For now, we'll leave it as is since removing enum values is complex
    console.log('Note: POS enum value cannot be easily removed from enum_sales_sale_type enum');
  }
};
