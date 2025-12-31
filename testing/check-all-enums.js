require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function checkEnums() {
  try {
    // Check all enum types
    const result = await pool.query(`
      SELECT t.typname, string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder) as values
      FROM pg_type t 
      JOIN pg_enum e ON t.oid = e.enumtypid
      WHERE t.typname LIKE '%reference%' OR t.typname LIKE '%stock%'
      GROUP BY t.typname
      ORDER BY t.typname;
    `);
    
    console.log('Reference/Stock related enum types in database:');
    console.table(result.rows);
    
    // Also check the actual column type
    const colResult = await pool.query(`
      SELECT column_name, data_type, udt_name
      FROM information_schema.columns
      WHERE table_name = 'product_stock_movements'
      AND column_name = 'reference_type';
    `);
    
    console.log('\nreference_type column info:');
    console.table(colResult.rows);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally{
    await pool.end();
  }
}

checkEnums();
