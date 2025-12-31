require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function checkColumnTypes() {
  try {
    const result = await pool.query(`
      SELECT column_name, data_type, numeric_precision, numeric_scale
      FROM information_schema.columns
      WHERE table_name = 'product_inventory'
      AND column_name IN ('average_cost', 'total_value', 'quantity', 'reserved_quantity', 'available_quantity')
      ORDER BY column_name;
    `);
    
    console.log('Product Inventory Column Types:');
    console.table(result.rows);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkColumnTypes();
