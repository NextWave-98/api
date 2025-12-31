'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Remove the incorrect 'roles' column from permissions table if it exists
    const table = await queryInterface.describeTable('permissions');
    if (table.roles) {
      await queryInterface.removeColumn('permissions', 'roles');
    }
  },

  async down (queryInterface, Sequelize) {
    // Add back the roles column if it doesn't exist
    const table = await queryInterface.describeTable('permissions');
    if (!table.roles) {
      await queryInterface.addColumn('permissions', 'roles', {
        type: Sequelize.STRING,
        allowNull: false,
      });
    }
  }
};
