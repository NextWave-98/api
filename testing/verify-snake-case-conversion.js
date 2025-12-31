/**
 * Database Column Verification Script
 * 
 * This script verifies that all database columns have been converted to snake_case
 * Run AFTER executing the three migration files
 */

const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DATABASE_URL!, {
  dialect: 'postgres',
  logging: false
});

const expectedSnakeCase = {
  users: ['id', 'username', 'password', 'email', 'phone', 'is_active', 'role_id', 'location_id', 'created_at', 'updated_at'],
  staff: ['id', 'user_id', 'first_name', 'last_name', 'national_id', 'department', 'position', 'hire_date', 'salary', 'location_id', 'created_at', 'updated_at'],
  locations: ['id', 'name', 'code', 'type', 'address', 'city', 'phone', 'email', 'is_active', 'manager_id', 'created_at', 'updated_at'],
  warehouses: ['id', 'location_id', 'warehouse_code', 'capacity', 'current_stock_level', 'created_at', 'updated_at'],
  branches: ['id', 'location_id', 'branch_code', 'created_at', 'updated_at'],
  inventory: ['id', 'part_id', 'warehouse_id', 'quantity', 'reorder_level', 'max_level', 'location_zone', 'last_restocked', 'created_at', 'updated_at'],
  parts: ['id', 'part_name', 'part_number', 'description', 'category', 'unit_price', 'supplier_id', 'reorder_level', 'is_active', 'created_at', 'updated_at'],
  product_inventory: ['id', 'product_id', 'location_id', 'quantity', 'reorder_level', 'max_level', 'last_restocked', 'created_at', 'updated_at'],
  products: ['id', 'product_code', 'product_name', 'description', 'category_id', 'unit_price', 'cost_price', 'is_active', 'created_at', 'updated_at'],
  customers: ['id', 'first_name', 'last_name', 'email', 'phone', 'address', 'city', 'postal_code', 'customer_type', 'is_active', 'created_at', 'updated_at'],
  job_sheets: ['id', 'job_number', 'customer_id', 'device_id', 'branch_id', 'assigned_to_id', 'status', 'priority', 'estimated_cost', 'actual_cost', 'deposit_amount', 'created_at', 'updated_at'],
  sales: ['id', 'sale_number', 'customer_id', 'branch_id', 'sold_by_id', 'sale_date', 'total_amount', 'tax_amount', 'discount_amount', 'payment_status', 'created_at', 'updated_at'],
  purchase_orders: ['id', 'po_number', 'supplier_id', 'location_id', 'order_date', 'expected_date', 'total_amount', 'status', 'created_by_id', 'created_at', 'updated_at'],
  stock_transfers: ['id', 'transfer_number', 'from_location_id', 'to_location_id', 'transfer_date', 'status', 'requested_by_id', 'approved_by_id', 'created_at', 'updated_at']
};

async function verifyColumnNaming() {
  try {
    console.log('🔍 Starting database column verification...\n');

    const [tables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        AND table_name NOT LIKE 'Sequelize%'
      ORDER BY table_name
    `);

    let totalTables = tables.length;
    let tablesWithCamelCase = [];
    let tablesWithSnakeCase = [];
    let issuesFound = [];

    for (const table of tables) {
      const tableName = table.table_name;
      
      const [columns] = await sequelize.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = '${tableName}'
        ORDER BY ordinal_position
      `);

      const columnNames = columns.map(col => col.column_name);
      
      // Check for camelCase (has uppercase letters that aren't at start)
      const camelCaseColumns = columnNames.filter(name => 
        /[a-z][A-Z]/.test(name)
      );

      if (camelCaseColumns.length > 0) {
        tablesWithCamelCase.push({
          table: tableName,
          columns: camelCaseColumns
        });
        issuesFound.push(`❌ ${tableName}: Found ${camelCaseColumns.length} camelCase columns: ${camelCaseColumns.join(', ')}`);
      } else {
        tablesWithSnakeCase.push(tableName);
      }

      // Verify expected columns if defined
      if (expectedSnakeCase[tableName]) {
        const missingColumns = expectedSnakeCase[tableName].filter(
          expectedCol => !columnNames.includes(expectedCol)
        );
        
        if (missingColumns.length > 0) {
          issuesFound.push(`⚠️  ${tableName}: Missing expected columns: ${missingColumns.join(', ')}`);
        }
      }
    }

    // Print Results
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 VERIFICATION SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log(`Total Tables: ${totalTables}`);
    console.log(`✅ Tables with snake_case: ${tablesWithSnakeCase.length}`);
    console.log(`❌ Tables with camelCase: ${tablesWithCamelCase.length}\n`);

    if (issuesFound.length > 0) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('⚠️  ISSUES FOUND');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      issuesFound.forEach(issue => console.log(issue));
      console.log('');
    }

    if (tablesWithSnakeCase.length > 0) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('✅ TABLES SUCCESSFULLY CONVERTED');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      tablesWithSnakeCase.forEach(table => console.log(`✅ ${table}`));
      console.log('');
    }

    // Final Status
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    if (tablesWithCamelCase.length === 0 && issuesFound.length === 0) {
      console.log('✅ SUCCESS: All database columns are in snake_case format!');
      console.log('✅ Your Sequelize models with underscored: true will work correctly.');
      console.log('✅ You can now test your API endpoints.');
    } else {
      console.log('❌ MIGRATION INCOMPLETE: Some tables still have camelCase columns.');
      console.log('⚠️  Please run the migration files:');
      console.log('   1. 20251213090000-convert-all-to-snake-case-part1.js');
      console.log('   2. 20251213090001-convert-all-to-snake-case-part2.js');
      console.log('   3. 20251213090002-convert-all-to-snake-case-part3.js');
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    await sequelize.close();
    process.exit(tablesWithCamelCase.length === 0 ? 0 : 1);

  } catch (error) {
    console.error('❌ Error during verification:', error);
    await sequelize.close();
    process.exit(1);
  }
}

// Run verification
verifyColumnNaming();
