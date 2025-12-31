'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    console.log('🔧 Removing incorrect relation column from branches table...');
    
    // Remove column that should be a relation, not an actual column
    await queryInterface.removeColumn('branches', 'branch_targets');
    console.log('  ✓ Removed column: branch_targets');
    
    console.log('✅ Incorrect relation column removed from branches!');
  },

  async down(queryInterface, Sequelize) {
    // Add it back if needed to rollback
    await queryInterface.addColumn('branches', 'branch_targets', {
      type: Sequelize.STRING,
      allowNull: false
    });
  }
};
