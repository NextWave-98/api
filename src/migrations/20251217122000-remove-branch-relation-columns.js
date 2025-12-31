'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log('🔧 Removing incorrect relation column from branches table...');
    
    // Remove column that should be a relation, not an actual column
    await queryInterface.removeColumn('branches', 'branch_staff');
    console.log('  ✓ Removed column: branch_staff');
    
    console.log('✅ Incorrect relation column removed from branches!');
  },

  down: async (queryInterface, Sequelize) => {
    console.log('🔧 Adding back relation column to branches table...');
    
    await queryInterface.addColumn('branches', 'branch_staff', {
      type: Sequelize.STRING,
      allowNull: false,
    });
    
    console.log('✅ Relation column added back');
  }
};
