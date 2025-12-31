const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkForeignKeys() {
  const tables = [
    'payments',
    'sale_payments', 
    'sales',
    'sale_items',
    'job_sheets',
    'warranty_claims',
    'product_returns'
  ];

  console.log('=== CHECKING FOREIGN KEY COLUMNS ===\n');

  for (const table of tables) {
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = $1
      AND (column_name LIKE '%_by%' OR column_name LIKE '%_to%' OR column_name LIKE '%sold%')
      ORDER BY ordinal_position
    `, [table]);

    console.log(`\n${table.toUpperCase()}:`);
    if (result.rows.length > 0) {
      result.rows.forEach(row => {
        console.log(`  - ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
      });
    } else {
      console.log('  (no FK columns found)');
    }
  }

  await pool.end();
}

checkForeignKeys().catch(console.error);
