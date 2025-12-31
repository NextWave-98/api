const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize({
  dialect: 'postgres',
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  logging: false,
});

async function checkProductCategories() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Connected successfully.');

    console.log('\nTABLE: PRODUCT_CATEGORIES');
    console.log('============================================================');

    const [columns] = await sequelize.query(`
      SELECT
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'product_categories'
      ORDER BY ordinal_position;
    `);

    console.log(`Total columns: ${columns.length}\n`);

    columns.forEach(col => {
      const type = col.data_type === 'character varying' ? 'character varying' :
                   col.data_type === 'timestamp with time zone' ? 'timestamp with time zone' :
                   col.data_type === 'boolean' ? 'boolean' :
                   col.data_type === 'integer' ? 'integer' :
                   col.data_type === 'uuid' ? 'uuid' : col.data_type;
      const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
      const defaultVal = col.column_default ? `DEFAULT ${col.column_default}` : '';
      console.log(`  • ${col.column_name.padEnd(35)} ${type.padEnd(20)} ${nullable} ${defaultVal}`);
    });

    console.log('============================================================');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkProductCategories();