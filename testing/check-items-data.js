const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false
});

async function checkItemsData() {
  try {
    console.log('🔍 Checking items column data in purchase_orders...\n');

    const [rows] = await sequelize.query('SELECT id, po_number, items FROM purchase_orders LIMIT 5');

    console.log('Sample purchase_orders with items column:');
    console.log('━'.repeat(80));
    rows.forEach(row => {
      console.log(`ID: ${row.id}`);
      console.log(`PO: ${row.po_number}`);
      console.log(`Items: ${row.items ? row.items.substring(0, 100) + '...' : 'NULL'}`);
      console.log('─'.repeat(40));
    });

    await sequelize.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkItemsData();