require('dotenv').config();
const { Client } = require('pg');

async function checkTable() {
  const client = new Client(process.env.DATABASE_URL);
  
  try {
    await client.connect();
    console.log('Connected to database\n');
    
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'product_returns' 
      ORDER BY ordinal_position
    `);
    
    console.log('product_returns table columns (' + result.rows.length + ' total):');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name.padEnd(30)} (${row.data_type})`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

checkTable();
