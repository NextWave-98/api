'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Remove the incorrect relation columns from users table if they exist
    const table = await queryInterface.describeTable('users');
    if (table.received_payments) {
      await queryInterface.removeColumn('users', 'received_payments');
    }
    if (table.activity_logs) {
      await queryInterface.removeColumn('users', 'activity_logs');
    }
    if (table.notifications) {
      await queryInterface.removeColumn('users', 'notifications');
    }
  },

  async down (queryInterface, Sequelize) {
    // Add back the columns if they don't exist
    const table = await queryInterface.describeTable('users');
    if (!table.received_payments) {
      await queryInterface.addColumn('users', 'received_payments', {
        type: Sequelize.STRING,
        allowNull: false,
      });
    }
    if (!table.activity_logs) {
      await queryInterface.addColumn('users', 'activity_logs', {
        type: Sequelize.STRING,
        allowNull: false,
      });
    }
    if (!table.notifications) {
      await queryInterface.addColumn('users', 'notifications', {
        type: Sequelize.STRING,
        allowNull: false,
      });
    }
  }
};
