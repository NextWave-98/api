'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    console.log('🔧 Adding created_by column to sales table...');

    // Check if created_by column already exists
    const tableDescription = await queryInterface.describeTable('sales');
    const hasCreatedBy = 'created_by' in tableDescription;

    if (!hasCreatedBy) {
      console.log('  🔄 Adding created_by column...');
      await queryInterface.addColumn('sales', 'created_by', {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });
      console.log('  ✓ created_by column added');
    } else {
      console.log('  ℹ️  created_by column already exists');
    }
  },

  async down(queryInterface, Sequelize) {
    console.log('🔄 Rolling back: Removing created_by column...');

    // Check if created_by column exists before removing
    const tableDescription = await queryInterface.describeTable('sales');
    const hasCreatedBy = 'created_by' in tableDescription;

    if (hasCreatedBy) {
      await queryInterface.removeColumn('sales', 'created_by');
      console.log('⚠️  created_by column removed');
    } else {
      console.log('ℹ️  created_by column does not exist');
    }
  }
};