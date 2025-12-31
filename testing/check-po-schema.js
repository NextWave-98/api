const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false
});

async function checkPurchaseOrdersSchema() {
  try {
    console.log('🔍 Checking purchase_orders table schema...\n');

    const [columns] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'purchase_orders'
      ORDER BY ordinal_position
    `);

    console.log('Columns in purchase_orders table:');
    console.log('━'.repeat(80));
    columns.forEach(col => {
      console.log(`  ${col.column_name.padEnd(25)} ${col.data_type.padEnd(15)} nullable: ${col.is_nullable.padEnd(5)} default: ${col.column_default || 'null'}`);
    });

    await sequelize.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkPurchaseOrdersSchema();