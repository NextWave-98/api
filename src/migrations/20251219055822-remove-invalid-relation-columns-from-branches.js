'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Remove invalid relation columns that were incorrectly added to branches table if they exist
    const table = await queryInterface.describeTable('branches');
    if (table.branch_staff) {
      await queryInterface.removeColumn('branches', 'branch_staff');
    }
    if (table.branch_targets) {
      await queryInterface.removeColumn('branches', 'branch_targets');
    }
  },

  async down (queryInterface, Sequelize) {
    // Restore the columns if rolling back (though these shouldn't exist in a proper schema)
    const table = await queryInterface.describeTable('branches');
    if (!table.branch_staff) {
      await queryInterface.addColumn('branches', 'branch_staff', {
        type: Sequelize.STRING,
        allowNull: false
      });
    }
    if (!table.branch_targets) {
      await queryInterface.addColumn('branches', 'branch_targets', {
        type: Sequelize.STRING,
        allowNull: false
      });
    }
  }
};
