'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Remove extra columns from devices table that don't exist in Prisma schema
    await queryInterface.removeColumn('devices', 'job_sheets');
    await queryInterface.removeColumn('devices', 'customer');
  },

  async down (queryInterface, Sequelize) {
    // Add back the columns if needed to revert
    await queryInterface.addColumn('devices', 'job_sheets', {
      type: Sequelize.STRING,
      allowNull: false,
    });
    await queryInterface.addColumn('devices', 'customer', {
      type: Sequelize.UUID,
      allowNull: true,
    });
  }
};
