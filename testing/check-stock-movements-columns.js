const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

async function checkColumns() {
  try {
    await client.connect();
    
    const result = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'product_stock_movements' 
      ORDER BY ordinal_position;
    `);
    
    console.log('Columns in product_stock_movements:');
    result.rows.forEach(r => {
      console.log(`  ${r.column_name} (${r.data_type})`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

checkColumns();
