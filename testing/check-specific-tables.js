const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DATABASE_URL);

async function checkTables() {
  try {
    const tables = ['products', 'product_categories', 'inventory', 'parts', 'product_inventory'];
    
    for (const table of tables) {
      console.log(`\n📋 Table: ${table}`);
      const [results] = await sequelize.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = '${table}' 
        ORDER BY ordinal_position
      `);
      
      if (results.length === 0) {
        console.log('  ❌ Table does not exist');
      } else {
        results.forEach(r => {
          const hasCamelCase = /[a-z][A-Z]/.test(r.column_name);
          const marker = hasCamelCase ? '⚠️ ' : '✓ ';
          console.log(`  ${marker}${r.column_name}: ${r.data_type}`);
        });
      }
    }
    
    await sequelize.close();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkTables();
