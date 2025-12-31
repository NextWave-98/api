'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add ADDON_REQUEST notification types to the enum
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_notifications_type" ADD VALUE IF NOT EXISTS 'ADDON_REQUEST_CREATED';
    `);
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_notifications_type" ADD VALUE IF NOT EXISTS 'ADDON_REQUEST_APPROVED';
    `);
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_notifications_type" ADD VALUE IF NOT EXISTS 'ADDON_REQUEST_REJECTED';
    `);
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_notifications_type" ADD VALUE IF NOT EXISTS 'ADDON_REQUEST_COMPLETED';
    `);
    
    console.log('✅ Added ADDON_REQUEST notification types to enum');
  },

  async down(queryInterface, Sequelize) {
    // Note: PostgreSQL doesn't support removing enum values directly
    // This would require recreating the enum type
    console.log('⚠️ Cannot remove enum values in PostgreSQL without recreating the type');
  }
};
