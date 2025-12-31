'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Remove the incorrect relation columns from roles table if they exist
    const table = await queryInterface.describeTable('roles');
    if (table.users) {
      await queryInterface.removeColumn('roles', 'users');
    }
    if (table.permissions) {
      await queryInterface.removeColumn('roles', 'permissions');
    }
  },

  async down (queryInterface, Sequelize) {
    // Add back the columns if they don't exist
    const table = await queryInterface.describeTable('roles');
    if (!table.users) {
      await queryInterface.addColumn('roles', 'users', {
        type: Sequelize.STRING,
        allowNull: false,
      });
    }
    if (!table.permissions) {
      await queryInterface.addColumn('roles', 'permissions', {
        type: Sequelize.STRING,
        allowNull: false,
      });
    }
  }
};
