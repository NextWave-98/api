require('dotenv').config();
const { Sequelize } = require('sequelize');
const sequelize = new Sequelize(process.env.DATABASE_URL, { logging: false });

async function checkColumns() {
  try {
    const [columns] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'sales'
      ORDER BY ordinal_position;
    `);
    
    console.log('Columns in sales table:');
    columns.forEach(col => {
      console.log(`  ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`);
    });
    
    sequelize.close();
  } catch (e) {
    console.error('Error:', e.message);
    sequelize.close();
  }
}

checkColumns();
