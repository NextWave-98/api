const { Sequelize } = require('sequelize');
require('dotenv').config();

async function checkColumns() {
  const sequelize = new Sequelize(process.env.DATABASE_URL);

  try {
    const result = await sequelize.query(`
      SELECT column_name, is_nullable, column_default, data_type
      FROM information_schema.columns
      WHERE table_name = 'job_sheets' AND table_schema = 'public'
      AND column_name LIKE '%job%'
      ORDER BY column_name;
    `);

    console.log('Job-related columns in job_sheets:');
    result[0].forEach(col => {
      console.log(`${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${col.column_default ? 'DEFAULT ' + col.column_default : ''}`);
    });

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

checkColumns();