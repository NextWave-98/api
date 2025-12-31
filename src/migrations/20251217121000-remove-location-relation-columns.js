'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log('🔧 Removing incorrect relation columns from locations table...');
    
    // Remove columns that should be relations, not actual columns
    const columnsToRemove = [
      'customers',
      'job_sheets',
      'inventory',
      'product_inventory',
      'sales',
      'goods_receipts',
      'warranty_cards',
      'warranty_claims',
      'product_returns',
      'warehouse',  // FK column should be warehouse_id
      'branch',     // FK column should be branch_id
    ];
    
    for (const column of columnsToRemove) {
      await queryInterface.removeColumn('locations', column);
      console.log(`  ✓ Removed column: ${column}`);
    }
    
    console.log('✅ All incorrect relation columns removed from locations!');
  },

  down: async (queryInterface, Sequelize) => {
    console.log('🔧 Adding back relation columns to locations table...');
    
    await queryInterface.addColumn('locations', 'customers', {
      type: Sequelize.STRING,
      allowNull: false,
    });
    
    await queryInterface.addColumn('locations', 'job_sheets', {
      type: Sequelize.STRING,
      allowNull: false,
    });
    
    await queryInterface.addColumn('locations', 'inventory', {
      type: Sequelize.STRING,
      allowNull: false,
    });
    
    await queryInterface.addColumn('locations', 'product_inventory', {
      type: Sequelize.STRING,
      allowNull: false,
    });
    
    await queryInterface.addColumn('locations', 'sales', {
      type: Sequelize.STRING,
      allowNull: false,
    });
    
    await queryInterface.addColumn('locations', 'goods_receipts', {
      type: Sequelize.STRING,
      allowNull: false,
    });
    
    await queryInterface.addColumn('locations', 'warranty_cards', {
      type: Sequelize.STRING,
      allowNull: false,
    });
    
    await queryInterface.addColumn('locations', 'warranty_claims', {
      type: Sequelize.STRING,
      allowNull: false,
    });
    
    await queryInterface.addColumn('locations', 'product_returns', {
      type: Sequelize.STRING,
      allowNull: false,
    });
    
    await queryInterface.addColumn('locations', 'warehouse', {
      type: Sequelize.UUID,
      allowNull: true,
    });
    
    await queryInterface.addColumn('locations', 'branch', {
      type: Sequelize.UUID,
      allowNull: true,
    });
    
    console.log('✅ Relation columns added back');
  }
};
