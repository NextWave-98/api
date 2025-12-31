require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function addEnumValue() {
  try {
    console.log('Adding STOCK_TRANSFER to reference_type enum...\n');
    
    await pool.query(`
      ALTER TYPE "enum_product_stock_movements_reference_type" 
      ADD VALUE 'STOCK_TRANSFER';
    `);
    
    console.log('✅ Successfully added STOCK_TRANSFER to enum');
    
    // Verify
    const result = await pool.query(`
      SELECT e.enumlabel as value
      FROM pg_type t 
      JOIN pg_enum e ON t.oid = e.enumtypid
      WHERE t.typname = 'enum_product_stock_movements_reference_type'
      ORDER BY e.enumsortorder;
    `);
    
    console.log('\nUpdated enum values:');
    result.rows.forEach(row => console.log('-', row.value));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally{
    await pool.end();
  }
}

addEnumValue();
