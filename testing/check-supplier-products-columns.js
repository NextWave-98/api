const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('ecom', 'postgres', '0726', {
  host: 'localhost',
  dialect: 'postgres',
  logging: false,
});

async function checkColumns() {
  try {
    const [columns] = await sequelize.query(`
      SELECT column_name, data_type, character_maximum_length, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'supplier_products'
      ORDER BY ordinal_position;
    `);

    console.log('\n=== supplier_products table columns ===\n');
    columns.forEach(col => {
      console.log(`${col.column_name} (${col.data_type}${col.character_maximum_length ? `(${col.character_maximum_length})` : ''}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });

    await sequelize.close();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkColumns();
