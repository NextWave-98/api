'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Remove invalid relation columns from all tables

    // job_sheets
    const jobSheetsColumns = ['repairs', 'parts', 'products', 'payments', 'status_history', 'notifications', 'warranty_claim', 'customer', 'device', 'location', 'created_by', 'assigned_to'];
    for (const col of jobSheetsColumns) {
      try {
        await queryInterface.removeColumn('job_sheets', col);
      } catch (error) {
        console.log(`Column ${col} not found in job_sheets, skipping...`);
      }
    }

    // job_status_history
    try {
      await queryInterface.removeColumn('job_status_history', 'job_sheet');
    } catch (error) {
      console.log('Column job_sheet not found in job_status_history, skipping...');
    }

    // locations
    const locationsColumns = ['warehouse_id', 'branch_id'];
    for (const col of locationsColumns) {
      try {
        await queryInterface.removeColumn('locations', col);
      } catch (error) {
        console.log(`Column ${col} not found in locations, skipping...`);
      }
    }

    // notifications
    const notificationsColumns = ['customer', 'job_sheet', 'sale', 'product_return', 'recipient_user', 'parent_notification'];
    for (const col of notificationsColumns) {
      try {
        await queryInterface.removeColumn('notifications', col);
      } catch (error) {
        console.log(`Column ${col} not found in notifications, skipping...`);
      }
    }

    // parts
    const partsColumns = ['inventory', 'job_sheet_parts', 'stock_movements'];
    for (const col of partsColumns) {
      try {
        await queryInterface.removeColumn('parts', col);
      } catch (error) {
        console.log(`Column ${col} not found in parts, skipping...`);
      }
    }

    // payments
    const paymentsColumns = ['job_sheet', 'customer', 'received_by'];
    for (const col of paymentsColumns) {
      try {
        await queryInterface.removeColumn('payments', col);
      } catch (error) {
        console.log(`Column ${col} not found in payments, skipping...`);
      }
    }

    // po_status_history
    try {
      await queryInterface.removeColumn('po_status_history', 'purchase_order');
    } catch (error) {
      console.log('Column purchase_order not found in po_status_history, skipping...');
    }

    // product_inventory
    const productInventoryColumns = ['product', 'location'];
    for (const col of productInventoryColumns) {
      try {
        await queryInterface.removeColumn('product_inventory', col);
      } catch (error) {
        console.log(`Column ${col} not found in product_inventory, skipping...`);
      }
    }

    // product_returns
    const productReturnsColumns = ['location', 'customer', 'product', 'created_by'];
    for (const col of productReturnsColumns) {
      try {
        await queryInterface.removeColumn('product_returns', col);
      } catch (error) {
        console.log(`Column ${col} not found in product_returns, skipping...`);
      }
    }

    // product_stock_movements
    const productStockMovementsColumns = ['created_by', 'location'];
    for (const col of productStockMovementsColumns) {
      try {
        await queryInterface.removeColumn('product_stock_movements', col);
      } catch (error) {
        console.log(`Column ${col} not found in product_stock_movements, skipping...`);
      }
    }

    // repairs
    try {
      await queryInterface.removeColumn('repairs', 'job_sheet');
    } catch (error) {
      console.log('Column job_sheet not found in repairs, skipping...');
    }

    // sale_items
    const saleItemsColumns = ['sale', 'product'];
    for (const col of saleItemsColumns) {
      try {
        await queryInterface.removeColumn('sale_items', col);
      } catch (error) {
        console.log(`Column ${col} not found in sale_items, skipping...`);
      }
    }

    // sale_payments
    const salePaymentsColumns = ['sale', 'received_by'];
    for (const col of salePaymentsColumns) {
      try {
        await queryInterface.removeColumn('sale_payments', col);
      } catch (error) {
        console.log(`Column ${col} not found in sale_payments, skipping...`);
      }
    }

    // sale_refunds
    const saleRefundsColumns = ['sale', 'processed_by'];
    for (const col of saleRefundsColumns) {
      try {
        await queryInterface.removeColumn('sale_refunds', col);
      } catch (error) {
        console.log(`Column ${col} not found in sale_refunds, skipping...`);
      }
    }

    // sales
    const salesColumns = ['items', 'payments', 'refunds', 'warranty_cards', 'notifications', 'customer', 'location', 'sold_by'];
    for (const col of salesColumns) {
      try {
        await queryInterface.removeColumn('sales', col);
      } catch (error) {
        console.log(`Column ${col} not found in sales, skipping...`);
      }
    }

    // stock_movements
    try {
      await queryInterface.removeColumn('stock_movements', 'part');
    } catch (error) {
      console.log('Column part not found in stock_movements, skipping...');
    }

    // stock_release_items
    const stockReleaseItemsColumns = ['stock_release', 'product'];
    for (const col of stockReleaseItemsColumns) {
      try {
        await queryInterface.removeColumn('stock_release_items', col);
      } catch (error) {
        console.log(`Column ${col} not found in stock_release_items, skipping...`);
      }
    }

    // stock_releases
    const stockReleasesColumns = ['items', 'from_location', 'to_location'];
    for (const col of stockReleasesColumns) {
      try {
        await queryInterface.removeColumn('stock_releases', col);
      } catch (error) {
        console.log(`Column ${col} not found in stock_releases, skipping...`);
      }
    }

    // stock_transfer_items
    try {
      await queryInterface.removeColumn('stock_transfer_items', 'stock_transfer');
    } catch (error) {
      console.log('Column stock_transfer not found in stock_transfer_items, skipping...');
    }

    // stock_transfers
    const stockTransfersColumns = ['items', 'from_warehouse', 'to_warehouse'];
    for (const col of stockTransfersColumns) {
      try {
        await queryInterface.removeColumn('stock_transfers', col);
      } catch (error) {
        console.log(`Column ${col} not found in stock_transfers, skipping...`);
      }
    }

    // supplier_return_items
    try {
      await queryInterface.removeColumn('supplier_return_items', 'supplier_return');
    } catch (error) {
      console.log('Column supplier_return not found in supplier_return_items, skipping...');
    }

    // supplier_returns
    const supplierReturnsColumns = ['items', 'supplier'];
    for (const col of supplierReturnsColumns) {
      try {
        await queryInterface.removeColumn('supplier_returns', col);
      } catch (error) {
        console.log(`Column ${col} not found in supplier_returns, skipping...`);
      }
    }

    // users
    const usersColumns = ['staff', 'location'];
    for (const col of usersColumns) {
      try {
        await queryInterface.removeColumn('users', col);
      } catch (error) {
        console.log(`Column ${col} not found in users, skipping...`);
      }
    }

    // warehouse_inventory
    try {
      await queryInterface.removeColumn('warehouse_inventory', 'warehouse');
    } catch (error) {
      console.log('Column warehouse not found in warehouse_inventory, skipping...');
    }

    // warehouse_staff
    try {
      await queryInterface.removeColumn('warehouse_staff', 'warehouse');
    } catch (error) {
      console.log('Column warehouse not found in warehouse_staff, skipping...');
    }

    // warranty_cards
    const warrantyCardsColumns = ['claims', 'sale', 'sale_item', 'product', 'customer', 'location'];
    for (const col of warrantyCardsColumns) {
      try {
        await queryInterface.removeColumn('warranty_cards', col);
      } catch (error) {
        console.log(`Column ${col} not found in warranty_cards, skipping...`);
      }
    }

    // warranty_claims
    const warrantyClaimsColumns = ['warranty_card', 'job_sheet', 'replacement_product', 'submitted_by', 'assigned_to', 'location'];
    for (const col of warrantyClaimsColumns) {
      try {
        await queryInterface.removeColumn('warranty_claims', col);
      } catch (error) {
        console.log(`Column ${col} not found in warranty_claims, skipping...`);
      }
    }
  },

  async down (queryInterface, Sequelize) {
    // Since these are invalid relation columns from Prisma migration,
    // we don't need to add them back in the rollback
    console.log('Rollback: Invalid relation columns have been removed and will not be restored.');
  }
};
