'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    console.log('🔧 Adding warehouse_id and branch_id columns to locations table...');

    await queryInterface.addColumn('locations', 'warehouse_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'warehouses',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
    console.log('✅ Added warehouse_id column to locations table');

    await queryInterface.addColumn('locations', 'branch_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'branches',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
    console.log('✅ Added branch_id column to locations table');
  },

  async down (queryInterface, Sequelize) {
    console.log('🔧 Removing warehouse_id and branch_id columns from locations table...');

    await queryInterface.removeColumn('locations', 'warehouse_id');
    await queryInterface.removeColumn('locations', 'branch_id');

    console.log('✅ Removed warehouse_id and branch_id columns from locations table');
  }
};
