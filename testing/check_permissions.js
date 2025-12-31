const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false
});

async function checkRoles() {
  try {
    const [columns] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'roles'
      ORDER BY ordinal_position
    `);

    console.log('Roles table columns:');
    columns.forEach(col => {
      console.log(`${col.column_name} (${col.data_type}) - nullable: ${col.is_nullable}`);
    });

    await sequelize.close();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkRoles();