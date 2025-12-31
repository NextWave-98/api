const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function checkMigrations() {
  try {
    const result = await pool.query('SELECT name FROM "SequelizeMeta" ORDER BY name DESC LIMIT 10');
    console.log('Last 10 migrations:');
    result.rows.forEach(row => console.log('  -', row.name));
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkMigrations();
