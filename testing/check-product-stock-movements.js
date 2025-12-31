require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
});

async function checkTable() {
  try {
    await sequelize.authenticate();
    
    const [results] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'product_stock_movements'
      ORDER BY ordinal_position;
    `);
    
    console.log('📋 product_stock_movements Table Columns:\n');
    results.forEach(col => {
      const nullable = col.is_nullable === 'YES' ? '(nullable)' : '';
      const defaultVal = col.column_default ? `(default: ${col.column_default})` : '';
      console.log(`  ✓ ${col.column_name}: ${col.data_type} ${nullable} ${defaultVal}`);
    });
    
    console.log(`\n✅ Total columns: ${results.length}`);
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkTable();
