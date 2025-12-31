'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log('🔧 Adding missing columns to warehouses table...');
    
    // Add Facilities columns
    await queryInterface.addColumn('warehouses', 'has_cold_storage', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
    console.log('  ✓ Added has_cold_storage');

    await queryInterface.addColumn('warehouses', 'has_security_system', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    });
    console.log('  ✓ Added has_security_system');

    await queryInterface.addColumn('warehouses', 'has_loading_dock', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
    console.log('  ✓ Added has_loading_dock');

    await queryInterface.addColumn('warehouses', 'has_forklift', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
    console.log('  ✓ Added has_forklift');

    await queryInterface.addColumn('warehouses', 'parking_spaces', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
    console.log('  ✓ Added parking_spaces');

    // Add Warehouse Type column
    await queryInterface.addColumn('warehouses', 'warehouse_type', {
      type: Sequelize.ENUM('GENERAL', 'COLD', 'HAZMAT', 'ELECTRONICS', 'FOOD', 'PHARMACEUTICAL', 'OTHER'),
      allowNull: false,
      defaultValue: 'GENERAL',
    });
    console.log('  ✓ Added warehouse_type');

    // Add Operational columns
    await queryInterface.addColumn('warehouses', 'is_main_warehouse', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
    console.log('  ✓ Added is_main_warehouse');

    await queryInterface.addColumn('warehouses', 'operating_hours', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    console.log('  ✓ Added operating_hours');

    // Add Status columns
    await queryInterface.addColumn('warehouses', 'is_active', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    });
    console.log('  ✓ Added is_active');

    await queryInterface.addColumn('warehouses', 'opening_date', {
      type: Sequelize.DATE,
      allowNull: true,
    });
    console.log('  ✓ Added opening_date');

    await queryInterface.addColumn('warehouses', 'closure_date', {
      type: Sequelize.DATE,
      allowNull: true,
    });
    console.log('  ✓ Added closure_date');

    await queryInterface.addColumn('warehouses', 'closure_reason', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    console.log('  ✓ Added closure_reason');

    // Add Metadata columns
    await queryInterface.addColumn('warehouses', 'notes', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
    console.log('  ✓ Added notes');

    await queryInterface.addColumn('warehouses', 'images', {
      type: Sequelize.JSONB,
      allowNull: true,
    });
    console.log('  ✓ Added images');

    await queryInterface.addColumn('warehouses', 'documents', {
      type: Sequelize.JSONB,
      allowNull: true,
    });
    console.log('  ✓ Added documents');

    await queryInterface.addColumn('warehouses', 'created_at', {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    });
    console.log('  ✓ Added created_at');

    await queryInterface.addColumn('warehouses', 'updated_at', {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    });
    console.log('  ✓ Added updated_at');

    console.log('✅ All missing warehouse columns added successfully!');
  },

  down: async (queryInterface, Sequelize) => {
    console.log('🔧 Removing warehouse columns...');
    
    await queryInterface.removeColumn('warehouses', 'updated_at');
    await queryInterface.removeColumn('warehouses', 'created_at');
    await queryInterface.removeColumn('warehouses', 'documents');
    await queryInterface.removeColumn('warehouses', 'images');
    await queryInterface.removeColumn('warehouses', 'notes');
    await queryInterface.removeColumn('warehouses', 'closure_reason');
    await queryInterface.removeColumn('warehouses', 'closure_date');
    await queryInterface.removeColumn('warehouses', 'opening_date');
    await queryInterface.removeColumn('warehouses', 'is_active');
    await queryInterface.removeColumn('warehouses', 'operating_hours');
    await queryInterface.removeColumn('warehouses', 'is_main_warehouse');
    await queryInterface.removeColumn('warehouses', 'warehouse_type');
    await queryInterface.removeColumn('warehouses', 'parking_spaces');
    await queryInterface.removeColumn('warehouses', 'has_forklift');
    await queryInterface.removeColumn('warehouses', 'has_loading_dock');
    await queryInterface.removeColumn('warehouses', 'has_security_system');
    await queryInterface.removeColumn('warehouses', 'has_cold_storage');
    
    console.log('✅ Warehouse columns removed');
  }
};
