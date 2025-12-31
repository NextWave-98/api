'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Remove remaining invalid relation columns

    // inventory
    const inventoryColumns = ['part', 'location'];
    for (const col of inventoryColumns) {
      try {
        await queryInterface.removeColumn('inventory', col);
      } catch (error) {
        console.log(`Column ${col} not found in inventory, skipping...`);
      }
    }

    // inventory_zones
    try {
      await queryInterface.removeColumn('inventory_zones', 'warehouse');
    } catch (error) {
      console.log('Column warehouse not found in inventory_zones, skipping...');
    }

    // job_sheet_parts
    const jobSheetPartsColumns = ['job_sheet', 'part'];
    for (const col of jobSheetPartsColumns) {
      try {
        await queryInterface.removeColumn('job_sheet_parts', col);
      } catch (error) {
        console.log(`Column ${col} not found in job_sheet_parts, skipping...`);
      }
    }

    // job_sheet_products
    const jobSheetProductsColumns = ['job_sheet', 'product'];
    for (const col of jobSheetProductsColumns) {
      try {
        await queryInterface.removeColumn('job_sheet_products', col);
      } catch (error) {
        console.log(`Column ${col} not found in job_sheet_products, skipping...`);
      }
    }

    // product_returns
    try {
      await queryInterface.removeColumn('product_returns', 'notifications');
    } catch (error) {
      console.log('Column notifications not found in product_returns, skipping...');
    }
  },

  async down (queryInterface, Sequelize) {
    // Since these are invalid relation columns from Prisma migration,
    // we don't need to add them back in the rollback
    console.log('Rollback: Remaining invalid relation columns have been removed and will not be restored.');
  }
};
