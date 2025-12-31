/**
 * Check current database schema to see what column naming convention is in use
 */

const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false
});

async function checkSchema() {
  try {
    console.log('🔍 Checking current database schema...\n');

    // Check key tables
    const tablesToCheck = ['users', 'inventory', 'product_inventory', 'products', 'sales', 'job_sheets', 'customers'];

    for (const tableName of tablesToCheck) {
      const [columns] = await sequelize.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = '${tableName}'
        ORDER BY ordinal_position
      `);

      console.log(`\n📋 Table: ${tableName}`);
      console.log('━'.repeat(60));
      
      if (columns.length === 0) {
        console.log('   ⚠️  Table not found');
      } else {
        columns.forEach(col => {
          const hasUpperCase = /[A-Z]/.test(col.column_name);
          const icon = hasUpperCase ? '🔴' : '🟢';
          console.log(`   ${icon} ${col.column_name} (${col.data_type})`);
        });
      }
    }

    console.log('\n\n━'.repeat(60));
    console.log('Legend:');
    console.log('🟢 = snake_case (correct for Sequelize underscored: true)');
    console.log('🔴 = camelCase (needs conversion)');
    console.log('━'.repeat(60));

    await sequelize.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await sequelize.close();
    process.exit(1);
  }
}

checkSchema();
