'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    console.log('🔧 Adding missing columns to sales tables...');

    // Add warranty_card to sale_items if not exists
    const saleItemsDescription = await queryInterface.describeTable('sale_items');
    if (!('warranty_card' in saleItemsDescription)) {
      console.log('  🔄 Adding warranty_card column to sale_items...');
      await queryInterface.addColumn('sale_items', 'warranty_card', {
        type: Sequelize.STRING,
        allowNull: true
      });
      console.log('  ✓ warranty_card column added to sale_items');
    } else {
      console.log('  ℹ️  warranty_card column already exists in sale_items');
    }

    // Add reference_number to sale_payments if not exists
    const salePaymentsDescription = await queryInterface.describeTable('sale_payments');
    if (!('reference_number' in salePaymentsDescription)) {
      console.log('  🔄 Adding reference_number column to sale_payments...');
      await queryInterface.addColumn('sale_payments', 'reference_number', {
        type: Sequelize.STRING,
        allowNull: true
      });
      console.log('  ✓ reference_number column added to sale_payments');
    } else {
      console.log('  ℹ️  reference_number column already exists in sale_payments');
    }
  },

  async down(queryInterface, Sequelize) {
    console.log('🔄 Rolling back: Removing added columns...');

    // Remove warranty_card from sale_items if exists
    const saleItemsDescription = await queryInterface.describeTable('sale_items');
    if ('warranty_card' in saleItemsDescription) {
      await queryInterface.removeColumn('sale_items', 'warranty_card');
      console.log('⚠️  warranty_card column removed from sale_items');
    } else {
      console.log('ℹ️  warranty_card column does not exist in sale_items');
    }

    // Remove reference_number from sale_payments if exists
    const salePaymentsDescription = await queryInterface.describeTable('sale_payments');
    if ('reference_number' in salePaymentsDescription) {
      await queryInterface.removeColumn('sale_payments', 'reference_number');
      console.log('⚠️  reference_number column removed from sale_payments');
    } else {
      console.log('ℹ️  reference_number column does not exist in sale_payments');
    }
  }
};
