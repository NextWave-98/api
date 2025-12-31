'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Remove invalid relation columns that were incorrectly added to locations table if they exist
    const table = await queryInterface.describeTable('locations');
    const columnsToRemove = ['customers', 'job_sheets', 'inventory', 'product_inventory', 'sales', 'goods_receipts', 'warranty_cards', 'warranty_claims', 'product_returns'];
    
    for (const column of columnsToRemove) {
      if (table[column]) {
        await queryInterface.removeColumn('locations', column);
      }
    }
  },

  async down (queryInterface, Sequelize) {
    // Restore the columns if rolling back (though these shouldn't exist in a proper schema)
    const table = await queryInterface.describeTable('locations');
    const columnsToAdd = [
      { name: 'customers', type: Sequelize.STRING },
      { name: 'job_sheets', type: Sequelize.STRING },
      { name: 'inventory', type: Sequelize.STRING },
      { name: 'product_inventory', type: Sequelize.STRING },
      { name: 'sales', type: Sequelize.STRING },
      { name: 'goods_receipts', type: Sequelize.STRING },
      { name: 'warranty_cards', type: Sequelize.STRING },
      { name: 'warranty_claims', type: Sequelize.STRING },
      { name: 'product_returns', type: Sequelize.STRING }
    ];
    
    for (const column of columnsToAdd) {
      if (!table[column.name]) {
        await queryInterface.addColumn('locations', column.name, {
          type: column.type,
          allowNull: false
        });
      }
    }
  }
};
