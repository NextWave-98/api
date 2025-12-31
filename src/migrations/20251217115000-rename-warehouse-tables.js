'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log('🔧 Renaming incorrectly named tables...');
    
    // Rename _warehouse to warehouses
    await queryInterface.sequelize.query(`
      ALTER TABLE "_warehouse" RENAME TO "warehouses";
    `);
    console.log('✓ Renamed _warehouse to warehouses');

    // Rename _warehouse_inventory to warehouse_inventory
    await queryInterface.sequelize.query(`
      ALTER TABLE "_warehouse_inventory" RENAME TO "warehouse_inventory";
    `);
    console.log('✓ Renamed _warehouse_inventory to warehouse_inventory');
    
    console.log('✅ Tables renamed successfully!');
  },

  down: async (queryInterface, Sequelize) => {
    // Revert tables back to underscore prefix
    await queryInterface.sequelize.query(`
      ALTER TABLE "warehouses" RENAME TO "_warehouse";
    `);
    
    await queryInterface.sequelize.query(`
      ALTER TABLE "warehouse_inventory" RENAME TO "_warehouse_inventory";
    `);
  }
};
