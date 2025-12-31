require('dotenv').config();
const { Client } = require('pg');

const client = new Client({ connectionString: process.env.DATABASE_URL });

client.connect()
  .then(() => {
    return client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'warranty_cards' 
      AND column_name LIKE '%sku%' 
      ORDER BY ordinal_position
    `);
  })
  .then(res => {
    console.log('Warranty Cards SKU columns:');
    console.log(JSON.stringify(res.rows, null, 2));
    
    return client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'sale_items' 
      AND column_name LIKE '%sku%' 
      ORDER BY ordinal_position
    `);
  })
  .then(res => {
    console.log('\nSale Items SKU columns:');
    console.log(JSON.stringify(res.rows, null, 2));
    client.end();
  })
  .catch(err => {
    console.error('Error:', err);
    client.end();
  });
