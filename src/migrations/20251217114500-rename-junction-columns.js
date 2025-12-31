'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log('🔧 Renaming junction table columns from uppercase to lowercase...');
    
    // Rename columns A and B to lowercase a and b for better Sequelize compatibility
    await queryInterface.sequelize.query(`
      ALTER TABLE "_PermissionToRole" RENAME COLUMN "A" TO "a";
    `);
    console.log('✓ Renamed column A to a');

    await queryInterface.sequelize.query(`
      ALTER TABLE "_PermissionToRole" RENAME COLUMN "B" TO "b";
    `);
    console.log('✓ Renamed column B to b');
    
    console.log('✅ Junction table columns renamed successfully!');
  },

  down: async (queryInterface, Sequelize) => {
    // Revert columns back to uppercase
    await queryInterface.sequelize.query(`
      ALTER TABLE "_PermissionToRole" RENAME COLUMN "a" TO "A";
    `);
    
    await queryInterface.sequelize.query(`
      ALTER TABLE "_PermissionToRole" RENAME COLUMN "b" TO "B";
    `);
  }
};
