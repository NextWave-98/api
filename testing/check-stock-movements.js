const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false
});

async function checkProductStockMovements() {
  try {
    const [columns] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'product_stock_movements'
      ORDER BY ordinal_position
    `);

    console.log('📋 PRODUCT_STOCK_MOVEMENTS table structure:');
    console.log('━'.repeat(100));
    columns.forEach((col, idx) => {
      console.log(`${idx + 1}. ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'} ${col.column_default ? 'DEFAULT: ' + col.column_default : ''}`);
    });

    await sequelize.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkProductStockMovements();