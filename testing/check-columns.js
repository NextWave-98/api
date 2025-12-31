require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('postgresql://postgres:0726@localhost:5432/ecom', {
  logging: false,
  dialect: 'postgres'
});

async function checkColumns() {
  try {
    console.log('\n=== Checking Database Columns for ALL Tables ===\n');
    
    const tables = [
      'warranty_cards',
      'warranty_claims', 
      'sales',
      'sale_items',
      'sale_refunds',
      'notifications',
      'payments',
      'customers',
      'products',
      'product_categories',
      'stock_movements',
      'stock_transfers',
      'stock_transfer_items',
      'purchase_orders',
      'job_sheets',
      'users',
      'roles',
      'branches',
      'suppliers',
      'staff'
    ];

    const analysisResults = [];

    for (const tableName of tables) {
      const [columns] = await sequelize.query(`
        SELECT column_name, data_type
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = $1
        ORDER BY ordinal_position;
      `, { bind: [tableName] });
      
      if (columns.length === 0) {
        console.log(`${tableName.toUpperCase()}: ⚠️  TABLE DOES NOT EXIST\n`);
        continue;
      }

      console.log(`\n${'='.repeat(70)}`);
      console.log(`${tableName.toUpperCase()} TABLE:`);
      console.log('='.repeat(70));
      console.log(`Total columns: ${columns.length}`);
      
      columns.forEach(col => {
        console.log(`  - ${col.column_name.padEnd(35)} (${col.data_type})`);
      });
      
      // Analyze naming convention
      const camelCaseColumns = columns.filter(c => 
        /[A-Z]/.test(c.column_name)
      );
      
      const snakeCaseColumns = columns.filter(c => 
        c.column_name.includes('_')
      );

      const singleWordColumns = columns.filter(c => 
        !c.column_name.includes('_') && !/[A-Z]/.test(c.column_name)
      );
      
      console.log('\nNaming Convention Analysis:');
      console.log(`  - snake_case columns: ${snakeCaseColumns.length}`);
      console.log(`  - camelCase columns: ${camelCaseColumns.length}`);
      console.log(`  - single word columns: ${singleWordColumns.length}`);
      
      if (camelCaseColumns.length > 0) {
        console.log('\n  🔴 CamelCase columns found:');
        camelCaseColumns.forEach(c => console.log(`     - ${c.column_name}`));
      }

      analysisResults.push({
        table: tableName,
        total: columns.length,
        snakeCase: snakeCaseColumns.length,
        camelCase: camelCaseColumns.length,
        singleWord: singleWordColumns.length,
        camelCaseColumns: camelCaseColumns.map(c => c.column_name)
      });
    }

    // Summary
    console.log('\n\n' + '='.repeat(70));
    console.log('SUMMARY - NAMING CONVENTION ISSUES');
    console.log('='.repeat(70));
    
    const tablesWithCamelCase = analysisResults.filter(r => r.camelCase > 0);
    
    if (tablesWithCamelCase.length > 0) {
      console.log(`\n⚠️  Found ${tablesWithCamelCase.length} tables with camelCase columns:\n`);
      tablesWithCamelCase.forEach(result => {
        console.log(`${result.table}:`);
        console.log(`  Total: ${result.total} | snake_case: ${result.snakeCase} | camelCase: ${result.camelCase}`);
        console.log(`  Problem columns: ${result.camelCaseColumns.join(', ')}`);
        console.log();
      });
    } else {
      console.log('\n✅ All tables use consistent snake_case naming!\n');
    }
    
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    await sequelize.close();
    process.exit(1);
  }
}

checkColumns();
