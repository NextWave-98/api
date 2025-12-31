require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function checkEnums() {
  try {
    // Check reference_type_enum values
    const result = await pool.query(`
      SELECT e.enumlabel as value
      FROM pg_type t 
      JOIN pg_enum e ON t.oid = e.enumtypid
      WHERE t.typname = 'reference_type_enum'
      ORDER BY e.enumsortorder;
    `);
    
    console.log('Database reference_type_enum values:');
    result.rows.forEach(row => console.log('-', row.value));
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally{
    await pool.end();
  }
}

checkEnums();
